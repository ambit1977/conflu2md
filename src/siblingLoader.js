// src/siblingLoader.js
export async function loadSiblingPages() {
    const domain = window.detectedDomain;
    const email = document.getElementById('email').value;
    const apiToken = document.getElementById('apiToken').value;
    const authHeader = 'Basic ' + btoa(`${email}:${apiToken}`);
    
    // まず、現在のページURLから /pages/(\d+) による抽出を試みる
    let currentPageId;
    const regexResult = window.currentPageUrl.match(/\/pages\/(\d+)/);
    if (regexResult) {
      currentPageId = regexResult[1];
    } else {
      // 数値のページIDが抽出できなかった場合（＝ホームページなど）
      // スペース情報APIでホームページIDを取得する
      const spaceKey = window.detectedSpaceKey;
      try {
        const spaceUrl = `https://${domain}/wiki/rest/api/space/${spaceKey}?expand=homepage`;
        const spaceResponse = await fetch(spaceUrl, {
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });
        if (!spaceResponse.ok) throw new Error(`HTTP error ${spaceResponse.status}`);
        const spaceData = await spaceResponse.json();
        if (spaceData.homepage && spaceData.homepage.id) {
          currentPageId = spaceData.homepage.id;
        }
      } catch (error) {
        alert("ホームページ情報の取得に失敗しました。");
        return;
      }
      if (!currentPageId) {
        // 必ず数値が得られるはずなので、エラー表示（エラーメッセージから {0} は削除済みの想定）
        alert(chrome.i18n.getMessage("pageIdNotExtracted"));
        return;
      }
    }
    
    // 以降は currentPageId を元に、親ページの子（＝同階層ページ）を取得する処理
    let pageData;
    try {
      const pageResponse = await fetch(`https://${domain}/wiki/rest/api/content/${currentPageId}`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });
      if (!pageResponse.ok) throw new Error(`HTTP error ${pageResponse.status}`);
      pageData = await pageResponse.json();
    } catch (error) {
      alert("現在のページ情報取得に失敗しました。");
      return;
    }
    
    // 親ページの取得：ホームの場合も現在のページを親とみなす
    let parentId;
    if (!pageData.ancestors || pageData.ancestors.length === 0) {
      parentId = currentPageId;
    } else {
      parentId = pageData.ancestors[pageData.ancestors.length - 1].id;
    }
    
    let siblingData;
    try {
      const siblingUrl = `https://${domain}/wiki/rest/api/content/${parentId}/child/page?limit=100`;
      const siblingResponse = await fetch(siblingUrl, { 
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } 
      });
      if (!siblingResponse.ok) throw new Error(`HTTP error ${siblingResponse.status}`);
      siblingData = await siblingResponse.json();
    } catch (error) {
      alert("同階層ページの取得に失敗しました。");
      return;
    }
    
    const siblingListContainer = document.getElementById('siblingListContainer');
    siblingListContainer.innerHTML = "";
    addSiblingMasterCheckbox();
    const instruction = document.createElement('div');
    instruction.style.color = 'red';
    // ※ エラーメッセージ中の {0} も表示されないように、messages.json の "pageIdNotExtracted" を修正済みと想定
    instruction.textContent = chrome.i18n.getMessage("selectLevelInstruction", ["ページリストを読み込みたい階層にチェックを入れてください"]);
    siblingListContainer.appendChild(instruction);
    
    siblingData.results.forEach(sibling => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('sibling-wrapper');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('sibling-checkbox');
      checkbox.dataset.pageId = sibling.id;
      // タイトル情報を必ずセット
      checkbox.dataset.title = sibling.title;
      // ※ 「階層を指定して読込」では子階層の自動展開は行わない
      label.appendChild(checkbox);
      label.append(" " + sibling.title);
      wrapper.appendChild(label);
      siblingListContainer.appendChild(wrapper);
    });
    siblingListContainer.style.display = 'block';
    document.getElementById('loadSelectedBtn').style.display = 'inline-block';
  }
  
  export function hideSiblingList() {
    const siblingListContainer = document.getElementById('siblingListContainer');
    siblingListContainer.innerHTML = "";
    siblingListContainer.style.display = 'none';
    document.getElementById('loadSelectedBtn').style.display = 'none';
  }
  
  function addSiblingMasterCheckbox() {
    const container = document.getElementById('siblingListContainer');
    const exist = container.querySelector('#siblingMasterCheckbox');
    if (exist) exist.remove();
    const masterCheckbox = document.createElement('input');
    masterCheckbox.type = 'checkbox';
    masterCheckbox.id = 'siblingMasterCheckbox';
    masterCheckbox.addEventListener('change', (e) => {
      const checkboxes = container.querySelectorAll('.sibling-checkbox');
      checkboxes.forEach(chk => { chk.checked = e.target.checked; });
    });
    const label = document.createElement('label');
    label.htmlFor = 'siblingMasterCheckbox';
    label.textContent = '全てチェック/外す';
    container.insertBefore(masterCheckbox, container.firstChild);
    container.insertBefore(label, container.firstChild);
  }
  
  export { addSiblingMasterCheckbox };
  