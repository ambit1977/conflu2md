// src/contentTree.js
import pLimit from './lib/p-limit.js';

// 定数定義
export const MAX_PAGES = 50000;        // 全体の取得上限（50000件）
const CHILD_PAGE_LIMIT = 100;           // 各 API 呼び出しで1回に取得する子ページ数
const DEFAULT_CONCURRENCY = 10;         // 通常の並列実行数
const LEVEL_THRESHOLD = 50;             // 同一階層での結果がこの数を超えた場合の閾値
const REDUCED_CONCURRENCY = 2;          // 結果が多い場合の並列実行数
const DELAY_MS = 500;                   // 各リクエスト間の遅延（500ms）

/**
 * スペースのコンテンツツリーを取得する関数
 * @param {string} domain - Confluence のドメイン
 * @param {string} spaceKey - スペースキー
 * @param {string} email - 認証用メールアドレス
 * @param {string} apiToken - 認証用 API トークン
 * @param {string|null} startPageId - 「今見ているページ配下」または「階層指定」時の起点ページID。指定がなければスペースホーム配下
 * @param {function} progressCallback - 子ページ取得ごとに呼ばれる進捗更新コールバック
 * @returns {object} { spaceName, tree, limitReached }
 */
export async function fetchPageTree(domain, spaceKey, email, apiToken, startPageId = null, progressCallback = () => {}) {
  const authHeader = 'Basic ' + btoa(`${email}:${apiToken}`);
  let rootId, rootTitle;
  
  try {
    if (startPageId) {
      const pageUrl = `https://${domain}/wiki/rest/api/content/${startPageId}`;
      const pageResponse = await fetch(pageUrl, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });
      if (!pageResponse.ok) {
        throw new Error(`HTTP error ${pageResponse.status} when fetching page info for startPageId ${startPageId}`);
      }
      const pageData = await pageResponse.json();
      rootId = pageData.id;
      rootTitle = pageData.title;
    } else {
      const spaceUrl = `https://${domain}/wiki/rest/api/space/${spaceKey}?expand=homepage`;
      const spaceResponse = await fetch(spaceUrl, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });
      if (!spaceResponse.ok) {
        throw new Error(`HTTP error ${spaceResponse.status} when fetching space info for ${spaceKey}`);
      }
      const spaceData = await spaceResponse.json();
      const homepage = spaceData.homepage;
      rootId = homepage.id;
      rootTitle = homepage.title;
    }
  } catch (error) {
    console.error("Error fetching root page information:", error);
    throw error;
  }
  
  const totalCounter = { count: 0 };
  let tree;
  try {
    tree = await fetchPageTreeRecursive(domain, rootId, authHeader, totalCounter, progressCallback);
  } catch (error) {
    console.error("Error during recursive page tree fetching:", error);
    throw error;
  }
  
  let spaceName;
  try {
    spaceName = await getSpaceName(domain, spaceKey, authHeader);
  } catch (error) {
    console.error("Error fetching space name:", error);
    spaceName = spaceKey;
  }
  
  return {
    spaceName: spaceName || spaceKey,
    tree: [{
      id: rootId,
      title: rootTitle,
      children: tree
    }],
    limitReached: totalCounter.count >= MAX_PAGES
  };
}

/**
 * 再帰的に子ページを取得してツリー構造を構築する関数
 * ページネーションおよび並列実行数の動的調整、リクエスト間のディレイを含む。
 * @param {string} domain
 * @param {string} pageId
 * @param {string} authHeader
 * @param {object} totalCounter
 * @param {function} progressCallback
 * @returns {Array} 子ページツリーの配列
 */
async function fetchPageTreeRecursive(domain, pageId, authHeader, totalCounter, progressCallback) {
  if (totalCounter.count >= MAX_PAGES) return [];
  
  let results = [];
  let apiUrl = `https://${domain}/wiki/rest/api/content/${pageId}/child/page?limit=${CHILD_PAGE_LIMIT}`;
  
  try {
    while (apiUrl && totalCounter.count < MAX_PAGES) {
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} when fetching children for pageId ${pageId}`);
      }
      const data = await response.json();
      if (data.results) {
        for (const child of data.results) {
          if (totalCounter.count >= MAX_PAGES) break;
          results.push(child);
          totalCounter.count++;
          if (progressCallback) progressCallback(1);
        }
      }
      if (data._links && data._links.next && totalCounter.count < MAX_PAGES) {
        let nextUrl = data._links.next;
        if (!nextUrl.startsWith('/wiki')) {
          nextUrl = '/wiki' + nextUrl;
        }
        apiUrl = `https://${domain}${nextUrl}`;
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      } else {
        apiUrl = null;
      }
    }
  } catch (error) {
    console.error(`Error fetching children of pageId ${pageId}:`, error);
    throw error;
  }
  
  // 並列実行数の動的調整
  const concurrency = results.length > LEVEL_THRESHOLD ? REDUCED_CONCURRENCY : DEFAULT_CONCURRENCY;
  const limit = pLimit(concurrency);
  
  const children = await Promise.all(
    results.map(async child => {
      if (totalCounter.count >= MAX_PAGES) {
        return { id: child.id, title: child.title, children: [] };
      }
      try {
        const subtree = await limit(() =>
          fetchPageTreeRecursive(domain, child.id, authHeader, totalCounter, progressCallback)
        );
        return {
          id: child.id,
          title: child.title,
          children: subtree
        };
      } catch (error) {
        console.error(`Error processing child page ${child.id}:`, error);
        throw error;
      }
    })
  );
  return children;
}

/**
 * スペース名を取得する補助関数
 * @param {string} domain
 * @param {string} spaceKey
 * @param {string} authHeader
 * @returns {string} スペース名
 */
async function getSpaceName(domain, spaceKey, authHeader) {
  const spaceUrl = `https://${domain}/wiki/rest/api/space/${spaceKey}`;
  try {
    const response = await fetch(spaceUrl, {
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} when fetching space name for ${spaceKey}`);
    }
    const data = await response.json();
    return data.name;
  } catch (error) {
    console.error("Error fetching space name:", error);
    throw error;
  }
}
