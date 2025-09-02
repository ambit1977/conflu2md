// src/tabInfo.js
export function fetchTabInfo(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab && tab.url) {
        const urlObj = new URL(tab.url);
        const domain = urlObj.hostname;
        const segments = urlObj.pathname.split('/');
        let spaceKey = "";
        const index = segments.indexOf("spaces");
        if (index !== -1 && segments.length > index + 1) {
          spaceKey = segments[index + 1];
        }
        callback({
          domain,
          spaceKey,
          currentPageUrl: tab.url
        });
      } else {
        callback({ domain: null, spaceKey: null, currentPageUrl: null });
      }
    });
  }
  