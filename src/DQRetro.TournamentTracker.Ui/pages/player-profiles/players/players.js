// ============================
// GLOBAL VARIABLES
// ============================
let allPlayers = [];
let allAchievements = [];
let achievementIcons = {}; 
let winLossChart;
let charUsageChart;

// ============================
// HELPERS
// ============================
function createSlug(name) {
  return name.toLowerCase()
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function getGameFolder(game) {
  const mapping = {
    "tekken tag tournament 1": "ttt1",
    "tekken tag tournament 2": "ttt2",
    "tekken 1": "tk1",
    "tekken 2": "tk2",
    "tekken 3": "tk3",
    "tekken 4": "tk4",
    "tekken 5": "tk5",
    "tekken 6": "tk6",
    "tekken 7": "tk7",
    "tekken 8": "tk8"
  };
  return mapping[game.toLowerCase()] || "tk8";
}

function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (path.startsWith("/")) path = path.slice(1);
  return `${base}/${path}`;
}

function showNotFound(message) {
  alert(message);
  document.body.innerHTML = `<h1 style="color:white;text-align:center;margin-top:3em;">${message}</h1>`;
}

// ============================
// RANKING SYSTEM (placement -> points)
// ============================
function getPlacementPoints(placement) {
  switch (placement) {
    case 1: return 10;
    case 2: return 8;
    case 3: return 6;
    case 4: return 5;
    case 5: 
    case 6: return 4;
    case 7: 
    case 8: return 2;
    default: return 1;
  }
}

// ============================
// LOAD ACHIEVEMENTS & ICONS
// ============================
async function loadAchievements() {
  try {
    const res = await fetch(withBase("/pages/player-profiles/achievement-list.json"));
    allAchievements = await res.json();
  } catch (err) {
    console.error("Failed to load achievements JSON:", err);
    allAchievements = [];
  }
}

async function loadAchievementIcons() {
  try {
    const res = await fetch(withBase("/pages/player-profiles/achievement-icons.json"));
    achievementIcons = await res.json();
  } catch (err) {
    console.error("Failed to load achievement icons JSON:", err);
    achievementIcons = {};
  }
}

// ============================
// PLAYER DATA COLLECTION
// ============================
async function collectPlayerData(playerName) {
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    const data = await res.json();

    const charUsage = {};
    let tournamentsPlayed = 0, wins = 0, losses = 0, titles = 0;
    let totalPoints = 0;
    let top3Count = 0, firstPlaceCount = 0, top4Count = 0, top8Count = 0;

    const tournamentsList = [];
    const now = new Date();

    for (const tournament of data.tournaments) {
      const eventGroup = data.events.find(e => e.slug === tournament.slug);
      if (!eventGroup || !Array.isArray(eventGroup.events)) continue;

      for (const event of eventGroup.events) {
        const entrant = event.entrants?.nodes?.find(e => e.name.toLowerCase() === playerName.toLowerCase());
        if (!entrant) continue;

        const eventDate = new Date(event.startAt || tournament.startAt);
        if (eventDate > now) continue;

        tournamentsPlayed++;
        wins += entrant.wins || 0;
        losses += entrant.losses || 0;

        let placement = null;
        if (event.topcut?.players) {
          const idx = event.topcut.players.findIndex(p => p.toLowerCase() === playerName.toLowerCase());
          if (idx >= 0) placement = idx + 1;
        }
        if (!placement && Array.isArray(event.pools)) {
          for (const pool of event.pools) {
            const idx = pool.players.findIndex(p => p.toLowerCase() === playerName.toLowerCase());
            if (idx >= 0) {
              placement = idx + 1 + (event.topcut?.size || 0);
              break;
            }
          }
        }
        if (!placement) placement = 0;

        totalPoints += getPlacementPoints(placement);
        if (placement === 1) { titles++; firstPlaceCount++; }
        if (placement > 0 && placement <= 3) top3Count++;
        if (placement > 0 && placement <= 4) top4Count++;
        if (placement > 0 && placement <= 8) top8Count++;

        const chars = entrant.characters || [];
        chars.forEach(c => charUsage[c] = (charUsage[c] || 0) + 1);

        tournamentsList.push({
          event: event.name,
          placement,
          date: event.startAt || tournament.startAt,
          slug: event.slug,
          notableWins: entrant.notableWins || "",
          mainGame: event.game || "tekken 8",
          characters: entrant.characters || []
        });
      }
    }

    const mainCharacter = Object.keys(charUsage).sort((a, b) => charUsage[b] - charUsage[a])[0] || null;
    const subCharacters = Object.keys(charUsage).filter(c => c !== mainCharacter);

    return {
      stats: {
        tournamentsPlayed, wins, losses, winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + "%" : "0%",
        titles, points: totalPoints, firstPlace: firstPlaceCount, top3: top3Count, top4: top4Count, top8: top8Count,
        characterUsage: charUsage
      },
      mainCharacter, subCharacters, tournamentsList
    };
  } catch (err) {
    console.error("Failed to fetch tournaments:", err);
    return { stats: {}, mainCharacter: null, subCharacters: [], tournamentsList: [] };
  }
}

