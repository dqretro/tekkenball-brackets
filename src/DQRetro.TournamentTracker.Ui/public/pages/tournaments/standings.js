// ===========================
// standings.js
// ===========================

function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  path = path.replace(/^\/+/, "");
  return `${base}/${path}`;
}

function normalizeSlug(slug) {
  if (!slug) return "";
  return slug
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .trim();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -------------------------------------------------------
// Back to Events navigation
// -------------------------------------------------------
function setupBackToEvents(rawSlug) {
  const btn = document.getElementById("back-to-events");
  if (!btn) return;

  let tournamentSlug = rawSlug || "";
  if (tournamentSlug.includes("/event/")) {
    tournamentSlug = tournamentSlug.split("/event/")[0];
  }

  const backUrl = tournamentSlug
    ? withBase(`pages/tournaments/events.html?slug=${encodeURIComponent(tournamentSlug)}`)
    : withBase("pages/tournaments/events.html");

  btn.innerHTML = `<a href="${backUrl}" class="back-button pool-card">← Back to Events</a>`;
}

// -------------------------------------------------------
// Data fetching
// -------------------------------------------------------
async function getAllEvents() {
  let rawEvents = [];
  try {
    const res = await fetch(withBase("data/brackets.json"));
    if (res.ok) {
      const liveData = await res.json();
      const tournaments = liveData?.data?.currentUser?.tournaments?.nodes || [];
      tournaments.forEach(t => {
        if (Array.isArray(t.events)) {
          t.events.forEach(e => rawEvents.push({ ...e, _tournamentName: t.name, _tournamentSlug: t.slug }));
        }
      });
    }
  } catch (err) {
    console.warn("brackets.json fetch failed:", err);
  }
  return rawEvents;
}

async function findEventBySlug(targetSlug) {
  const target = normalizeSlug(targetSlug);
  const events = await getAllEvents();
  return events.find(e => {
    const s = normalizeSlug(e.slug || "");
    return s === target || s.endsWith(target) || target.endsWith(s);
  }) || null;
}

// -------------------------------------------------------
// Calculate wins / losses / winRate / lostTo from sets data
// -------------------------------------------------------
function calcStatsFromSets(sets, entrantId, entrantName) {
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

    const opponentSlot = slots.find(s =>
      s.entrant && (
        String(s.entrant.id) !== String(entrantId) &&
        s.entrant.name !== entrantName
      )
    );

    const playerSlot = slots.find(s =>
      s.entrant && (
        String(s.entrant.id) === String(entrantId) ||
        s.entrant.name === entrantName
      )
    );

    const opponentIsDQ = opponentSlot?.standing?.stats?.score?.value === -1 || opponentSlot?.isDQ;
    const playerIsDQ = playerSlot?.standing?.stats?.score?.value === -1 || playerSlot?.isDQ;

    // Skip if there is no winnerId and no DQ flags present
    if (!set.winnerId && !opponentIsDQ && !playerIsDQ) return;

    // Count win if set.winnerId matches player OR opponent was DQ'd (and player wasn't)
    const won = (set.winnerId && String(set.winnerId) === String(playerSlot?.entrant?.id)) ||
                (opponentIsDQ && !playerIsDQ);

    if (won) {
      wins++;
    } else {
      losses++;
      if (opponentSlot?.entrant?.name) {
        lostTo.push(opponentSlot.entrant.name);
      }
    }
  });

  const total = wins + losses;
  const winRate = total > 0 ? `${Math.round((wins / total) * 100)}%` : "—";
  const lostToStr = lostTo.length > 0 ? [...new Set(lostTo)].join(", ") : "—";

  return { wins, losses, winRate, lostTo: lostToStr };
}

// -------------------------------------------------------
// Update page title & navigation
// -------------------------------------------------------
async function updateEventHeader(slug) {
  const event = await findEventBySlug(slug);
  const titleEl = document.getElementById("standings-title");
  if (titleEl && event) {
    const prefix = event._tournamentName ? `${event._tournamentName} — ` : "";
    titleEl.textContent = `${prefix}${event.name ?? ""}`;
  }
  setupBackToEvents(event?._tournamentSlug || event?.slug || slug);
}

// -------------------------------------------------------
// Main standings loader
// -------------------------------------------------------
async function loadStandings(slug) {
  const tbody = document.getElementById("standings-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2em; color:var(--muted);">Loading...</td></tr>`;

  const event = await findEventBySlug(slug);

  if (!event) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2em; color:var(--muted);">No event found for this slug.</td></tr>`;
    setupBackToEvents(slug);
    return;
  }

  setupBackToEvents(event._tournamentSlug || event.slug || slug);

  const standingNodes = event.standings?.nodes || [];
  const sets = event.sets?.nodes || [];

  if (!standingNodes.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2em; color:var(--muted);">No standings available for this event.</td></tr>`;
    return;
  }

  const entrants = standingNodes.map((node, index) => {
    const entrantObj = node.entrant || {};
    const name = entrantObj.name || node.name || "Unknown Player";
    const placement = node.placement ?? (index + 1);
    const entrantId = entrantObj.id;

    // Calculate stats from sets data
    const stats = calcStatsFromSets(sets, entrantId, name);

    return {
      name,
      placement: Number(placement),
      wins:    stats.wins,
      losses:  stats.losses,
      winRate: stats.winRate,
      lostTo:  stats.lostTo
    };
  });

  entrants.sort((a, b) => a.placement - b.placement);

  tbody.innerHTML = "";
  entrants.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.placement}</td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${item.wins}</td>
      <td>${item.losses}</td>
      <td>${item.winRate}</td>
      <td>${escapeHtml(item.lostTo)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadEventStats(slug) {
  return await findEventBySlug(slug);
}