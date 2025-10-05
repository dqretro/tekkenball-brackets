let allPlayers = [];
let allAchievements = [];
let achievementIcons = {}; // For icons JSON

// ---------------------------
// Helpers
// ---------------------------
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
  switch (game.toLowerCase()) {
    case "tekken tag tournament 1": return "ttt1";
    case "tekken tag tournament 2": return "ttt2";
    case "tekken 1": return "tk1";
    case "tekken 2": return "tk2";
    case "tekken 3": return "tk3";
    case "tekken 4": return "tk4";
    case "tekken 5": return "tk5";
    case "tekken 6": return "tk6";
    case "tekken 7": return "tk7";
    case "tekken 8": return "tk8";
    default: return "tk8";
  }
}

// ---------------------------
// Base path helper (local vs GitHub Pages)
// ---------------------------
function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (path.startsWith("/")) path = path.slice(1); // Remove leading slash
  return `${base}/${path}`;
}

// ---------------------------
// Load JSON data
// ---------------------------
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

// ---------------------------
// Fetch tournament data and calculate stats
// ---------------------------
async function collectPlayerData(playerName) {
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    const data = await res.json();

    const charUsage = {};
    let tournamentsPlayed = 0;
    let wins = 0, losses = 0, titles = 0;
    let winStreak = 0, maxWinStreak = 0, lossStreak = 0, maxLossStreak = 0;
    let top3Count = 0, firstPlaceCount = 0, top4Count = 0, top8Count = 0;

    // Achievement trackers
    let multiGameSet = new Set();
    let multiCitySet = new Set();
    let multiYearSet = new Set();
    let mainCharacterEvents = 0;
    let differentCharactersSet = new Set();
    let perfectEvent = false;
    let beatChampion = false;
    let seedTop3 = false;
    let lastMatchWin = false;
    let roundSurvivor = false;
    let teamEvents = 0;
    let defeatSameOpponentStreak = 0;

    const tournamentsList = [];
    const upcomingEvents = [];
    const now = new Date();

    for (const tournament of data.tournaments) {
      const eventGroup = data.events.find(e => e.slug === tournament.slug);
      if (!eventGroup || !Array.isArray(eventGroup.events)) continue;

      for (const event of eventGroup.events) {
        const entrants = event.entrants?.nodes || [];
        const entrant = entrants.find(e => e.name.toLowerCase() === playerName.toLowerCase());
        if (!entrant) continue;

        const eventDate = new Date(event.startAt || tournament.startAt);

        if (eventDate > now) {
          upcomingEvents.push({
            event: event.name,
            date: eventDate.toLocaleDateString(),
            slug: event.slug
          });
          continue;
        }

        tournamentsPlayed++;
        wins += entrant.wins || 0;
        losses += entrant.losses || 0;

        if (event.game) multiGameSet.add(event.game);
        if (event.city) multiCitySet.add(event.city);
        multiYearSet.add(eventDate.getFullYear());

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

        if (placement === 1) {
          titles++;
          firstPlaceCount++;
        }
        if (placement > 0 && placement <= 3) top3Count++;
        if (placement > 0 && placement <= 4) top4Count++;
        if (placement > 0 && placement <= 8) top8Count++;

        if (placement === 1) {
          winStreak++;
          maxWinStreak = Math.max(maxWinStreak, winStreak);
          lossStreak = 0;
        } else {
          lossStreak++;
          maxLossStreak = Math.max(maxLossStreak, lossStreak);
          winStreak = 0;
        }

        const chars = entrant.characters || [];
        chars.forEach(c => {
          charUsage[c] = (charUsage[c] || 0) + 1;
          differentCharactersSet.add(c);
        });

        if (entrant.losses === 0 && placement === 1) perfectEvent = true;
        if (entrant.seed && entrant.seed >= 10 && placement <= 3) seedTop3 = true;
        if (entrant.wonLastMatch) lastMatchWin = true;
        if (entrant.roundsLost === 0) roundSurvivor = true;
        if (entrant.teamEvent) teamEvents++;
        if (entrant.defeatedChampion) beatChampion = true;
        if (entrant.defeatedSameOpponentStreak) {
          defeatSameOpponentStreak = Math.max(defeatSameOpponentStreak, entrant.defeatedSameOpponentStreak);
        }

        tournamentsList.push({
          event: event.name,
          placement,
          date: event.startAt || tournament.startAt,
          slug: event.slug,
          notableWins: entrant.notableWins || "",
          mainGame: event.game || "tekken 8"
        });
      }
    }

    let mainCharacter = null;
    if (Object.keys(charUsage).length > 0) {
      mainCharacter = Object.entries(charUsage).sort((a, b) => b[1] - a[1])[0][0];
    }
    const subCharacters = Object.keys(charUsage).filter(c => c !== mainCharacter);
    mainCharacterEvents = charUsage[mainCharacter] || 0;

    tournamentsList.sort((a, b) => new Date(b.date) - new Date(a.date));
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      stats: {
        tournamentsPlayed,
        wins,
        losses,
        winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + "%" : "0%",
        titles,
        firstPlace: firstPlaceCount,
        top3: top3Count,
        top4: top4Count,
        top8: top8Count,
        winStreak: maxWinStreak,
        lossStreak: maxLossStreak,
        differentCharacters: differentCharactersSet.size,
        mainCharacterEvents,
        teamEvents,
        multiGame: multiGameSet.size > 1,
        multiCity: multiCitySet.size,
        multiYear: multiYearSet.size,
        perfectEvent,
        beatChampion,
        seedTop3,
        lastMatchWin,
        roundSurvivor,
        defeatSameOpponentStreak
      },
      mainCharacter,
      subCharacters,
      tournamentsList,
      upcomingEvents
    };
  } catch (err) {
    console.error("Failed to fetch tournaments:", err);
    return { stats: {}, mainCharacter: null, subCharacters: [], tournamentsList: [], upcomingEvents: [] };
  }
}

