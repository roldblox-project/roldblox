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
};

// Hover sound
const hoverSound = new Audio("sounds/MoveSelection.wav");

async function loadPage(path) {
  const file = routes[path];
  const newDiv = document.createElement("div");
  newDiv.className = "page";

  try {
    if (!file) throw new Error("Page not found"); // trigger 404
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

    void newDiv.offsetWidth; // force reflow
    newDiv.classList.add("active");
  });

  attachButtonSounds(newDiv);
  attachHoverSounds();
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
