// src/api.js
export async function getTotalPageCount(domain, spaceKey, email, apiToken) {
    const authHeader = 'Basic ' + btoa(`${email}:${apiToken}`);
    const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
    const url = `https://${domain}/wiki/rest/api/search?cql=${cql}&limit=0`;
    const response = await fetch(url, { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } });
    const data = await response.json();
    return data.totalSize;
  }
  
  export async function getChildPageCountForCurrentPage(domain, pageId, email, apiToken) {
    const authHeader = 'Basic ' + btoa(`${email}:${apiToken}`);
    const cql = encodeURIComponent(`ancestor="${pageId}" AND type=page`);
    const url = `https://${domain}/wiki/rest/api/search?cql=${cql}&limit=0`;
    const response = await fetch(url, { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } });
    const data = await response.json();
    return data.totalSize;
  }
  