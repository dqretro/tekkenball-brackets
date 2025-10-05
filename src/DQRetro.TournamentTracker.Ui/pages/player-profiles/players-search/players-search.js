// ---------------------------
// Base path helper (local vs GitHub Pages)
// ---------------------------
function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  // Remove leading slashes to prevent double slashes
  path = path.replace(/^\/+/, "");
  return `${base}/${path}`;
}

// ---------------------------
// Globals
// ---------------------------
let players = [];

// ---------------------------
// Utility: create slug from player name
// ---------------------------
function createSlug(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

// ---------------------------
// Show message in search results
// ---------------------------
function showMessage(msg) {
  const container = document.getElementById("search-results");
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

// ---------------------------
// Render results list
// ---------------------------
function renderResults(list) {
  const container = document.getElementById("search-results");
  if (!container) return;

  container.innerHTML = "";

  if (!list.length) {
    showMessage("No players found.");
    return;
  }

  // Sort alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name));

  list.forEach(player => {
    const div = document.createElement("div");
    div.className = "search-result-item";

    const link = document.createElement("a");
    const slug = createSlug(player.name);
    link.href = withBase(`pages/player-profiles/players/players.html?player=${slug}`);

    // Avatar image
    const img = document.createElement("img");
    img.src = player.avatar || withBase("images/placeholders/icons-profile/icon-pfp-player.png");
    img.alt = `${player.name} Avatar`;
    img.className = "search-avatar";

    // Name text
    const nameSpan = document.createElement("span");
    nameSpan.textContent = player.name;

    link.appendChild(img);
    link.appendChild(nameSpan);
    div.appendChild(link);
    container.appendChild(div);
  });
}

// ---------------------------
// Filter players by search input
// ---------------------------
function filterPlayers(query) {
  const q = query.trim().toLowerCase();
  return players.filter(p => p.name.toLowerCase().includes(q));
}

// ---------------------------
// Initialize search input
// ---------------------------
function initSearch() {
  const input = document.getElementById("playerSearchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    const results = filterPlayers(input.value);
    renderResults(results);
  });
}

// ---------------------------
// Load players JSON
// ---------------------------
async function loadPlayers() {
  try {
    const res = await fetch(withBase("pages/player-profiles/players/players.json"));
    if (!res.ok) throw new Error("Failed to fetch players.json");
    const data = await res.json();
    players = Array.isArray(data) ? data : [];

    // Sort alphabetically before rendering
    players.sort((a, b) => a.name.localeCompare(b.name));

    renderResults(players); // show all players initially
  } catch (err) {
    console.error("Failed to load players:", err);
    showMessage("Failed to load players.");
  }
}

// ---------------------------
// Initialize everything on DOM ready
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadNav === "function") loadNav();
  if (typeof loadFooter === "function") loadFooter();
  initSearch();
  loadPlayers();
});
