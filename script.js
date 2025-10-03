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
      else params.delete("q");
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
}

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
