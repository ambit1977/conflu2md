// src/i18nHelper.js
export function updateI18nText() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (el.tagName.toLowerCase() === "input" && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", chrome.i18n.getMessage(key));
      } else {
        el.textContent = chrome.i18n.getMessage(key);
      }
    });
  }
  