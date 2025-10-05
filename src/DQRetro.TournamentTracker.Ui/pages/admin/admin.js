// -----------------------------
// Game Characters Data
// -----------------------------
const gameCharacters = {
  tekken3: ["Jin", "Kazuya", "Heihachi", "Paul", "Nina"],
  tekken8: ["Asuka", "Yoshimitsu", "Jack-8", "Clive", "Anna", "Law", "Kuma", "Azucena", "Victor", "Devil-Jin"],
  tag2: ["Jin", "Kazuya", "Ling", "Hwoarang", "Law", "King", "Asuka", "Yoshimitsu"]
};

// -----------------------------
// LocalStorage simulation for API
// -----------------------------
const STORAGE_KEY = "adminPlayers";

function getPlayers() {
  const players = localStorage.getItem(STORAGE_KEY);
  return players ? JSON.parse(players) : [];
}

function savePlayers(players) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

async function fetchPlayers() {
  return getPlayers();
}

async function addPlayer(name, character) {
  const players = getPlayers();
  players.push({ name, mainCharacter: character });
  savePlayers(players);
  renderPlayerList();
}

async function updatePlayer(name, character) {
  const players = getPlayers().map(p => p.name === name ? { ...p, mainCharacter: character } : p);
  savePlayers(players);
  renderPlayerList();
}

// -----------------------------
// Character Dropdowns
// -----------------------------
function populateCharacterDropdowns(game, selectedCharacter = null) {
  const newPlayerSelect = document.getElementById("newPlayerCharacter");
  const updatePlayerSelect = document.getElementById("updatePlayerCharacter");

  newPlayerSelect.innerHTML = "";
  updatePlayerSelect.innerHTML = "";

  const chars = gameCharacters[game] || [];
  chars.forEach(char => {
    const option1 = document.createElement("option");
    option1.value = char;
    option1.textContent = char;
    if (char === selectedCharacter) option1.selected = true;
    newPlayerSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = char;
    option2.textContent = char;
    if (char === selectedCharacter) option2.selected = true;
    updatePlayerSelect.appendChild(option2);
  });
}

// -----------------------------
// Render Player List
// -----------------------------
async function renderPlayerList() {
  const ul = document.getElementById("playerList");
  const players = await fetchPlayers();
  ul.innerHTML = "";
  players.forEach(player => {
    const li = document.createElement("li");
    li.textContent = `${player.name} - ${player.mainCharacter}`;
    li.addEventListener("click", () => openEditPlayerForm(player));
    ul.appendChild(li);
  });
}

function openEditPlayerForm(player) {
  const eventGame = document.getElementById("eventGame").value;
  populateCharacterDropdowns(eventGame, player.mainCharacter);
  document.getElementById("updatePlayerName").value = player.name;
}

// -----------------------------
// Event Listeners
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const initialGame = document.getElementById("eventGame").value;
  populateCharacterDropdowns(initialGame);
  renderPlayerList();

  document.getElementById("eventGame").addEventListener("change", (e) => {
    const selectedGame = e.target.value;
    populateCharacterDropdowns(selectedGame);
  });

  document.getElementById("addPlayerBtn").addEventListener("click", async () => {
    const name = document.getElementById("newPlayerName").value.trim();
    const character = document.getElementById("newPlayerCharacter").value;
    if (!name) return alert("Enter a player name");
    await addPlayer(name, character);
    document.getElementById("newPlayerName").value = "";
  });

  document.getElementById("updatePlayerBtn").addEventListener("click", async () => {
    const name = document.getElementById("updatePlayerName").value.trim();
    const character = document.getElementById("updatePlayerCharacter").value;
    if (!name) return alert("Enter a player name");
    await updatePlayer(name, character);
  });
});