// ============================
// ACHIEVEMENT CHECKER
// ============================
function getUnlockedAchievements(playerData) {
  if (!allAchievements.length) return [];
  return allAchievements.filter(a => {
    const conditions = a.condition || {};
    const stats = playerData.stats || {};
    for (const [key, value] of Object.entries(conditions)) {
      const playerValue = stats[key];
      if (typeof value === "boolean" ? playerValue !== value : (playerValue < value)) return false;
    }
    return true;
  });
}

// ============================
// POPULATE PLAYER PROFILE
// ============================
async function populatePlayerProfile(player) {
  if (!player) return;

  await loadAchievements();
  await loadAchievementIcons();

  document.getElementById("playerName").textContent = player.name;
  document.getElementById("playerTeam").textContent = player.team || "-";
  document.getElementById("playerCountry").textContent = player.country || "-";

  const avatarImg = document.querySelector(".player-avatar-modern");
  avatarImg.src = player.avatar || withBase("/images/placeholders/icons-profile/icon-pfp-player.png");

  const playerData = await collectPlayerData(player.name);
  const stats = playerData.stats || {};

  // Main character display
  const mainCharImg = document.getElementById("playerMainCharacterImg");
  if (playerData.mainCharacter) {
    const gameFolder = getGameFolder(playerData.mainCharacter);
    mainCharImg.src = withBase(`/images/games/${gameFolder}/characters/characters_select/select_${playerData.mainCharacter.toLowerCase()}.png`);
  } else mainCharImg.src = withBase("/images/games/default.png");

  // Sub characters
  const subContainer = document.getElementById("playerSubCharactersIcons");
  subContainer.innerHTML = "";
  playerData.subCharacters.forEach(char => {
    const charGame = getGameFolder(char);
    const img = document.createElement("img");
    img.src = withBase(`/images/games/${charGame}/characters/characters_select/select_${char.toLowerCase()}.png`);
    img.alt = char;
    img.title = char;
    img.className = "character-icon";
    subContainer.appendChild(img);
  });

  // Stats
  document.getElementById("tournamentsPlayed").textContent = stats.tournamentsPlayed || 0;
  document.getElementById("wins").textContent = stats.wins || 0;
  document.getElementById("losses").textContent = stats.losses || 0;
  document.getElementById("winRate").textContent = stats.winRate || "0%";
  document.getElementById("titles").textContent = stats.titles || 0;
  if (document.getElementById("playerPoints"))
    document.getElementById("playerPoints").textContent = stats.points || 0;

  // Achievements
  const badges = document.querySelector(".badge-list");
  badges.innerHTML = "";
  getUnlockedAchievements(playerData).forEach(a => {
    const span = document.createElement("span");
    span.className = "badge";
    span.innerHTML = (achievementIcons[a.id] || "") + ` <span class="badge-text">${a.title}</span>`;
    span.title = a.description;
    badges.appendChild(span);
  });

  // Tournament history
  const historyBody = document.getElementById("tournamentHistory");
  historyBody.innerHTML = "";
  playerData.tournamentsList.forEach(t => {
    const tournamentLink = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(t.slug)}`);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><a href="${tournamentLink}">${t.event}</a></td><td>${t.placement}</td><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.notableWins}</td>`;
    historyBody.appendChild(tr);
  });

  // Win/Loss chart
  const ctx = document.getElementById("winLossChart").getContext("2d");
  if (winLossChart?.destroy) winLossChart.destroy();
  winLossChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels: ["Wins","Losses"], datasets: [{ data: [stats.wins||0, stats.losses||0], backgroundColor: ["#4CAF50","#F44336"] }] },
    options: { responsive:true, cutout:"70%", plugins:{ legend:{ labels:{ color:"#fff" } } } }
  });

  // Character Usage chart
  const ctxChar = document.getElementById("charUsageChart").getContext("2d");
  if (charUsageChart?.destroy) charUsageChart.destroy();
  const charEntries = Object.entries(stats.characterUsage || {});
  const labels = charEntries.map(([c]) => c);
  const dataVals = charEntries.map(([_, v]) => v);
  charUsageChart = new Chart(ctxChar, {
    type:"doughnut",
    data: { labels, datasets:[{ data: dataVals, backgroundColor: ["#4CAF50","#2196F3","#FFC107","#9C27B0","#FF5722","#03A9F4","#E91E63","#8BC34A","#FF9800","#607D8B"].slice(0, labels.length) }]},
    options:{ responsive:true, cutout:"70%", plugins:{ legend:{ labels:{ color:"#fff" } } } }
  });

  // Render placement timeline
  renderPlacementTimeline(playerData.tournamentsList);
}

