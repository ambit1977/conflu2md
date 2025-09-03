// background.js
import { blobToDataURL } from './src/utils.js';
import { simpleHtmlToMarkdown } from './src/markdownConverter.js';
import { updateMentionsInMarkdown } from './src/mentionResolver.js'; // 利用している場合

console.log("Starting background.js with combined pages Markdown generation.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);
  const { email, apiToken, pageIds } = request;
  const domain = request.domain;
  
  // 必要な情報の検証
  if (!domain || !email || !apiToken || !pageIds || pageIds.length === 0) {
    console.error("Missing required information:", { domain, email: !!email, apiToken: !!apiToken, pageIds });
    sendResponse({ message: 'Missing required information' });
    return true;
  }
  
  const authHeader = 'Basic ' + btoa(`${email}:${apiToken}`);
  console.log("Using domain:", domain);
  console.log("Email:", email);
  console.log("Page IDs:", pageIds);

  // グローバルに Promise.all の結果を保持する変数
  let globalPagesMarkdown = [];

  let markdownPromises = pageIds.map((pageId) => {
    const url = `https://${domain}/wiki/rest/api/content/${pageId}?expand=body.storage,version,history,_links`;
    console.log("Fetching URL for page ID", pageId, ":", url);
    return fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log("Response received for page ID:", pageId, response);
        return response.json();
      })
      .then(async data => {
        console.log("Data received for page ID:", pageId, data);
        const htmlContent = data.body && data.body.storage && data.body.storage.value;
        if (!htmlContent) {
          console.warn(chrome.i18n.getMessage("msg_no_content", [pageId]));
          return '';
        }
        const title = data.title || "Untitled";
        const createdDate = data.history && data.history.createdDate ? data.history.createdDate : "";
        const updatedDate = data.version && data.version.when ? data.version.when : "";
        const createdBy = data.history && data.history.createdBy && data.history.createdBy.displayName ? data.history.createdBy.displayName : "";
        const updatedBy = data.version && data.version.by && data.version.by.displayName ? data.version.by.displayName : "";
        // ページURLは出力用に /wiki を必ず付与する
        const pageUrl = data._links && data._links.webui ? `https://${domain}/wiki${data._links.webui}` : "";

        let metaMarkdown = `# ${title}\n\n`;
        if (createdDate) {
          metaMarkdown += `*Created: ${createdDate} by ${createdBy}*\n`;
        }
        if (updatedDate) {
          metaMarkdown += `*Last Updated: ${updatedDate} by ${updatedBy}*\n`;
        }
        if (pageUrl) {
          metaMarkdown += `*URL: ${pageUrl}*\n`;
        }
        metaMarkdown += `\n---\n\n`;

        console.log("HTML content fetched for page ID:", pageId);

        let markdownContent;
        try {
          markdownContent = simpleHtmlToMarkdown(htmlContent, domain);
          // ※もしupdateMentionsInMarkdownを利用するならこちらも呼び出す（await updateMentionsInMarkdown(...)）
        } catch (e) {
          console.warn(chrome.i18n.getMessage("msg_conversion_error", [pageId, e.toString()]));
          return '';
        }

        return metaMarkdown + markdownContent + "\n\n";
      })
      .catch(error => {
        console.warn(chrome.i18n.getMessage("msg_fetch_error", [pageId, error.toString()]));
        return '';
      });
  });

  Promise.all(markdownPromises)
    .then((pagesMarkdown) => {
      globalPagesMarkdown = pagesMarkdown;  // Promise.all の結果をグローバル変数に保持
      const combinedMarkdown = pagesMarkdown.join("\n\n");
      console.log("Combined Markdown generated.");
      return combinedMarkdown;
    })
    .then((combinedMarkdown) => {
      const blob = new Blob([combinedMarkdown], { type: 'text/markdown' });
      return blobToDataURL(blob);
    })
    .then((downloadUrl) => {
      console.log("Download URL generated:", downloadUrl.substring(0, 100) + "...");
      let fileName = "";
      if (pageIds.length === 1) {
        const firstMarkdown = globalPagesMarkdown[0] || "";
        let title = "page";
        const match = firstMarkdown.match(/^#\s*(.+)$/m);
        if (match && match[1]) {
          title = match[1].trim();
        }
        fileName = `${title}.md`;
      } else {
        fileName = `${request.spaceName || "combined_pages"}.md`;
      }
      console.log("Download filename:", fileName);
      chrome.downloads.download({
        url: downloadUrl,
        filename: fileName,
        conflictAction: 'uniquify'
      }, (downloadId) => {
        console.log("Download initiated. Download ID:", downloadId);
        if (chrome.runtime.lastError) {
          console.error("Download error:", chrome.runtime.lastError);
        }
      });
    })
    .catch(error => {
      console.error("Error in background processing:", error);
      console.warn(chrome.i18n.getMessage("msg_combined_error", [error.toString()]));
    });

  console.log("Sending response: Processing started");
  sendResponse({ message: 'Processing started' });
  return true;
});
