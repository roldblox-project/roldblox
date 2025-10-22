const contentDiv = document.getElementById("content");
const links = document.querySelectorAll(".top-nav-link");

let navLinkCooldown = false;

const routes = {
  "/home": "pages/home.html",
  "/about": "pages/about.html",
  "/mods": "pages/mods.html",
  "/community": "pages/community.html",
  "/gallery": "pages/gallery.html",
  "/faqs": "pages/faqs.html",
  "/blog": "pages/blog.html",
  "/help": "pages/help.html",
  "/assets": "pages/assets.html",
  "/admin": "pages/admin.html",
  "/archive": "pages/archive.html",
  "/products": "pages/products.html",
  "/patterngenerator": "pages/pattern-generator.html",
};

function initFaqToggles(root = document) {
  const faqList = root.querySelector(".faq-list");
  if (!faqList) return;

  if (faqList._inited) return;
  faqList._inited = true;

  const faqItems = Array.from(faqList.querySelectorAll(".faq-item"));
  const original = faqList._original || faqItems.slice();
  faqList._original = original;

  const faqSearch = root.querySelector("#faqSearch");

  faqItems.forEach((item) => {
    if (!item.dataset.id) {
      const text = (
        item.querySelector(".faq-question span")?.textContent || "item"
      )
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      item.dataset.id = text || "faq-item";
    }
  });

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    if (question._clickAttached) return;
    question._clickAttached = true;

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("active")) {
          other.classList.remove("active");
          other.querySelector(".faq-answer")?.classList.remove("show");
        }
      });

      if (isActive) {
        item.classList.remove("active");
        answer.classList.remove("show");

        const [base, qs] = location.hash.split("?");
        const params = new URLSearchParams(qs || "");
        params.delete("open");
        history.replaceState(
          null,
          "",
          base + (params.toString() ? "?" + params.toString() : "")
        );
      } else {
        item.classList.add("active");
        answer.classList.add("show");

        const id = item.dataset.id;
        const [base, qs] = location.hash.split("?");
        const params = new URLSearchParams(qs || "");
        params.set("open", id);
        history.replaceState(
          null,
          "",
          base + (params.toString() ? "?" + params.toString() : "")
        );
      }
    });
  });

  if (faqSearch) {
    if (faqSearch._inputAttached) return;
    faqSearch._inputAttached = true;

    faqSearch.addEventListener("input", () => {
      const terms = faqSearch.value.toLowerCase().split(/\s+/).filter(Boolean);

      const [base, qs] = location.hash.split("?");
      const params = new URLSearchParams(qs || "");
      if (faqSearch.value) params.set("q", faqSearch.value);
      else params.delete("q")
      history.replaceState(
        null,
        "",
        base + (params.toString() ? "?" + params.toString() : "")
      );

      if (terms.length === 0) {
        faqList.innerHTML = "";
        original.forEach((item) => {
          item.style.display = "";
          faqList.appendChild(item);
        });
        const oldMsg = faqList.querySelector(".no-results-message");
        if (oldMsg) oldMsg.remove();
        return;
      }

      const scored = original.map((item) => {
        const text =
          item
            .querySelector(".faq-question span")
            ?.textContent?.toLowerCase() || "";
        const tags = (item.dataset.tags || "")
          .toLowerCase()
          .split(",")
          .map((t) => t.trim());
        const count = terms.reduce((sum, term) => {
          const inText = text.includes(term);
          const inTags = tags.some((tag) => tag.includes(term));
          return sum + (inText || inTags ? 1 : 0);
        }, 0);
        return { item, count };
      });

      scored.sort((a, b) => b.count - a.count);

      faqList.innerHTML = "";
      scored.forEach(({ item, count }) => {
        if (count > 0) {
          item.style.display = "";
          faqList.appendChild(item);
        } else {
          item.style.display = "none";
        }
      });

      const anyMatch = scored.some((s) => s.count > 0);
      if (!anyMatch) {
        if (!faqList.querySelector(".no-results-message")) {
          const msg = document.createElement("div");
          msg.className = "no-results-message";
          msg.textContent = "No matching questions found.";
          faqList.appendChild(msg);
        }
      } else {
        const oldMsg = faqList.querySelector(".no-results-message");
        if (oldMsg) oldMsg.remove();
      }
    });
  }
}

