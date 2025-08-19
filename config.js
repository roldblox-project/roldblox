// Increment this number every time you push changes
const SITE_VERSION = "2";

(function () {
  // Update all CSS files
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.href = link.href.split("?")[0] + "?v=" + SITE_VERSION;
  });

  // Update all JS files except this config
  document.querySelectorAll("script[src]").forEach((script) => {
    if (!script.src.includes("config.js")) {
      script.src = script.src.split("?")[0] + "?v=" + SITE_VERSION;
    }
  });

  // Update all images
  document.querySelectorAll("img").forEach((img) => {
    img.src = img.src.split("?")[0] + "?v=" + SITE_VERSION;
  });

  // Optional: if your SPA dynamically loads HTML fragments via fetch
  window.fetchWithVersion = function (url, options = {}) {
    const separator = url.includes("?") ? "&" : "?";
    return fetch(url + separator + "v=" + SITE_VERSION, options);
  };
})();
