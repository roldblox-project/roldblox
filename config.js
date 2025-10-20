// Increment this number every time you push changes
const SITE_VERSION = "7.9.1";
const SITE_UPDATE_DESCRIPTION = `
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

  <h3>What's New in 7.6</h3>
  <ul>
    <li>Can't believe I forgot this but changed the button from the mods page that says "What are mods" to actually give the faqs correct question</li>
    <li>Added a button to the homepage page that leads to the community/support us page</li>
    <li>Added a button to the mods page that leads to the assets page</li>
  </ul>

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