async function loadPage(path) {
  const file = routes[path];
  const newDiv = document.createElement("div");
  newDiv.className = "page";

  try {
    if (!file) throw new Error("Page not found");
    const res = await fetch(file);
    if (!res.ok) throw new Error("HTTP " + res.status);
    newDiv.innerHTML = await res.text();
  } catch {
    try {
      const e404 = await fetch("pages/404.html");
      newDiv.innerHTML = e404.ok
        ? await e404.text()
        : "<h2>404 - Page Not Found</h2>";
    } catch {
      newDiv.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
  }

  contentDiv.appendChild(newDiv);

  if (path === "/faqs") {
    initFaqToggles(newDiv);

    // Add event listeners to sidebar buttons
    const sidebarButtons = newDiv.querySelectorAll('.faq-sidebar-list button');
    sidebarButtons.forEach(button => {
      button.addEventListener('click', () => {
        const term = button.getAttribute('data-term');
        setSearch(term);
      });
    });
  }

  requestAnimationFrame(() => {
    Array.from(contentDiv.children).forEach((child) => {
      if (child !== newDiv) {
        child.style.opacity = 0;
        child.style.transform = "translateX(-20px)";
        setTimeout(() => contentDiv.removeChild(child), 300);
      }
    });

    void newDiv.offsetWidth;
    newDiv.classList.add("active");
  });

  attachButtonNavigation(newDiv);
  attachDropdowns(newDiv);
}

function attachButtonNavigation(container) {
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page;
      if (target && routes[target]) {
        window.location.hash = target;
      }
    });
  });
}

function attachDropdowns(container) {
  container.querySelectorAll(".dropdown").forEach((dd) => {
    dd.addEventListener("click", () => dd.classList.toggle("active"));
  });
}

function setActiveLink() {
  const hash = window.location.hash || "#/home";
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}

