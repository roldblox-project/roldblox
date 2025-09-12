// script.js

// Main container and navigation links
const contentDiv = document.getElementById("content");
const links = document.querySelectorAll(".top-nav-link");

// Navigation cooldown flag
let navLinkCooldown = false;

// Route definitions
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
};

/**
 * Initialize FAQ toggling and enhanced multi-term + tag search.
 */
function initFaqToggles() {
  const faqList = document.querySelector(".faq-list");
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  const faqSearch = document.getElementById("faqSearch");
  const original = faqItems.slice(); // preserve original order

  // Toggle open/close behavior
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      // close others
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("active")) {
          other.classList.remove("active");
          other.querySelector(".faq-answer").classList.remove("show");
        }
      });
      // toggle this one
      if (isActive) {
        item.classList.remove("active");
        answer.classList.remove("show");
      } else {
        item.classList.add("active");
        answer.classList.add("show");
      }
    });
  });

  // Enhanced search: match terms against question text + data-tags, rank by match count
  if (faqSearch) {
    faqSearch.addEventListener("input", () => {
      const terms = faqSearch.value.toLowerCase().split(/\s+/).filter(Boolean);

      // if empty search, restore original
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

      // score each item
      const scored = original.map((item) => {
        const text = item
          .querySelector(".faq-question span")
          .textContent.toLowerCase();
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

      // sort descending by match count
      scored.sort((a, b) => b.count - a.count);

      // rebuild list
      faqList.innerHTML = "";
      scored.forEach(({ item, count }) => {
        if (count > 0) {
          item.style.display = "";
          faqList.appendChild(item);
        } else {
          item.style.display = "none";
        }
      });

      // show no-results message if nothing matched
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

/**
 * Fetch and inject a page fragment, animate swap, then wire up
 * FAQ toggles (if FAQ page), buttons and dropdowns.
 */
async function loadPage(path) {
  const file = routes[path];
  const newDiv = document.createElement("div");
  newDiv.className = "page";

  // fetch content
  try {
    if (!file) throw new Error("Page not found");
    const res = await fetch(file);
    if (!res.ok) throw new Error("HTTP " + res.status);
    newDiv.innerHTML = await res.text();
  } catch {
    // fallback 404
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

  // Initialize FAQ toggles if this is the FAQ page
  if (path === "/faqs") {
    setTimeout(initFaqToggles, 100);
  }

  // animate out old pages
  requestAnimationFrame(() => {
    Array.from(contentDiv.children).forEach((child) => {
      if (child !== newDiv) {
        child.style.opacity = 0;
        child.style.transform = "translateX(-20px)";
        setTimeout(() => contentDiv.removeChild(child), 300);
      }
    });
    // trigger fade-in
    void newDiv.offsetWidth;
    newDiv.classList.add("active");
  });

  attachButtonNavigation(newDiv);
  attachDropdowns(newDiv);
}

/** Turn buttons with data-page into hash navigators */
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

/** Wire up any .dropdown elements inside the new page */
function attachDropdowns(container) {
  container.querySelectorAll(".dropdown").forEach((dd) => {
    dd.addEventListener("click", () => dd.classList.toggle("active"));
  });
}

/** Highlight the current top-nav link */
function setActiveLink() {
  const hash = window.location.hash || "#/home";
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}

/** Guarded navigation to prevent spam-clicking */
function handleNavLinkNavigation(path) {
  if (navLinkCooldown) return;
  navLinkCooldown = true;
  setTimeout(() => (navLinkCooldown = false), 100);

  loadPage(path);
  setActiveLink();
}

// initial load & hash watcher
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/home";
  handleNavLinkNavigation(location.hash.slice(1));
});
window.addEventListener("hashchange", () => {
  handleNavLinkNavigation(location.hash.slice(1));
});

// Tab key cycles through top-nav-links
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

// Sticky footer when scrolled to top
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

/* --------------------------------
   Gallery image fullscreen logic
   -------------------------------- */

// backdrop for fullscreen previews
const imageBackdrop = document.createElement("div");
imageBackdrop.className = "image-backdrop";
document.body.appendChild(imageBackdrop);

let currentFullImage = null;
let currentFullSource = null;

/** Toggle fullscreen preview for a given <img> */
function toggleFullscreenImage(img) {
  if (!img) return;

  // if already open, close it
  if (currentFullSource === img) {
    if (currentFullImage && currentFullImage.parentNode) {
      currentFullImage.parentNode.removeChild(currentFullImage);
    }
    currentFullImage = null;
    currentFullSource = null;
    imageBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    return;
  }

  // close existing
  if (currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }

  // clone and center
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
}

/** Attach fullscreen click handlers to any .gallery-grid img */
function attachGalleryFullscreen(root) {
  if (!root) return;
  root.querySelectorAll(".gallery-grid img").forEach((img) => {
    if (img._fsAttached) return;
    img._fsAttached = true;
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFullscreenImage(img);
    });
  });
}

// close on backdrop click or Esc
imageBackdrop.addEventListener("click", () => {
  if (currentFullSource) toggleFullscreenImage(currentFullSource);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }
});

// integrate with dynamic loader
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

// initial static attachments
window.addEventListener("DOMContentLoaded", () => {
  attachGalleryFullscreen(document);
  if (typeof attachFAQBehavior === "function") {
    attachFAQBehavior(document);
  }
});

/** Fallback <details>-based FAQ behavior (for inline pages) */
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
