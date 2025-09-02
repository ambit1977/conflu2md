// popup.js
import { updateI18nText } from './src/i18nHelper.js';
import { fetchTabInfo } from './src/tabInfo.js';
import { loadAuthInfo, saveAuthInfo, updateAuthButtonStyle } from './src/authManager.js';
import { fetchPageTree, MAX_PAGES } from './src/contentTree.js';
import { renderPageTree } from './src/renderTree.js';
import { showProgress, hideProgress, progressIncrement } from './src/progressManager.js';
import { getTotalPageCount, getChildPageCountForCurrentPage } from './src/api.js';
import { loadSiblingPages, hideSiblingList, addSiblingMasterCheckbox } from './src/siblingLoader.js';

let totalPageCount = 0; // 総件数を保持
// 現在のページ（「今見ているページ配下」）のタイトルを保持するグローバル変数
window.downloadRootTitle = "";

document.addEventListener('DOMContentLoaded', () => {
  updateI18nText();
  document.title = chrome.i18n.getMessage("appName");
  document.querySelector('h2').textContent = chrome.i18n.getMessage("appName");

  fetchTabInfo(info => {
    if (info.domain) {
      window.detectedDomain = info.domain;
      window.detectedSpaceKey = info.spaceKey;
      window.currentPageUrl = info.currentPageUrl;
      document.getElementById('domainDisplay').textContent =
        chrome.i18n.getMessage("domainLabel") + ": " + info.domain;
      document.getElementById('spaceKeyDisplay').textContent =
        chrome.i18n.getMessage("spaceKeyLabel") + ": " + info.spaceKey;
    } else {
      document.getElementById('domainDisplay').textContent =
        chrome.i18n.getMessage("domainNotFound");
    }
  });

  loadAuthInfo(data => {
    if (data.email) document.getElementById('email').value = data.email;
    if (data.apiToken) document.getElementById('apiToken').value = data.apiToken;
    updateAuthButtonStyle();
  });

  document.getElementById('email').addEventListener('blur', e => {
    saveAuthInfo('email', e.target.value, updateAuthButtonStyle);
  });
  document.getElementById('apiToken').addEventListener('blur', e => {
    saveAuthInfo('apiToken', e.target.value, updateAuthButtonStyle);
  });
  document.getElementById('toggleAuthBtn').addEventListener('click', () => {
    const authC = document.getElementById('authContainer');
    authC.style.display = (!authC.style.display || authC.style.display === 'none') ? 'block' : 'none';
  });

  // 低速モードの確認
  function isLowSpeedMode() {
    const checkbox = document.getElementById('lowSpeedMode');
    return checkbox ? checkbox.checked : false;
  }

  // 「今見ているページ配下」用：起点ページID取得
  function getStartPageId() {
    const select = document.getElementById('contentSourceSelect');
    if (select.value === "page") {
      const match = window.currentPageUrl.match(/\/pages\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  // ページツリー表示用のマスター（全選択/解除）チェックボックス追加
  function addMasterCheckbox() {
    const container = document.getElementById('pageTreeContainer');
    const exist = document.getElementById('masterCheckbox');
    if (exist) exist.remove();
    const masterCheckbox = document.createElement('input');
    masterCheckbox.type = 'checkbox';
    masterCheckbox.id = 'masterCheckbox';
    masterCheckbox.addEventListener('change', (e) => {
      const allCheckboxes = container.querySelectorAll('.page-checkbox');
      allCheckboxes.forEach(chk => { chk.checked = e.target.checked; });
    });
    const label = document.createElement('label');
    label.htmlFor = 'masterCheckbox';
    label.textContent = '全てチェック/外す';
    container.parentNode.insertBefore(masterCheckbox, container);
    container.parentNode.insertBefore(label, container);
  }

  // 自動チェック伝播設定：pageTreeContainer 内の .page-checkbox に change イベントを追加
  function addCheckboxListeners() {
    const container = document.getElementById('pageTreeContainer');
    const checkboxes = container.querySelectorAll('.page-checkbox');
    checkboxes.forEach(chk => {
      chk.addEventListener('change', (e) => {
        propagateCheckbox(e.target, e.target.checked);
      });
    });
  }
  
  // propagateCheckbox: 指定されたチェックボックスから子孫すべての .page-checkbox に状態を伝播
  function propagateCheckbox(checkbox, checked) {
    const liElem = checkbox.closest('li');
    if (!liElem) return;
    const descendantCheckboxes = liElem.querySelectorAll('.page-checkbox');
    descendantCheckboxes.forEach(chk => {
      chk.checked = checked;
    });
  }

  // 通常モードでの読み込み
  document.getElementById('loadTreeBtn').addEventListener('click', async () => {
    showProgress();
    hideSiblingList();
    const domain = window.detectedDomain;
    const spaceKey = window.detectedSpaceKey;
    const email = document.getElementById('email').value;
    const apiToken = document.getElementById('apiToken').value;
    if (!domain || !spaceKey || !email || !apiToken) {
      alert(chrome.i18n.getMessage("missingInfo"));
      hideProgress();
      return;
    }
    const contentSource = document.getElementById('contentSourceSelect').value;
    let startPageId = null;
    if (contentSource === "page") {
      startPageId = getStartPageId();
    } else if (contentSource === "level") {
      hideProgress();
      return; // 階層指定は loadSiblingPages() 経由
    }
    try {
      if (startPageId) {
        totalPageCount = await getChildPageCountForCurrentPage(domain, startPageId, email, apiToken);
      } else {
        totalPageCount = await getTotalPageCount(domain, spaceKey, email, apiToken);
      }
    } catch (error) {
      console.error("Error fetching total page count:", error);
      totalPageCount = "unknown";
    }
    try {
      const treeResult = await fetchPageTree(domain, spaceKey, email, apiToken, startPageId, (inc)=> progressIncrement(inc, totalPageCount), isLowSpeedMode());
      window.spaceName = treeResult.spaceName;
      // ここで、ルートのタイトルを保存（今見ているページのタイトル）
      if (treeResult.tree && treeResult.tree.length > 0) {
        window.downloadRootTitle = treeResult.tree[0].title;
      }
      const container = document.getElementById('pageTreeContainer');
      container.innerHTML = "";
      container.appendChild(renderPageTree(treeResult.tree, container));
      addCheckboxListeners();
      addMasterCheckbox();
      if (treeResult.limitReached) {
        document.getElementById('progressBar').style.backgroundColor = 'red';
        document.getElementById('progressCount').textContent =
          chrome.i18n.getMessage("limitExceededMessage", [String(MAX_PAGES)]);
      }
    } catch (error) {
      console.error("Error fetching page tree:", error);
      document.getElementById('progressBar').style.backgroundColor = 'red';
      document.getElementById('progressCount').textContent = "Error: " + error.message;
      hideProgress();
    }
  });

  // プルダウン変更：階層指定モードの場合、siblingListContainer を表示
  document.getElementById('contentSourceSelect').addEventListener('change', async (e) => {
    if(e.target.value === "level") {
      await loadSiblingPages();
    } else {
      hideSiblingList();
    }
  });

  // 階層指定モード：選択したページ配下のみを読み込む
  document.getElementById('loadSelectedBtn').addEventListener('click', async () => {
    hideProgress();
    const siblingListContainer = document.getElementById('siblingListContainer');
    // 選択した sibling チェックボックスから、id と title を取得
    const selected = Array.from(siblingListContainer.querySelectorAll('.sibling-checkbox'))
      .filter(chk => chk.checked)
      .map(chk => ({ id: chk.dataset.pageId, title: chk.dataset.title }));
    if (selected.length === 0) {
      alert(chrome.i18n.getMessage("selectAtLeastOneSibling"));
      return;
    }
    // ファイル名作成：チェックされた各項目の title をアンダースコアで連結
    const nameChain = selected.map(item => item.title);
    const fileName = `${window.detectedSpaceKey}_${nameChain.join('_')}.md`;
    window.downloadFileName = fileName;
    // 各選択されたページの子孫総数の合計を取得
    let totalCount = 0;
    for (const item of selected) {
      try {
        const count = await getChildPageCountForCurrentPage(window.detectedDomain, item.id,
          document.getElementById('email').value, document.getElementById('apiToken').value);
        totalCount += count;
      } catch (error) {
        console.error("Error fetching child page count for", item.id, error);
      }
    }
    totalPageCount = totalCount;
    let combinedTree = [];
    for (const item of selected) {
      try {
        const treeResult = await fetchPageTree(window.detectedDomain, window.detectedSpaceKey,
          document.getElementById('email').value, document.getElementById('apiToken').value,
          item.id, (inc)=> progressIncrement(inc, totalPageCount), isLowSpeedMode());
        combinedTree.push(...treeResult.tree);
      } catch (error) {
        console.error("Error fetching tree for sibling page", item.id, error);
      }
    }
    const container = document.getElementById('pageTreeContainer');
    container.innerHTML = "";
    combinedTree.forEach(t => container.appendChild(renderPageTree([t], container)));
    addCheckboxListeners();
    addMasterCheckbox();
    hideSiblingList();
    hideProgress();
  });

  // ダウンロードボタン：ファイル名生成
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.page-checkbox'))
      .filter(chk => chk.checked);
    if (!selected.length) {
      alert(chrome.i18n.getMessage("noPageSelected"));
      return;
    }
    let fileName = "";
    const contentSource = document.getElementById('contentSourceSelect').value;
    if (contentSource === "page") {
      // 今見ているページ配下のモード：ファイル名は「スペースキー_今見ているページのタイトル」
      fileName = `${window.detectedSpaceKey}_${window.downloadRootTitle || "page"}.md`;
    } else if (contentSource === "level") {
      fileName = window.downloadFileName || "download.md";
    } else {
      fileName = "download.md";
    }
    chrome.runtime.sendMessage({
      domain: window.detectedDomain,
      email: document.getElementById('email').value,
      apiToken: document.getElementById('apiToken').value,
      pageIds: selected.map(chk => chk.dataset.pageId),
      spaceName: window.spaceName,
      fileName: fileName
    }, res => console.log(res.message));
  });

  // 保存ボタン（単体）
  document.getElementById('saveCurrentPageBtn').addEventListener('click', () => {
    const match = window.currentPageUrl.match(/\/pages\/(\d+)/);
    if (!match) {
      alert(chrome.i18n.getMessage("pageIdNotExtracted", [window.currentPageUrl]));
      return;
    }
    chrome.runtime.sendMessage({
      domain: window.detectedDomain,
      email: document.getElementById('email').value,
      apiToken: document.getElementById('apiToken').value,
      pageIds: [match[1]]
    }, res => console.log(res.message));
  });
});