// ---------------------------
// Dynamic Achievement Checker
// ---------------------------
function getUnlockedAchievements(playerData) {
  if (!allAchievements || !allAchievements.length) return [];
  return allAchievements.filter(a => {
    const conditions = a.condition || {};
    const stats = playerData.stats || {};

    for (const [key, value] of Object.entries(conditions)) {
      const playerValue = stats[key];

      if (typeof value === "boolean") {
        if (playerValue !== value) return false;
      } else if (typeof value === "number") {
        if (!playerValue || playerValue < value) return false;
      }
    }
    return true;
  });
}

// ---------------------------
// Populate profile
// ---------------------------
async function populatePlayerProfile(player) {
  if (!player) return;

  await loadAchievements();
  await loadAchievementIcons();

  document.getElementById("playerName").textContent = player.name;

  const teamWrapper = document.getElementById("playerTeamWrapper");
  if (player.team && player.team.trim() !== "") {
    document.getElementById("playerTeam").textContent = player.team;
    teamWrapper.style.display = "block";
  } else {
    teamWrapper.style.display = "none";
  }

  const countryWrapper = document.getElementById("playerCountryWrapper");
  if (player.country && player.country.trim() !== "") {
    document.getElementById("playerCountry").textContent = player.country;
    countryWrapper.style.display = "block";
  } else {
    countryWrapper.style.display = "none";
  }

  const avatarImg = document.querySelector(".player-avatar-modern");
  avatarImg.src = player.avatar || withBase("/images/placeholders/icons-profile/icon-pfp-player.png");

  const playerData = await collectPlayerData(player.name);

  // Main character image (dynamic game folder)
  const mainCharImg = document.getElementById("playerMainCharacterImg");
  if (playerData.mainCharacter) {
    const mainCharGame = getGameFolder(playerData.mainCharacter);
    mainCharImg.src = withBase(`/images/games/${mainCharGame}/characters/characters_select/select_${playerData.mainCharacter.toLowerCase()}.png`);
  } else {
    mainCharImg.src = withBase("/images/games/default.png");
  }

  // Sub-characters images (dynamic game folder)
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

  const stats = playerData.stats || {};
  document.getElementById("tournamentsPlayed").textContent = stats.tournamentsPlayed || 0;
  document.getElementById("wins").textContent = stats.wins || 0;
  document.getElementById("losses").textContent = stats.losses || 0;
  document.getElementById("winRate").textContent = stats.winRate || "0%";
  document.getElementById("titles").textContent = stats.titles || 0;

  const badges = document.querySelector(".badge-list");
  badges.innerHTML = "";
  const unlocked = getUnlockedAchievements(playerData);
  unlocked.forEach(a => {
    const span = document.createElement("span");
    span.className = "badge";
    const icon = achievementIcons[a.id] || "";
    span.innerHTML = `${icon} <span class="badge-text">${a.title}</span>`;
    span.title = a.description;
    badges.appendChild(span);
  });

  const historyBody = document.getElementById("tournamentHistory");
  historyBody.innerHTML = "";
  playerData.tournamentsList.forEach(t => {
    const tournamentLink = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(t.slug)}`);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${tournamentLink}">${t.event}</a></td>
      <td>${t.placement}</td>
      <td>${new Date(t.date).toLocaleDateString()}</td>
      <td>${t.notableWins}</td>
    `;
    historyBody.appendChild(tr);
  });

  const upcomingList = document.getElementById("upcomingEvents");
  upcomingList.innerHTML = "";
  playerData.upcomingEvents.forEach(e => {
    const eventLink = withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(e.slug)}`);
    const li = document.createElement("li");
    li.innerHTML = `<a href="${eventLink}">${e.event}</a> – ${e.date}`;
    upcomingList.appendChild(li);
  });
}

// ---------------------------
// Load players JSON and show profile
// ---------------------------
async function loadPlayerProfile() {
  try {
    const res = await fetch(withBase("/pages/player-profiles/players/players.json"));
    allPlayers = await res.json();

    const slug = getQueryParam("player");
    let player;

    if (!slug) {
      console.warn("No player specified in query. Showing first player.");
      player = allPlayers[0];
    } else {
      player = allPlayers.find(p => createSlug(p.name) === slug);
      if (!player) {
        console.error("Player not found:", slug);
        showNotFound("Player not found.");
        return;
      }
    }

    await populatePlayerProfile(player);
  } catch (err) {
    console.error("Failed to load players JSON:", err);
    showNotFound("Failed to load player data.");
  }
}

// ---------------------------
// Init
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();
  loadPlayerProfile();
});
