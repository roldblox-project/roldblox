// Main container and navigation links
const contentDiv = document.getElementById("content");
const links = document.querySelectorAll(".top-nav-link");

// Navigation cooldown
let navLinkCooldown = false;

// Route definitions
const routes = {
  "/home": "pages/home.html",
  "/about": "pages/about.html",
  "/mods": "pages/mods.html",
  "/community": "pages/community.html",
  "/gallery": "pages/gallery.html",
  "/faqs": "pages/faqs.html",
  "/blog": "pages/blog.html", // optional
  "/help": "pages/help.html", // optional
  "/assets": "pages/assets.html", // optional
  "/admin": "pages/admin.html", // optional
};

function initFaqToggles() {
  const faqList = document.querySelector(".faq-list");
  const faqItems = document.querySelectorAll(".faq-item");
  const faqSearch = document.getElementById("faqSearch");
  const original = Array.from(faqItems);

  // (your existing toggle-open/close code stays here…)

  if (faqSearch) {
    faqSearch.addEventListener("input", () => {
      const terms = faqSearch.value.toLowerCase().split(/\s+/).filter(Boolean);

      // restore original when empty
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

      // score each item by matches in text OR tags (substring match)
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

      // sort high→low and rebuild list, hiding zero-score
      scored.sort((a, b) => b.count - a.count);
      faqList.innerHTML = "";
      scored.forEach(({ item, count }) => {
        item.style.display = count > 0 ? "" : "none";
        if (count > 0) faqList.appendChild(item);
      });

      // no-results message
      const anyMatch = scored.some((s) => s.count > 0);
      if (!anyMatch) {
        if (!faqList.querySelector(".no-results-message")) {
          const msg = document.createElement("div");
          msg.className = "no-results-message";
          msg.textContent = "No matching questions found.";
          faqList.appendChild(msg);
        }
      } else {
        const old = faqList.querySelector(".no-results-message");
        if (old) old.remove();
      }
    });
  }
}

// Load a page fragment into #content
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
      const err404 = await fetch("pages/404.html");
      newDiv.innerHTML = err404.ok
        ? await err404.text()
        : "<h2>404 - Page Not Found</h2>";
    } catch {
      newDiv.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
  }

  contentDiv.appendChild(newDiv);

  // init FAQ on FAQ page
  if (path === "/faqs") {
    setTimeout(initFaqToggles, 100);
  }

  // page-swap animation + old removal
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

// turn buttons with data-page into hash links
function attachButtonNavigation(container) {
  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page;
      if (target && routes[target]) {
        window.location.hash = target;
      }
    });
  });
}

// dropdown toggles within loaded page
function attachDropdowns(container) {
  container.querySelectorAll(".dropdown").forEach((dd) => {
    dd.addEventListener("click", () => dd.classList.toggle("active"));
  });
}

// highlight the current nav link
function setActiveLink() {
  const current = window.location.hash || "#/home";
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === current);
  });
}

// navigate to a new hash, with cooldown to prevent spam
function handleNavLinkNavigation(path) {
  if (navLinkCooldown) return;
  navLinkCooldown = true;
  setTimeout(() => (navLinkCooldown = false), 100);

  loadPage(path);
  setActiveLink();
}

// initial load + hash watcher
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/home";
  handleNavLinkNavigation(location.hash.slice(1));
});

window.addEventListener("hashchange", () => {
  handleNavLinkNavigation(location.hash.slice(1));
});

// Tab key moves focus through top-nav-links only
window.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const arr = Array.from(links);
    const curr = location.hash || "#/home";
    let idx = arr.findIndex((l) => l.getAttribute("href") === curr);
    idx = (idx + 1) % arr.length;
    window.location.hash = arr[idx].getAttribute("href");
  }
});

// sticky footer when scrolled to top
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

/* --------------------------------- */
/* Gallery fullscreen preview logic  */
/* --------------------------------- */
const imageBackdrop = document.createElement("div");
imageBackdrop.className = "image-backdrop";
document.body.appendChild(imageBackdrop);

let currentFullImage = null;
let currentFullSource = null;

function toggleFullscreenImage(img) {
  if (!img) return;
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
  if (currentFullSource) toggleFullscreenImage(currentFullSource);

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

// attach fullscreen handler to gallery images
function attachGalleryFullscreen(root) {
  if (!root) return;
  const imgs = root.querySelectorAll(".gallery-grid img");
  imgs.forEach((img) => {
    if (img._fsAttached) return;
    img._fsAttached = true;
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFullscreenImage(img);
    });
  });
}

// close on backdrop or Esc
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

// legacy <details>-based FAQ fallback
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
