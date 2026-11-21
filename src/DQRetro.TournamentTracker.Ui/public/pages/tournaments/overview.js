/**
 * DQRetro Tournament Tracker — overview.js
 * Loaded by overview.html with ?slug=<event-slug>
 * Shows Top 8, links to brackets/topcut/stats pages.
 */

let allEntrants = [];

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function normaliseSlug(slug) {
  return (slug ?? "")
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .trim();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -------------------------------------------------------
// Back to Events Navigation
// -------------------------------------------------------
function setupBackToEvents(rawSlug) {
  const btn = document.getElementById("back-to-events");
  if (!btn) return;

  let tournamentSlug = rawSlug || "";
  if (tournamentSlug.includes("/event/")) {
    tournamentSlug = tournamentSlug.split("/event/")[0];
  }

  const backUrl = tournamentSlug
    ? withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(tournamentSlug)}`)
    : withBase("/pages/tournaments/events.html");

  btn.innerHTML = `<a href="${backUrl}" class="back-button pool-card">← Back to Events</a>`;
}

// -------------------------------------------------------
// Stats Calculation
// -------------------------------------------------------
function computeStats(sets, entrantId, entrantName) {
  if (typeof calcStatsFromSets === "function") {
    return calcStatsFromSets(sets, entrantId, entrantName);
  }

  let wins = 0;
  let losses = 0;
  let lostTo = [];

  (sets || []).forEach(set => {
    const slots = set.slots || [];
    const isInSet = slots.some(s =>
      s.entrant && (
        String(s.entrant.id) === String(entrantId) ||
        s.entrant.name === entrantName
      )
    );
    if (!isInSet) return;

    const isDQ = slots.some(s => s.standing?.stats?.score?.value === -1);
    if (isDQ) return;

    if (!set.winnerId) return;

    const won = slots.some(s =>
      s.entrant && (
        String(s.entrant.id) === String(entrantId) ||
        s.entrant.name === entrantName
      ) && String(set.winnerId) === String(s.entrant.id)
    );

    if (won) {
      wins++;
    } else {
      losses++;
      const opponent = slots.find(s =>
        s.entrant && (
          String(s.entrant.id) !== String(entrantId) &&
          s.entrant.name !== entrantName
        )
      );
      if (opponent?.entrant?.name) lostTo.push(opponent.entrant.name);
    }
  });

  const total = wins + losses;
  const winRate = total > 0 ? `${Math.round((wins / total) * 100)}%` : "—";
  const lostToStr = lostTo.length > 0 ? [...new Set(lostTo)].join(", ") : "—";

  return { wins, losses, winRate, lostTo: lostToStr };
}

// -------------------------------------------------------
// Main load
// -------------------------------------------------------
async function loadOverviewPage() {
  const rawSlug  = getQueryParam("slug");   // event slug, e.g. "tournament/vsfighting-xiv/event/tekken-ball"
  const titleEl  = document.getElementById("standings-title");

  setupBackToEvents(rawSlug);

  if (!rawSlug) {
    showNoStandings("No event slug provided in URL.");
    return;
  }

  let allEvents = [];
  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (res.ok) {
      const raw = await res.json();
      const tournaments = raw?.data?.currentUser?.tournaments?.nodes || [];
      tournaments.forEach(t => {
        (t.events || []).forEach(ev => {
          allEvents.push({ ...ev, _tournamentName: t.name, _tournamentSlug: t.slug });
        });
      });
    }
  } catch (err) {
    console.warn("Failed to load brackets.json:", err);
  }

  // Match event by slug
  const target = normaliseSlug(rawSlug);
  const event = allEvents.find(ev => {
    const s = normaliseSlug(ev.slug);
    return s === target || s.endsWith(target) || target.endsWith(s);
  });

  if (!event) {
    showNoStandings(`Event not found for slug: "${rawSlug}".`);
    return;
  }

  setupBackToEvents(event._tournamentSlug || rawSlug);

  // Update page title
  const prefix = event._tournamentName ? `${event._tournamentName} — ` : "";
  if (titleEl) titleEl.textContent = `${prefix}${event.name ?? "Event Overview"}`;
  document.title = `${event.name ?? "Overview"} | DQRetro`;

  // Wire up navigation buttons
  const encodedSlug = encodeURIComponent(rawSlug);
  setHref("overview-bracket-btn", `/pages/tournaments/brackets.html?slug=${encodedSlug}`);
  setHref("overview-top-btn",     `/pages/tournaments/topcut.html?slug=${encodedSlug}`);
  setHref("overview-stats-btn",   `/pages/tournaments/stats.html?slug=${encodedSlug}`);

  // Update Start.gg Direct Hub button URL
  const startggBtn = document.getElementById("startgg-direct-btn");
  if (startggBtn) {
    const targetSlug = (event.slug || rawSlug).replace(/^\/+/, "");
    startggBtn.href = `https://start.gg/${targetSlug}`;
  }

  // Render standings
  const nodes = event.standings?.nodes || [];
  const sets = event.sets?.nodes || [];

  if (!nodes.length) {
    showNoStandings("No standings data available for this event yet.");
    return;
  }

  allEntrants = nodes.map((node, i) => {
    const entrantObj = node.entrant || {};
    const name = entrantObj.name || node.name || "Unknown";
    const placement = Number(node.placement ?? i + 1);
    const entrantId = entrantObj.id;

    const stats = computeStats(sets, entrantId, name);

    return {
      name,
      placement,
      wins:    stats.wins,
      losses:  stats.losses,
      winRate: stats.winRate,
      lostTo:  stats.lostTo
    };
  }).sort((a, b) => a.placement - b.placement);

  renderTable(allEntrants.slice(0, 8));
}

// -------------------------------------------------------
// Table rendering
// -------------------------------------------------------
function renderTable(list) {
  const tbody = document.getElementById("standings-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!list.length) {
    showNoStandings("No players found.");
    return;
  }

  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.placement}</td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${escapeHtml(p.winRate)}</td>
      <td>${escapeHtml(p.lostTo)}</td>`;
    tbody.appendChild(tr);
  });
}

function showNoStandings(msg) {
  const tbody = document.getElementById("standings-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2em; color:var(--muted);">
          ${escapeHtml(msg)}
        </td>
      </tr>`;
  }
}

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------
function setHref(id, path) {
  const el = document.getElementById(id);
  if (el) el.href = withBase(path);
}

function setupSearch() {
  const input = document.getElementById("search");
  if (!input) return;
  input.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = (q ? allEntrants.filter(p => p.name.toLowerCase().includes(q)) : allEntrants)
      .slice(0, 8);
    renderTable(filtered);
  });
}

// -------------------------------------------------------
// Init
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  loadOverviewPage();
});