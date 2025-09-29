// ===========================
// Matches.js – Dynamic Pools & Topcut
// ===========================

async function fetchPlaceholderData() {
  const path = "./placeholder-data/tournaments-placeholder.json"; // relative to matches.html
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Failed to fetch JSON");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to load placeholder JSON:", err);
    return { tournaments: [], events: [] };
  }
}

async function fetchEventData(slug) {
  const data = await fetchPlaceholderData();
  const wrapper = data.events.find(w => w.events.some(ev => ev.slug === slug));
  if (!wrapper) return null;

  const event = wrapper.events.find(ev => ev.slug === slug);
  if (!event) return null;

  const tournament = data.tournaments.find(t => t.slug === wrapper.slug) || { name: "Unknown Tournament" };
  return { event, tournament };
}

// ---------------------------
// Render Pools into match history
// ---------------------------
function renderPools(eventData) {
  const matchesBody = document.getElementById("matches-body");
  if (!matchesBody) return;
  matchesBody.innerHTML = "";

  if (!eventData.pools?.length) {
    matchesBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No pool matches available.</td></tr>`;
    return;
  }

  eventData.pools.forEach((pool, poolIndex) => {
    pool.sets?.forEach((set, idx) => {
      const roundName = `Pool ${poolIndex + 1} Round ${idx + 1}`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${roundName}</td>
        <td>${set.player1}</td>
        <td>${set.score}</td>
        <td>${set.player2}</td>
        <td>${set.winner}</td>
      `;
      matchesBody.appendChild(row);
    });
  });
}

// ---------------------------
// Render Topcut Matches
// ---------------------------
function renderTopcut(eventData) {
  const topcutSection = document.getElementById("topcut-section");
  const topcutBody = document.getElementById("topcut-body");
  if (!topcutSection || !topcutBody) return;

  if (!eventData.topcut?.sets?.length) {
    topcutSection.style.display = "none";
    return;
  }

  // Set dynamic heading
  topcutSection.querySelector("h2").textContent = `Top ${eventData.topcut.size} Matches`;
  topcutBody.innerHTML = "";

  eventData.topcut.sets.forEach(set => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${set.round}</td>
      <td>${set.player1}</td>
      <td>${set.score}</td>
      <td>${set.player2}</td>
      <td>${set.winner}</td>
    `;
    topcutBody.appendChild(row);
  });

  topcutSection.style.display = "block";
}

// ---------------------------
// Back to Events Button
// ---------------------------
function setupBackToEvents() {
  const backBtn = document.getElementById("back-to-events");
  if (!backBtn) return;
  backBtn.innerHTML = `<a href="../../events.html" class="back-button pool-card">← Back to Events</a>`;
}

// ---------------------------
// Load Event Stats & Render
// ---------------------------
async function loadEventMatches(slug) {
  const data = await fetchEventData(slug);
  if (!data) {
    showNotFound(`Event with slug "${slug}" not found. Please return to Events.`);
    return null;
  }

  const { event, tournament } = data;

  // Update header
  const headerEl = document.getElementById("standings-title");
  if (headerEl) headerEl.textContent = `${tournament.name} - ${event.name}`;

  // Render pools and topcut
  renderPools(event);
  renderTopcut(event);

  // Setup back button
  setupBackToEvents();

  return data;
}

// ---------------------------
// Initialize
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    showNotFound("No event specified. Please return to Events.");
    return;
  }

  await loadEventMatches(slug);

  // Handle browser back/forward
  window.addEventListener("popstate", async () => {
    const newSlug = new URLSearchParams(window.location.search).get("slug");
    if (!newSlug) return;
    await loadEventMatches(newSlug);
  });
});