// ============================
// UPDATED PLACEMENT TIMELINE
// ============================
function renderPlacementTimeline(tournamentsList) {
  if (!Array.isArray(tournamentsList) || !tournamentsList.length) return;

  const characterGroups = {};

  tournamentsList.forEach(t => {
    if (!t.placement || t.placement <= 0) return;
    const chars = t.characters || [];
    chars.forEach(char => {
      if (!characterGroups[char]) characterGroups[char] = [];
      characterGroups[char].push({
        date: new Date(t.date),
        placement: t.placement,
        event: t.event,
        points: getPlacementPoints(t.placement),
        game: t.mainGame
      });
    });
  });

  const traces = [];
  Object.entries(characterGroups).forEach(([char, entries]) => {
    entries.sort((a, b) => a.date - b.date);
    const colors = entries.map(e => {
      if (e.placement === 1) return "#4CAF50";
      if (e.placement <= 3) return "#FFEB3B";
      if (e.placement <= 8) return "#FF9800";
      return "#9E9E9E";
    });

    traces.push({
      x: entries.map(e => e.date),
      y: entries.map(e => e.placement),
      name: char,
      text: entries.map(e =>
        `${e.event} (${e.game})<br><b>Placement:</b> ${e.placement}<br><b>Points:</b> ${e.points}<br><b>Character:</b> ${char}`
      ),
      type: "scatter",
      mode: "lines+markers",
      marker: { color: colors, size: 10, line: { width: 1, color: "#ffffffff" } },
      line: { shape: "linear" },
      hovertemplate: "%{text}<br>Date: %{x|%Y-%m-%d}<extra></extra>"
    });
  });

  const layout = {
    title: { text: "Tournament Placements by Character", font: { color: "#ffffffff", size: 18 } },
    yaxis: { autorange: "reversed", title: "Placement", dtick: 1 },
    xaxis: {
      title: "Date",
      rangeselector: { buttons: [
        { count: 1, label: "1y", step: "year", stepmode: "backward" },
        { count: 2, label: "2y", step: "year", stepmode: "backward" },
        { step: "all" }
      ]},
      rangeslider: { visible: true },
      type: "date"
    },
    margin: { t: 60, r: 30, l: 50, b: 50 },
    hovermode: "closest",
    plot_bgcolor: "#1b1b1bff",
    paper_bgcolor: "#494949ff",
    font: { color: "#ffffffff" },
    legend: {
      title: { text: "Characters Used", font: { color: "#fff" } },
      orientation: "h",
      y: -0.25
    }
  };

  Plotly.newPlot("placementTimelineChart", traces, layout, { responsive: true });
}

// ============================
// LOAD PLAYER PROFILE
// ============================
async function loadPlayerProfile() {
  try {
    const res = await fetch(withBase("/pages/player-profiles/players/players.json"));
    allPlayers = await res.json();
    const slug = getQueryParam("player");
    const player = slug ? allPlayers.find(p => createSlug(p.name) === slug) : allPlayers[0];
    if (!player) return showNotFound("Player not found.");
    await populatePlayerProfile(player);
  } catch (err) {
    console.error("Failed to load players JSON:", err);
    showNotFound("Failed to load player data.");
  }
}

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadNav === "function") loadNav();
  if (typeof loadFooter === "function") loadFooter();
  loadPlayerProfile();
});
