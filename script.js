// Single Page App Router
class Router {
  constructor() {
    this.currentPage = "home";
    this.pages = {
      home: "pages/home.html",
      "style-testing": "pages/style-testing.html",
      "sidebar-testing": "pages/sidebar-testing.html",
      "category-browser": "pages/category-browser.html",
      settings: "pages/settings.html",
      games: "pages/games.html",
      about: "pages/about.html",
      contact: "pages/contact.html",
      "game-view": "pages/game-view.html",
    };
    this.init();
  }

  async init() {
    // Load navbar
    await this.loadNavbar();
    this.initSidebarToggle();
    // Load initial page
    await this.route();
    // Listen for hash changes
    window.addEventListener("hashchange", () => this.route());
  }

  async loadNavbar() {
    try {
      const response = await fetch("navbar.html");
      const html = await response.text();
      document.getElementById("navbar-container").innerHTML = html;
    } catch (error) {
      console.error("Error loading navbar:", error);
    }
  }

  initSidebarToggle() {
    const syncSidebarWidth = () => {
      const sidebar = document.getElementById("sidebar");
      if (!sidebar) return;

      document.body.style.setProperty(
        "--sidebar-width",
        `${sidebar.getBoundingClientRect().width}px`
      );
    };

    const applySidebarState = (expanded) => {
      document.body.classList.toggle("sidebar-expanded", expanded);
      requestAnimationFrame(syncSidebarWidth);
    };

    const savedState = localStorage.getItem("sidebar-expanded");
    applySidebarState(savedState === "true");
    window.addEventListener("resize", syncSidebarWidth);

    document.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("#sidebar-toggle");
      if (!toggleButton) return;

      const nextState = !document.body.classList.contains("sidebar-expanded");
      localStorage.setItem("sidebar-expanded", String(nextState));
      applySidebarState(nextState);
    });
  }

  async route() {
    // Get page from URL hash
    let page = window.location.hash.slice(2) || "home";

    // Default to home if page doesn't exist
    if (!this.pages[page]) {
      page = "home";
      window.location.hash = "#/home";
    }

    this.currentPage = page;
    await this.loadPage(page);
    this.initializePage(page);
    this.updateActiveLinks();
  }

  async loadPage(page) {
    const pageFile = this.pages[page];
    if (!pageFile) return;

    try {
      const response = await fetch(pageFile);
      const html = await response.text();
      const container = document.getElementById("app-content");
      container.innerHTML = html;

      // Execute any inline scripts in loaded page HTML
      const scripts = Array.from(container.querySelectorAll("script"));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.replaceWith(newScript);
      });
    } catch (error) {
      console.error(`Error loading page ${page}:`, error);
      document.getElementById("app-content").innerHTML =
        "<p>Error loading page</p>";
    }
  }

  initializePage(page) {
    if (page === "category-browser") {
      this.initCategoryBrowser();
    }

    if (page === "settings") {
      this.initSettingsPage();
    }
  }

  initCategoryBrowser() {
    const categoryData = {
      general: {
        title: "General",
        description: "Use this panel to edit whatever belongs to the selected category.",
        fields: `
          <label class="page-browser-label" for="browser-name">Name</label>
          <input id="browser-name" type="text" class="textinput textinput-text page-browser-input" placeholder="Enter a name">

          <label class="page-browser-label" for="browser-description">Description</label>
          <textarea id="browser-description" class="textinput textinput-textarea page-browser-input page-browser-textarea" placeholder="Write a description"></textarea>

          <label class="checkbox-label" for="browser-enabled">
            <input id="browser-enabled" type="checkbox" class="checkbox checkbox-input">
            <span class="checkbox-text">Enabled</span>
          </label>

          <label class="page-browser-label" for="browser-mode">Mode</label>
          <select id="browser-mode" class="dropdown dropdown-basic page-browser-input">
            <option>Standard</option>
            <option>Compact</option>
            <option>Custom</option>
          </select>
        `,
      },
      appearance: {
        title: "Appearance",
        description: "Tune the visual style for the selected item.",
        fields: `
          <label class="page-browser-label" for="browser-color">Accent color</label>
          <input id="browser-color" type="text" class="textinput textinput-text page-browser-input" placeholder="rgb(50, 200, 100)">

          <label class="page-browser-label" for="browser-theme">Theme preset</label>
          <select id="browser-theme" class="dropdown dropdown-basic page-browser-input">
            <option>Classic</option>
            <option>Modern</option>
            <option>Flat</option>
          </select>

          <label class="checkbox-label" for="browser-shadows">
            <input id="browser-shadows" type="checkbox" class="checkbox checkbox-input" checked>
            <span class="checkbox-text">Enable shadows</span>
          </label>
        `,
      },
      behavior: {
        title: "Behavior",
        description: "Control how the item behaves in the interface.",
        fields: `
          <label class="page-browser-label" for="browser-speed">Animation speed</label>
          <select id="browser-speed" class="dropdown dropdown-basic page-browser-input">
            <option>Slow</option>
            <option selected>Normal</option>
            <option>Fast</option>
          </select>

          <label class="page-browser-label" for="browser-delay">Delay</label>
          <input id="browser-delay" type="text" class="textinput textinput-text page-browser-input" placeholder="250ms">

          <label class="checkbox-label" for="browser-loop">
            <input id="browser-loop" type="checkbox" class="checkbox checkbox-input">
            <span class="checkbox-text">Loop behavior</span>
          </label>
        `,
      },
      notifications: {
        title: "Notifications",
        description: "Choose how and when updates should appear.",
        fields: `
          <label class="page-browser-label" for="browser-channel">Channel</label>
          <select id="browser-channel" class="dropdown dropdown-basic page-browser-input">
            <option>Email</option>
            <option>In-app</option>
            <option>Both</option>
          </select>

          <label class="page-browser-label" for="browser-message">Message template</label>
          <textarea id="browser-message" class="textinput textinput-textarea page-browser-input page-browser-textarea" placeholder="Write the notification text"></textarea>

          <label class="checkbox-label" for="browser-muted">
            <input id="browser-muted" type="checkbox" class="checkbox checkbox-input">
            <span class="checkbox-text">Mute repeated alerts</span>
          </label>
        `,
      },
      privacy: {
        title: "Privacy",
        description: "Control visibility and access options.",
        fields: `
          <label class="page-browser-label" for="browser-visibility">Visibility</label>
          <select id="browser-visibility" class="dropdown dropdown-basic page-browser-input">
            <option>Everyone</option>
            <option>Friends</option>
            <option>Only me</option>
          </select>

          <label class="page-browser-label" for="browser-owner">Owner note</label>
          <input id="browser-owner" type="text" class="textinput textinput-text page-browser-input" placeholder="Optional note">

          <label class="checkbox-label" for="browser-private">
            <input id="browser-private" type="checkbox" class="checkbox checkbox-input" checked>
            <span class="checkbox-text">Private mode</span>
          </label>
        `,
      },
      advanced: {
        title: "Advanced",
        description: "Extra controls for testing edge cases and custom setups.",
        fields: `
          <label class="page-browser-label" for="browser-script">Script path</label>
          <input id="browser-script" type="text" class="textinput textinput-text page-browser-input" placeholder="/scripts/example.js">

          <label class="page-browser-label" for="browser-json">JSON data</label>
          <textarea id="browser-json" class="textinput textinput-textarea page-browser-input page-browser-textarea" placeholder="{ }"></textarea>

          <label class="checkbox-label" for="browser-advanced-toggle">
            <input id="browser-advanced-toggle" type="checkbox" class="checkbox checkbox-input">
            <span class="checkbox-text">Enable advanced overrides</span>
          </label>
        `,
      },
    };

    const root = document.querySelector("[data-browser-panel]");
    const titleEl = root?.querySelector("[data-browser-title]");
    const descEl = root?.querySelector("[data-browser-description]");
    const fieldsEl = root?.querySelector("[data-browser-fields]");
    const categoryButtons = Array.from(document.querySelectorAll(".page-browser-category"));

    if (!root || !titleEl || !descEl || !fieldsEl || !categoryButtons.length) return;

    const renderCategory = (categoryKey) => {
      const category = categoryData[categoryKey] || categoryData.general;
      titleEl.textContent = category.title;
      descEl.textContent = category.description;
      fieldsEl.innerHTML = category.fields;

      categoryButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.category === categoryKey);
      });
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => renderCategory(button.dataset.category));
    });

    renderCategory("general");
  }

  initSettingsPage() {
    const settingsData = {
      appearance: {
        title: "Appearance",
        description: "Choose the app style you want to use.",
        fields: `
          <label class="page-browser-label" for="settings-app-style">App Style</label>
          <select id="settings-app-style" class="dropdown dropdown-basic page-browser-input">
            <option>Classic Browser</option>
            <option>UWP</option>
            <option>Mobile</option>
          </select>
        `,
      },
    };

    const root = document.querySelector("[data-settings-panel]");
    const titleEl = root?.querySelector("[data-settings-title]");
    const descEl = root?.querySelector("[data-settings-description]");
    const fieldsEl = root?.querySelector("[data-settings-fields]");
    const categoryButtons = Array.from(document.querySelectorAll("[data-settings-category]"));

    if (!root || !titleEl || !descEl || !fieldsEl || !categoryButtons.length) return;

    const renderCategory = (categoryKey) => {
      const category = settingsData[categoryKey] || settingsData.appearance;
      titleEl.textContent = category.title;
      descEl.textContent = category.description;
      fieldsEl.innerHTML = category.fields;

      categoryButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.settingsCategory === categoryKey);
      });
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => renderCategory(button.dataset.settingsCategory));
    });

    renderCategory("appearance");
  }

  updateActiveLinks() {
    // Update navbar links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#/${this.currentPage}`) {
        link.classList.add("active");
      }
    });

    // Update sidebar links
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#/${this.currentPage}`) {
        link.classList.add("active");
      }
    });
  }
}

// Initialize router when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new Router();
});
