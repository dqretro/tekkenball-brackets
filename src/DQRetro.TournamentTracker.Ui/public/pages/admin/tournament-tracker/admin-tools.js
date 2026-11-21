// =====================
// Admin Tools JS
// =====================

let events = JSON.parse(localStorage.getItem("events")) || [];
let players = JSON.parse(localStorage.getItem("players")) || [];

// =====================
// Utility Functions
// =====================
function saveData() {
  localStorage.setItem("events", JSON.stringify(events));
  localStorage.setItem("players", JSON.stringify(players));
}

function uniqueId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// =====================
// Render Functions
// =====================
function renderEvents() {
  const table = document.getElementById("recentEventsTable");
  const list = document.getElementById("eventList");

  if (table) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";
    events.forEach(ev => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ev.name}</td>
        <td>${ev.game}</td>
        <td>${ev.date}</td>
        <td>${ev.status || "upcoming"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (list) {
    list.innerHTML = "";
    events.forEach(ev => {
      const li = document.createElement("li");
      li.textContent = `${ev.name} (${ev.game}) - ${ev.date}`;
      list.appendChild(li);
    });
  }

  populateEventDropdowns();
}

function renderPlayers() {
  const ul = document.getElementById("playerList");
  if (!ul) return;

  ul.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} (${p.character || "Unknown"})`;
    ul.appendChild(li);
  });

  populatePlayerDropdowns();
}

// =====================
// Dropdown Population
// =====================
function populateEventDropdowns() {
  const assignEventSelect = document.getElementById("assignEventSelect");
  const statusEventSelect = document.getElementById("eventStatusSelect");

  if (assignEventSelect) {
    assignEventSelect.innerHTML = `<option value="">Select Event</option>`;
    events.forEach(ev => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = ev.name;
      assignEventSelect.appendChild(opt);
    });
  }

  if (statusEventSelect) {
    statusEventSelect.innerHTML = "";
    events.forEach(ev => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = ev.name;
      statusEventSelect.appendChild(opt);
    });
  }
}

function populatePlayerDropdowns() {
  const select = document.getElementById("assignPlayerSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select Player</option>`;
  players.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

// =====================
// JSON Loader
// =====================
async function loadJSON() {
  try {
    const resp = await fetch("../../tournaments/placeholder-data/tournaments-placeholder.json");
    if (!resp.ok) throw new Error("Cannot load JSON.");
    const data = await resp.json();

    // Collect all events safely
    const allEvents = []
      .concat(data.events || []) // top-level events
      .concat(
        (data.tournaments || []).flatMap(t => t.events || [])
      )
      .filter(ev => ev); // remove undefined

    const loadedEvents = [];
    const loadedPlayersSet = new Set();

    allEvents.forEach(ev => {
      const eventObj = {
        id: uniqueId(),
        name: ev.name || ev.slug || "Unnamed Event",
        date: ev.startAt || "Unknown",
        game: ev.game || "Unknown",
        location: ev.location || "Unknown",
        desc: ev.slug || "",
        status: ev.status || "upcoming",
        players: (ev.entrants?.nodes || []).map(p => p.name || "Unknown")
      };
      loadedEvents.push(eventObj);

      // Add players safely
      (ev.entrants?.nodes || []).forEach(p => {
        if (!p?.name) return;
        loadedPlayersSet.add(JSON.stringify({
          name: p.name,
          character: p.mainCharacter || "Unknown",
          wins: p.wins || 0,
          losses: p.losses || 0
        }));
      });
    });

    // Merge events without duplicates
    loadedEvents.forEach(e => {
      if (!events.find(ev => ev.name === e.name)) events.push(e);
    });

    // Merge players without duplicates
    const loadedPlayers = Array.from(loadedPlayersSet).map(p => JSON.parse(p));
    loadedPlayers.forEach(p => {
      if (!players.find(lp => lp.name === p.name)) players.push(p);
    });

    // Save and render
    saveData();
    renderEvents();
    renderPlayers();
    renderDashboardSummary();

    console.log("Loaded events and players from JSON successfully!");
  } catch (err) {
    console.error(err);
    alert("Error loading JSON: " + err.message);
  }
}

// =====================
// Create Event
// =====================
function initCreateEvent() {
  const btn = document.getElementById("createEventBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const name = document.getElementById("eventName")?.value || "Untitled";
    const date = document.getElementById("eventDate")?.value || "Unknown";
    const location = document.getElementById("eventLocation")?.value || "Unknown";
    const game = document.getElementById("eventGame")?.value || "Unknown";
    const desc = document.getElementById("eventDescription")?.value || "";

    const newEvent = {
      id: uniqueId(),
      name, date, location, game, desc,
      status: "upcoming",
      players: []
    };

    events.push(newEvent);
    saveData();
    renderEvents();
    alert("Event created!");
  });
}

