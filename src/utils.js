// src/utils.js

export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function(e) {
        reject(e);
      };
      reader.readAsDataURL(blob);
    });
  }
  