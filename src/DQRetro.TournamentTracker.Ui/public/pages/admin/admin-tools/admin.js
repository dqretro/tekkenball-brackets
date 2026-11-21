// -----------------------------
// Game Characters Data
// -----------------------------
const gameCharacters = {
  tekken3: ["Jin", "Kazuya", "Heihachi", "Paul", "Nina"],
  tekken8: ["Asuka", "Yoshimitsu", "Jack-8", "Clive", "Anna", "Law", "Kuma", "Azucena", "Victor", "Devil-Jin"],
  tag2: ["Jin", "Kazuya", "Ling", "Hwoarang", "Law", "King", "Asuka", "Yoshimitsu"]
};

// -----------------------------
// LocalStorage helpers
// -----------------------------
const STORAGE_KEY = "adminPlayers";

function getPlayers() {
  const players = localStorage.getItem(STORAGE_KEY);
  return players ? JSON.parse(players) : [];
}

function savePlayers(players) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

// -----------------------------
// Player Management
// -----------------------------
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

async function removePlayer(name) {
  const players = getPlayers();
  const updatedPlayers = players.filter(p => p.name !== name);
  savePlayers(updatedPlayers);
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
// Render Player List with Remove
// -----------------------------
async function renderPlayerList() {
  const ul = document.getElementById("playerList");
  const players = getPlayers();
  ul.innerHTML = "";

  players.forEach(player => {
    const li = document.createElement("li");
    li.classList.add("player-item");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${player.name} - ${player.mainCharacter}`;
    nameSpan.addEventListener("click", () => openEditPlayerForm(player));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.classList.add("remove-btn");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Remove player "${player.name}"?`)) {
        removePlayer(player.name);
      }
    });

    li.appendChild(nameSpan);
    li.appendChild(removeBtn);
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
    populateCharacterDropdowns(e.target.value);
  });

  document.getElementById("addPlayerBtn").addEventListener("click", () => {
    const name = document.getElementById("newPlayerName").value.trim();
    const character = document.getElementById("newPlayerCharacter").value;
    if (!name) return alert("Enter a player name");
    addPlayer(name, character);
    document.getElementById("newPlayerName").value = "";
  });

  document.getElementById("updatePlayerBtn").addEventListener("click", () => {
    const name = document.getElementById("updatePlayerName").value.trim();
    const character = document.getElementById("updatePlayerCharacter").value;
    if (!name) return alert("Enter a player name");
    updatePlayer(name, character);
  });
});
