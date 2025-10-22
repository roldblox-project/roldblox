// Increment this number every time you push changes
const SITE_VERSION = "7.10";
const SITE_UPDATE_DESCRIPTION = `
  <h3>What's New in 7.10</h3>
  <ul>
    <li>Added Sounds back to ROLDBLOX Website, just click the sidebar button in the topbar and click unmute button</li>
    <li>Added a Sidebar menu</li>
    <li>Improved FAQ Search accuracy and better page for it</li>
  </ul>

  <h3>What's New in 7.9.1</h3>
  <ul>
    <li>Added Config Export/Load, which means you can now share configs, seeds, palettes, and cool patterns with your friends!</li>
  </ul>

  <h3>What's New in 7.9</h3>
  <ul>
    <li>Added Red Color (from the Roblox Mobile Welcome Screen), Green Color (Custom), and Yellow Color (Custom) to the Pattern Generator</li>
    <li>Fixed Lines appearing between triangles per tile in Pattern Generator</li>
  </ul>

  <h3>What's New in 7.8</h3>
  <ul>
    <li>Added the Pattern Generator (a really early release)</li>
    <li>Added new pattern presets</li>
  </ul>

  <h3>What's New in 7.7</h3>
  <ul>
    <li>Fixed fonts not working</li>
    <li>Made topbar more persistent</li>
    <li>Updated Buttons to use Roblox's Palletes</li>
    <li>Changed Page transition effect</li>
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
