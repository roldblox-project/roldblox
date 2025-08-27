const contentDiv = document.getElementById("content");
const links = document.querySelectorAll(".top-nav-link");

// Navigation cooldown for links
let navLinkCooldown = false;

const routes = {
  "/home": "pages/home.html",
  "/about": "pages/about.html",
  "/mods": "pages/mods.html",
  "/community": "pages/community.html",
  "/gallery": "pages/gallery.html",
  "/faqs": "pages/faqs.html", // <-- add this
  "/blog": "pages/blog.html", // optional
  "/help": "pages/help.html", // optional
  "/assets": "pages/assets.html", // optional
};

// Hover sound
const hoverSound = new Audio("sounds/MoveSelection.wav");
async function loadPage(path) {
  const file = routes[path];
  const newDiv = document.createElement("div");
  newDiv.className = "page";

  try {
    if (!file) throw new Error("Page not found");
    const res = await fetch(file);
    if (!res.ok) throw new Error("HTTP error " + res.status);
    newDiv.innerHTML = await res.text();
  } catch (err) {
    console.error("Error loading page:", err);
    try {
      const res404 = await fetch("pages/404.html");
      newDiv.innerHTML = res404.ok
        ? await res404.text()
        : "<h2>404 - Page Not Found</h2>";
    } catch (err404) {
      console.error("Error loading 404 page:", err404);
      newDiv.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
  }

  contentDiv.appendChild(newDiv);

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

  attachButtonSounds(newDiv);
  attachHoverSounds();

  // ✅ Attach FAQ dropdowns for this page
  newDiv.querySelectorAll(".dropdown").forEach((dropdown) => {
    dropdown.addEventListener("click", () => {
      dropdown.classList.toggle("active");
    });
  });
}

// Attach button click sounds
function attachButtonSounds(container) {
  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sound = new Audio("sounds/ButtonPress.wav");
      sound.play().catch((e) => console.log("Sound blocked:", e));

      const targetPage = btn.dataset.page;
      if (targetPage && routes[targetPage]) {
        window.location.hash = targetPage;
      }
    });
  });
}

// Highlight active nav link
function setActiveLink() {
  const currentHash = window.location.hash || "#/home";
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === currentHash);
  });
}

// Handle navigation changes for links with cooldown
function handleNavLinkNavigation(path) {
  if (navLinkCooldown) return;
  navLinkCooldown = true;

  setTimeout(() => (navLinkCooldown = false), 100);

  const sound = new Audio("sounds/ScreenChange.wav");
  sound.play().catch((e) => console.log("Sound blocked:", e));

  loadPage(path);
  setActiveLink();
}

// Attach hover sounds
function attachHoverSounds() {
  const interactiveElements = document.querySelectorAll(
    "button, .top-nav-link"
  );

  interactiveElements.forEach((el) => {
    el.removeEventListener("mouseenter", el._hoverListener);

    el._hoverListener = () => {
      const sound = hoverSound.cloneNode();
      sound.play().catch((e) => console.log("Sound blocked:", e));
    };

    el.addEventListener("mouseenter", el._hoverListener);
  });
}

// Initial load
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/home";
  handleNavLinkNavigation((window.location.hash || "#/home").slice(1));
});

// Listen for hash changes
window.addEventListener("hashchange", () => {
  handleNavLinkNavigation((window.location.hash || "#/home").slice(1));
});

// Tab navigation for links only
window.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();

    const linksArray = Array.from(links);
    const currentHash = window.location.hash || "#/home";
    let currentIndex = linksArray.findIndex(
      (link) => link.getAttribute("href") === currentHash
    );

    const nextIndex = (currentIndex + 1) % linksArray.length;
    const nextLink = linksArray[nextIndex];
    window.location.hash = nextLink.getAttribute("href");
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

// Initialize on load
if (window.scrollY === 0) {
  footer.classList.add("fixed");
}

/* ------------------------------ */
/* Gallery image fullscreen logic */
/* ------------------------------ */
// Create a single backdrop element used for fullscreen previews
const imageBackdrop = document.createElement("div");
imageBackdrop.className = "image-backdrop";
document.body.appendChild(imageBackdrop);

let currentFullImage = null; // the cloned fullscreen element
let currentFullSource = null; // original <img> that was clicked

