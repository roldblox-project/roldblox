const contentDiv = document.getElementById("content");
const links = document.querySelectorAll(".top-nav-link");

// Define routes
const routes = {
  "/home": "pages/home.html",
  "/about": "pages/about.html",
  "/mods": "pages/mods.html",
  "/community": "pages/community.html",
  "/contact": "pages/contact.html",
};

// Load a page into #content with fade + slide
async function loadPage(path) {
  const file = routes[path] || routes["/home"];
  const newDiv = document.createElement("div");
  newDiv.className = "page";

  try {
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

  // Add new page
  contentDiv.appendChild(newDiv);

  // Animate: remove old page, fade in new page
  requestAnimationFrame(() => {
    // Fade out old page(s)
    Array.from(contentDiv.children).forEach((child) => {
      if (child !== newDiv) {
        child.style.transition = "opacity 0.3s ease";
        child.style.opacity = 0;
        setTimeout(() => contentDiv.removeChild(child), 300);
      }
    });

    // Activate new page
    newDiv.classList.add("active");
  });

  // Attach button click sounds for new buttons
  const buttons = newDiv.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sound = new Audio("sounds/ButtonPress.wav");
      sound.play().catch((e) => console.log("Sound blocked:", e));

      // If the button has data-page="mods", navigate there
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

// Handle navigation changes
function handleNavigation() {
  const path = (window.location.hash || "#/home").slice(1);

  // Play screen change sound
  const sound = new Audio("sounds/ScreenChange.wav");
  sound.play().catch((e) => console.log("Sound blocked:", e));

  loadPage(path);
  setActiveLink();
}

// Initial load
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/home";
  handleNavigation();
});

// Listen for hash changes
window.addEventListener("hashchange", handleNavigation);
// Hover sound
const hoverSound = new Audio("sounds/MoveSelection.wav");

// Function to attach hover sounds
function attachHoverSounds() {
  const interactiveElements = document.querySelectorAll("btn, .top-nav-link");
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      // Play a fresh copy each time to allow rapid hover
      const sound = hoverSound.cloneNode();
      sound.play().catch((e) => console.log("Sound blocked:", e));
    });
  });
}
// After newDiv is added and animation is triggered
attachHoverSounds();