async function handleNavLinkNavigation(rawPath) {
  if (navLinkCooldown) return;
  navLinkCooldown = true;
  setTimeout(() => (navLinkCooldown = false), 100);

  const [basePath, qs] = rawPath.split("?");
  const params = new URLSearchParams(qs || "");

  await loadPage(basePath);
  setActiveLink();

  if (basePath === "/faqs") {
    await Promise.resolve();

    const latest = contentDiv.lastElementChild;
    const faqSearch =
      (latest && latest.querySelector && latest.querySelector("#faqSearch")) ||
      document.getElementById("faqSearch");

    if (faqSearch) {
      if (params.has("q")) {
        faqSearch.value = params.get("q");
      } else {
        faqSearch.value = "";
      }
      faqSearch.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (params.has("open")) {
      const id = params.get("open");
      const item =
        (latest &&
          latest.querySelector &&
          latest.querySelector(`.faq-item[data-id="${CSS.escape(id)}"]`)) ||
        document.querySelector(`.faq-item[data-id="${CSS.escape(id)}"]`);
      if (item) {
        const question = item.querySelector(".faq-question");
        if (question) question.click();
        setTimeout(
          () => item.scrollIntoView({ behavior: "smooth", block: "center" }),
          50
        );
      }
    } else {
      const active =
        (latest &&
          latest.querySelector &&
          latest.querySelector(".faq-item.active")) ||
        document.querySelector(".faq-item.active");
      if (active) {
        active.classList.remove("active");
        const ans = active.querySelector(".faq-answer");
        if (ans) ans.classList.remove("show");
      }

      (latest || document)
        .querySelectorAll(".faq-list details[open]")
        .forEach((d) => {
          d.removeAttribute("open");
        });
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/home";
  handleNavLinkNavigation(location.hash.slice(1));
});
window.addEventListener("hashchange", () => {
  handleNavLinkNavigation(location.hash.slice(1));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const arr = Array.from(links);
    const curr = window.location.hash || "#/home";
    let idx = arr.findIndex((l) => l.getAttribute("href") === curr);
    idx = (idx + 1) % arr.length;
    window.location.hash = arr[idx].getAttribute("href");
  }
});

const footer = document.getElementById("footer");
window.addEventListener("scroll", () => {
  if (window.scrollY === 0) {
    footer.classList.add("fixed");
    footer.classList.remove("hidden");
  } else {
    footer.classList.remove("fixed");
    footer.classList.add("hidden");
  }
});
if (window.scrollY === 0) {
  footer.classList.add("fixed");
}

const imageBackdrop = document.createElement("div");
imageBackdrop.className = "image-backdrop";
document.body.appendChild(imageBackdrop);

let currentFullImage = null;
let currentFullSource = null;

function toggleFullscreenImage(img, card = null) {
  if (!img) return;

  if (currentFullSource === img) {
    if (currentFullImage && currentFullImage.parentNode) {
      currentFullImage.parentNode.removeChild(currentFullImage);
    }
    currentFullImage = null;
    currentFullSource = null;
    imageBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    // Remove info overlay
    const info = document.querySelector(".fullscreen-info");
    if (info) {
      info.remove();
    }
    return;
  }

  if (currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }

  const clone = img.cloneNode(true);
  clone.classList.add("fullscreen-image");

  const thumb = img.getBoundingClientRect();
  const maxW = Math.floor(window.innerWidth * 0.95);
  const maxH = Math.floor(window.innerHeight * 0.95);
  const natW = img.naturalWidth || thumb.width;
  const natH = img.naturalHeight || thumb.height;
  const ratio = Math.min(1, maxW / natW, maxH / natH);

  const w = Math.round(natW * ratio);
  const h = Math.round(natH * ratio);
  const left = Math.round((window.innerWidth - w) / 2);
  const top = Math.round((window.innerHeight - h) / 2);

  Object.assign(clone.style, {
    position: "fixed",
    left: left + "px",
    top: top + "px",
    width: w + "px",
    height: h + "px",
    transform: "none",
    transition: "none",
    borderRadius: "6px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  });

  clone.addEventListener("click", () => toggleFullscreenImage(img), {
    once: true,
  });

  document.body.appendChild(clone);
  imageBackdrop.classList.add("active");
  document.body.style.overflow = "hidden";

  currentFullImage = clone;
  currentFullSource = img;

  // Add info overlay if card is provided
  if (card) {
    const info = document.createElement("div");
    info.className = "fullscreen-info";
    const title = card.querySelector(".gallery-title").textContent;
    const desc = card.querySelector(".gallery-description").textContent;
    info.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    document.body.appendChild(info);
  }
}

function attachGalleryFullscreen(root) {
  if (!root) return;
  root.querySelectorAll(".gallery-card").forEach((card) => {
    if (card._fsAttached) return;
    card._fsAttached = true;
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      const bgImage = window.getComputedStyle(card).backgroundImage;
      const url = bgImage.slice(5, -2); // Extract URL from 'url("...")'
      const img = new Image();
      img.src = url;
      toggleFullscreenImage(img, card);
    });
  });
}

imageBackdrop.addEventListener("click", () => {
  if (currentFullSource) toggleFullscreenImage(currentFullSource);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }
});

const originalLoadPage = loadPage;
loadPage = async function (path) {
  await originalLoadPage(path);
  const latest =
    contentDiv.lastElementChild || contentDiv.querySelector(".page");
  attachGalleryFullscreen(latest);
  if (typeof attachFAQBehavior === "function") {
    attachFAQBehavior(latest);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  attachGalleryFullscreen(document);
  if (typeof attachFAQBehavior === "function") {
    attachFAQBehavior(document);
  }
});