// =====================
// Assign Player
// =====================
function initAssignPlayer() {
  const btn = document.getElementById("assignPlayerBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const playerName = document.getElementById("assignPlayerSelect")?.value;
    const eventId = document.getElementById("assignEventSelect")?.value;
    if (!playerName || !eventId) return alert("Select player and event.");

    const ev = events.find(e => e.id == eventId);
    if (!ev.players.includes(playerName)) ev.players.push(playerName);

    saveData();
    alert(`Assigned ${playerName} to ${ev.name}`);
  });
}

// =====================
// Update Event Status
// =====================
function initUpdateEventStatus() {
  const btn = document.getElementById("updateEventStatusBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const eventId = document.getElementById("eventStatusSelect")?.value;
    const statusSelect = document.getElementById("statusValueSelect");
    const status = statusSelect ? statusSelect.value : "upcoming";

    const ev = events.find(e => e.id == eventId);
    if (!ev) return alert("Select an event.");

    ev.status = status;
    saveData();
    renderEvents();
    alert(`Status updated for ${ev.name}`);
  });
}

// =====================
// Export / Import JSON
// =====================
function initJSONExportImport() {
  const exportBtn = document.getElementById("exportEventsJSON");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify({ events, players }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admin-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const importInput = document.getElementById("importEventsJSON");
  if (importInput) {
    importInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const data = JSON.parse(evt.target.result);
          if (data.events) events = data.events;
          if (data.players) players = data.players;
          saveData();
          renderEvents();
          renderPlayers();
          alert("Data imported!");
        } catch (err) {
          alert("Invalid JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }
}

// =====================
// Theme Toggle
// =====================
function initThemeToggle() {
  const btn = document.getElementById("toggleThemeBtn");
  if (!btn) return;

  const body = document.body;
  const storedTheme = localStorage.getItem("theme") || "dark";
  body.classList.toggle("dark", storedTheme === "dark");

  btn.addEventListener("click", () => {
    body.classList.toggle("dark");
    const theme = body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", theme);
  });
}

// =====================
// Dashboard Overview
// =====================
function renderDashboardSummary() {
  const summaryDiv = document.getElementById("dashboardSummary") || document.getElementById("dataSummary");
  if (!summaryDiv) return;

  const totalEvents = events.length;
  const totalPlayers = players.length;
  const totalBytes = unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
  const kb = (totalBytes / 1024).toFixed(2);

  summaryDiv.innerHTML = `
    <p><strong>Total Events:</strong> ${totalEvents}</p>
    <p><strong>Total Players:</strong> ${totalPlayers}</p>
    <p><strong>LocalStorage Size:</strong> ${kb} KB used</p>
  `;
}

// =====================
// Initialize Everything
// =====================
document.addEventListener("DOMContentLoaded", () => {
  renderEvents();
  renderPlayers();
  renderDashboardSummary();
  initCreateEvent();
  initAssignPlayer();
  initUpdateEventStatus();
  initJSONExportImport();
  initThemeToggle();

  // Auto-load JSON on page load
  loadJSON();

  // Event listener for manual reload
  document.addEventListener("reloadPlayersFromJSON", loadJSON);
});
