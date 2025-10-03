// Increment this number every time you push changes
const SITE_VERSION = "7.5";
const SITE_UPDATE_DESCRIPTION = `
  <h3>What's New in 7.5</h3>
  <ul>
    <li>Changed FAQ to have working links that redirect you to the needed question</li>
    <li>Made the Discord card on the Community page have actual sense instead of having a button that leads to nowhere</li>
    <li>Made this update thingy look nicer</li>

  </ul>

  <h3>What's New in 7.4</h3>
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