function attachFAQBehavior(root) {
  if (!root) root = document;
  const list = root.querySelector(".faq-list");
  if (!list || list._attached) return;
  list._attached = true;

  list.addEventListener("click", (e) => {
    const d = e.target.closest("details");
    if (!d) return;
    list.querySelectorAll("details").forEach((other) => {
      if (other !== d) other.removeAttribute("open");
    });
  });

  list.querySelectorAll("summary").forEach((s) => {
    s.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const d = s.parentElement;
        d.hasAttribute("open")
          ? d.removeAttribute("open")
          : d.setAttribute("open", "");
        list.querySelectorAll("details").forEach((other) => {
          if (other !== d) other.removeAttribute("open");
        });
      }
    });
  });
}

function setSearch(term) {
  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.value = term;
    // Trigger filtering directly
    filterFAQs(term);
  }
}

function filterFAQs(searchTerm) {
  const faqList = document.querySelector('.faq-list');
  if (!faqList) return;

  const faqItems = Array.from(faqList.querySelectorAll('.faq-item'));
  const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    faqItems.forEach(item => {
      item.style.display = '';
    });
    return;
  }

  faqItems.forEach(item => {
    const text = item.querySelector('.faq-question span')?.textContent?.toLowerCase() || '';
    const tags = (item.dataset.tags || '').toLowerCase().split(',').map(t => t.trim());
    const count = terms.reduce((sum, term) => {
      const inText = text.includes(term);
      const inTags = tags.some(tag => tag.includes(term));
      return sum + (inText || inTags ? 1 : 0);
    }, 0);
    item.style.display = count > 0 ? '' : 'none';
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("version-number").innerText =
    "Version " + SITE_VERSION;
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("version-number").innerText = "v" + SITE_VERSION;
  document.getElementById("update-description").innerHTML =
    SITE_UPDATE_DESCRIPTION;
});

function toggleUpdateDescription() {
  var updateDescription = document.getElementById("update-description");
  if (
    updateDescription.style.display === "none" ||
    updateDescription.style.display === ""
  ) {
    updateDescription.style.display = "block";
  } else {
    updateDescription.style.display = "none";
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest("[data-page]");
  if (!btn) return;
  e.preventDefault();

  const path = btn.getAttribute("data-page");
  if (!path) return;

  const normalized = path.startsWith("/") ? path : "/" + path;

  const newHash = "#" + normalized;
  if (location.hash !== newHash) {
    history.pushState(null, "", newHash);
  }

  if (typeof handleNavLinkNavigation === "function") {
    handleNavLinkNavigation(normalized);
  }
});

// Sidebar toggle functionality
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
  const wasActive = sidebar.classList.contains('active');
  sidebar.classList.toggle('active');
  sidebarOverlay.classList.toggle('active');
  document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';

  // Play page change sound when opening sidebar
  if (!wasActive && sidebar.classList.contains('active')) {
    soundManager.play('pageChange');
  }
}

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', toggleSidebar);
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', toggleSidebar);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
    toggleSidebar();
  }
});

// Sound management system
class SoundManager {
  constructor() {
    this.isMuted = true;
    this.sounds = {};
    this.lastHoverTime = 0;
    this.hoverCooldown = 10; // 0.1 seconds in milliseconds
    this.activeHoverSounds = 0;
    this.maxHoverSounds = 8;
    this.loadSounds();
  }

  async loadSounds() {
    const soundFiles = {
      sidebarSlideIn: 'sounds/SidebarSlideIn.wav',
      pageChange: 'sounds/PageChange.wav',
      hover: 'sounds/Hover.wav',
      buttonClick: 'sounds/ButtonClick.wav'
    };

    for (const [name, path] of Object.entries(soundFiles)) {
      try {
        this.sounds[name] = new Audio(path);
        this.sounds[name].preload = 'auto';
        this.sounds[name].volume = 0.5; // Set volume to 50%
      } catch (error) {
        console.warn(`Failed to load sound: ${name} from ${path}`);
      }
    }
  }

