// ==========================
// Unified Site Script
// ==========================

// --------------------------
// Base path helpers (GH Pages vs. local)
// --------------------------
const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // external links untouched
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

function trimTrailingSlash(p) {
  return p ? p.replace(/\/$/, "") : "";
}

// --------------------------
// Load nav (main & sub)
// --------------------------
function loadNav(placeholderId = "nav-placeholder", filePath = "shared/layout/header/nav/nav.html") {
  const holder = document.getElementById(placeholderId);
  if (!holder) return;

  fetch(withBase(filePath))
    .then(res => res.ok ? res.text() : "")
    .then(html => {
      holder.innerHTML = html;
      fixNavPaths(holder);
      activateNavLinks(holder);
    })
    .catch(err => console.error(`Error loading nav ${filePath}:`, err));
}

// --------------------------
// Fix links/images inside nav/footer
// --------------------------
function fixNavPaths(holder) {
  holder.querySelectorAll("a, img").forEach(el => {
    const attr = el.tagName === "A" ? "href" : "src";
    const value = el.getAttribute(attr);
    if (value && !value.startsWith("http") && !value.startsWith("#") && !value.startsWith("data:")) {
      el.setAttribute(attr, withBase(value.replace(/^\/+/, "")));
    }
  });
}

// --------------------------
// Highlight active nav links
// --------------------------
function activateNavLinks(holder) {
  const links = holder.querySelectorAll("nav a[href]");
  const currentPath = trimTrailingSlash(window.location.pathname);

  links.forEach(link => link.classList.remove("active")); // reset

  let chosen = null;
  links.forEach(link => {
    const href = link.getAttribute("href");
    const targetAbs = trimTrailingSlash(href.startsWith("/") ? href : withBase(href));
    if (currentPath === targetAbs || currentPath.endsWith(trimTrailingSlash(href))) {
      chosen = link;
    }
  });

  if (chosen) chosen.classList.add("active");
}

// --------------------------
// Load Footer
// --------------------------
function loadFooter() {
  const holder = document.getElementById("footer-placeholder");
  if (!holder) return;

  fetch(withBase("shared/layout/footer/footer.html"))
    .then(res => res.ok ? res.text() : "")
    .then(html => {
      if (!html) return;
      holder.innerHTML = html;
      fixNavPaths(holder);
    })
    .catch(err => console.warn("Footer not loaded:", err));
}

// --------------------------
// DOM Ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Load main nav and tournament/sub nav
  loadNav("nav-placeholder", "shared/layout/header/nav/nav.html");
  loadNav("nav-t-placeholder", "shared/layout/header/nav/nav_t.html");

  // Load footer
  loadFooter();
});
