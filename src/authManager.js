// src/authManager.js
export function loadAuthInfo(callback) {
    chrome.storage.sync.get(['email', 'apiToken'], data => callback(data));
  }
  
  export function saveAuthInfo(key, value, callback) {
    chrome.storage.sync.set({ [key]: value }, () => { if(callback) callback(); });
  }
  
  export function updateAuthButtonStyle() {
    const emailVal = document.getElementById('email').value;
    const tokenVal = document.getElementById('apiToken').value;
    const toggleBtn = document.getElementById('toggleAuthBtn');
    toggleBtn.style.backgroundColor = (!emailVal || !tokenVal) ? "#e53935" : "#4285f4";
  }
  