  play(soundName) {
    if (this.isMuted || !this.sounds[soundName]) return;

    // Check hover cooldown
    if (soundName === 'hover') {
      const now = Date.now();
      if (now - this.lastHoverTime < this.hoverCooldown) {
        return; // Skip if within cooldown period
      }
      this.lastHoverTime = now;
    }

    try {
      // Create a new audio instance for overlapping sounds
      const sound = new Audio(this.sounds[soundName].src);
      sound.volume = this.sounds[soundName].volume || 0.5;
      sound.play().catch(error => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }
}

// Initialize sound manager
const soundManager = new SoundManager();

// Mute toggle functionality
const muteToggle = document.getElementById('mute-toggle');
let isMuted = true; // Start muted by default

if (muteToggle) {
  muteToggle.addEventListener('click', function () {
    const muteIcon = this.querySelector('.mute-icon');
    isMuted = !isMuted;

    // Update sound manager
    soundManager.setMuted(isMuted);

    if (isMuted) {
      muteIcon.src = 'images/misc/muted.png';
      muteIcon.alt = 'Muted';
    } else {
      muteIcon.src = 'images/misc/unmuted.png';
      muteIcon.alt = 'Unmuted';
    }

    console.log('Mute toggled:', isMuted ? 'Muted' : 'Unmuted');
  });
}

// Function to attach sound effects to elements
function attachSoundEffects() {
  // Button click sounds
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Button clicks (exclude sidebar toggle and mute toggle)
    if (target.tagName === 'BUTTON' &&
      !target.classList.contains('mute-toggle') &&
      target.id !== 'sidebar-toggle') {
      soundManager.play('buttonClick');
    }

    // Link clicks (navigation)
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#/')) {
      soundManager.play('buttonClick');
    }

    // FAQ questions
    if (target.closest('.faq-question')) {
      soundManager.play('buttonClick');
    }

    // Gallery cards
    if (target.closest('.gallery-card')) {
      soundManager.play('buttonClick');
    }

    // Archive tiles
    if (target.closest('.archive-tile')) {
      soundManager.play('buttonClick');
    }
  });

  // Hover sounds for interactive elements
  const interactiveSelectors = [
    'button',
    'a[href^="#/"]',
    '.top-nav-link',
    '.sidebar-links a',
    '.faq-question',
    'btn',
    'primary-btn',
    'secondary-btn'
  ];

  interactiveSelectors.forEach(selector => {
    document.addEventListener('mouseover', (e) => {
      // Skip if hovering over images inside buttons (prevents double hover sounds)
      if (e.target.tagName === 'IMG' && e.target.closest('button')) {
        return;
      }

      // Skip if hovering over text elements or titles within cards
      if (e.target.tagName === 'H1' || e.target.tagName === 'H2' || e.target.tagName === 'H3' ||
        e.target.tagName === 'H4' || e.target.tagName === 'H5' || e.target.tagName === 'H6' ||
        e.target.tagName === 'P' || e.target.tagName === 'SPAN' ||
        e.target.classList.contains('mod-title') || e.target.classList.contains('mod-tagline') ||
        e.target.classList.contains('mod-description') || e.target.classList.contains('community-platform-title') ||
        e.target.classList.contains('community-platform-description') || e.target.classList.contains('gallery-title') ||
        e.target.classList.contains('gallery-description') || e.target.classList.contains('feature-card') && e.target.tagName !== 'DIV') {
        return;
      }

      if (e.target.closest(selector)) {
        soundManager.play('hover');
      }
    });
  });

  // Page change sounds
  window.addEventListener('hashchange', () => {
    soundManager.play('pageChange');
  });

  // Sidebar slide in sound
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('active')) {
        // Opening sidebar
        soundManager.play('sidebarSlideIn');
      }
    });
  }
}

// Initialize sound effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for sounds to load
  setTimeout(() => {
    attachSoundEffects();
  }, 1000);
});