function toggleFullscreenImage(img) {
  if (!img) return;

  // If already showing this image fullscreen, close it
  if (currentFullSource === img) {
    // Immediately remove the cloned fullscreen image and backdrop
    if (currentFullImage && currentFullImage.parentNode) {
      currentFullImage.parentNode.removeChild(currentFullImage);
    }
    currentFullImage = null;
    currentFullSource = null;
    imageBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    return;
  }

  // If another image is open, close it first
  if (currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }

  // Create a clone so it isn't affected by ancestor transforms/overflow
  const clone = img.cloneNode(true);
  clone.classList.add("fullscreen-image");

  // Get thumbnail position/size to animate from
  const thumbRect = img.getBoundingClientRect();

  // Immediately size and position the clone at centered fullscreen (no animation)
  const maxW = Math.floor(window.innerWidth * 0.95);
  const maxH = Math.floor(window.innerHeight * 0.95);
  const naturalW = img.naturalWidth || thumbRect.width;
  const naturalH = img.naturalHeight || thumbRect.height;
  const wRatio = maxW / naturalW;
  const hRatio = maxH / naturalH;
  const ratio = Math.min(1, wRatio, hRatio);
  const endW = Math.round(naturalW * ratio);
  const endH = Math.round(naturalH * ratio);
  const endLeft = Math.round((window.innerWidth - endW) / 2);
  const endTop = Math.round((window.innerHeight - endH) / 2);

  clone.style.position = "fixed";
  clone.style.left = endLeft + "px";
  clone.style.top = endTop + "px";
  clone.style.width = endW + "px";
  clone.style.height = endH + "px";
  clone.style.transform = "none";
  clone.style.transition = "none";
  clone.style.borderRadius = "6px";
  clone.style.boxShadow = "0 20px 40px rgba(0,0,0,0.6)";

  clone.addEventListener("click", () => toggleFullscreenImage(img), {
    once: true,
  });

  document.body.appendChild(clone);
  imageBackdrop.classList.add("active");
  document.body.style.overflow = "hidden";

  currentFullImage = clone;
  currentFullSource = img;
}

// Attach fullscreen handlers to images inside a container (used after page load)
function attachGalleryFullscreen(container) {
  if (!container) return;
  console.debug("attachGalleryFullscreen called for", container);
  const imgs = container.querySelectorAll(".gallery-grid img");
  imgs.forEach((img) => {
    // avoid attaching multiple times
    if (img._fsAttached) return;
    img._fsAttached = true;
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFullscreenImage(img);
    });
    console.debug("attached fullscreen handler to", img.src);
  });
}

// Close on backdrop click or Esc
// Close on backdrop click or Esc — use the original source reference when closing
imageBackdrop.addEventListener("click", () => {
  if (currentFullSource) toggleFullscreenImage(currentFullSource);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentFullSource) {
    toggleFullscreenImage(currentFullSource);
  }
});

// Expose toggle for inline fallback to use the same implementation
window.toggleFullscreenImage = toggleFullscreenImage;

// Integrate with dynamic page loader: call attachGalleryFullscreen for pages loaded into #content
const originalLoadPage = loadPage;
loadPage = async function (path) {
  await originalLoadPage(path);
  // after page is inserted, attach handlers to the last appended .page element
  const latest =
    contentDiv.lastElementChild || contentDiv.querySelector(".page");
  attachGalleryFullscreen(latest);
  // Attach FAQ behavior if this page contains FAQ elements
  if (typeof attachFAQBehavior === "function") attachFAQBehavior(latest);
};

// Also attach on initial DOMContentLoaded for static open pages
window.addEventListener("DOMContentLoaded", () => {
  attachGalleryFullscreen(document);
  if (typeof attachFAQBehavior === "function") attachFAQBehavior(document);
});

/* ------------------------------ */
/* FAQ behavior (moved from inline page) */
/* ------------------------------ */
function attachFAQBehavior(root) {
  if (!root) root = document;
  const faqList = root.querySelector(".faq-list");
  if (!faqList) return;

  // Avoid attaching multiple times
  if (faqList._attached) return;
  faqList._attached = true;

  faqList.addEventListener("click", (e) => {
    const details = e.target.closest("details");
    if (!details) return;
    // close others
    faqList.querySelectorAll("details").forEach((d) => {
      if (d !== details) d.removeAttribute("open");
    });
  });

  faqList.querySelectorAll("summary").forEach((s) => {
    s.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const details = s.parentElement;
        if (details.hasAttribute("open")) details.removeAttribute("open");
        else details.setAttribute("open", "");
        // close others
        faqList.querySelectorAll("details").forEach((d) => {
          if (d !== details) d.removeAttribute("open");
        });
      }
    });
  });
}
