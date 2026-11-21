function showNotFound(message) {
  const container = document.querySelector(".container");
  if (!container) return;

  container.innerHTML = `
    <div style="padding:40px; text-align:center; color:var(--muted);">
      <h2>${message}</h2>
      <a href="/pages/tournaments/events.html" class="button secondary">← Return to Events</a>
    </div>
  `;
}

window.showNotFound = showNotFound; // attach to global so regular scripts can use it
