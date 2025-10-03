// Increment this number every time you push changes
const SITE_VERSION = "7.4";
const SITE_UPDATE_DESCRIPTION = `
  <strong>What's New in 7.4</strong>
  <ul>
    <li>Added Update Description</li>
    <li>Changed some website elements to look more consistent and better</li>
    <li>Changed fonts to be more readable</li>
    <li>Fixed some pages to have centered cards</li>
    <li>Updated Logo Design</li>
  </ul>
  `;
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
