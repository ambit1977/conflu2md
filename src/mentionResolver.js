// src/mentionResolver.js
export async function updateMentionsInMarkdown(markdown, authHeader, domain) {
    const regex = /@\[\s*account-id:([^\]]+)\s*\]/g;
    let match;
    const accountIds = new Set();
    while ((match = regex.exec(markdown)) !== null) {
      accountIds.add(match[1]);
    }
    const accountIdToName = {};
    const promises = Array.from(accountIds).map(accountId => {
      const url = `https://${domain}/wiki/rest/api/user?accountId=${encodeURIComponent(accountId)}`;
      return fetch(url, { headers: { 'Authorization': authHeader } })
        .then(response => response.json())
        .then(data => {
          accountIdToName[accountId] = data.displayName || "Unknown User";
        })
        .catch(() => {
          accountIdToName[accountId] = "Unknown User";
        });
    });
    await Promise.all(promises);
    return markdown.replace(regex, (match, accountId) => "@" + (accountIdToName[accountId] || "Unknown User"));
  }
  