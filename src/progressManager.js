// src/progressManager.js
export function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressCountElem = document.getElementById('progressCount');
    progressContainer.style.display = 'block';
    progressBar.style.width = "0px";
    progressBar.style.backgroundColor = "#4285f4";
    progressCountElem.textContent = "";
    window.totalPagesLoaded = 0;
  }
  
  export function hideProgress() {
    // 必要に応じた非表示処理
  }
  
  export function progressIncrement(increment, totalPageCount) {
    window.totalPagesLoaded = (window.totalPagesLoaded || 0) + increment;
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressCountElem = document.getElementById('progressCount');
    const containerWidth = parseInt(window.getComputedStyle(progressContainer).width, 10);
    let ratio = window.totalPagesLoaded / totalPageCount;
    if (ratio > 1) ratio = 1;
    progressBar.style.width = (ratio * containerWidth) + "px";
    progressCountElem.textContent = `${window.totalPagesLoaded} / ${totalPageCount} pages loaded`;
  }
  