// ---------------------------
// Top Cut Display
// ---------------------------
async function loadTopCut(slug) {
  const topcutContainer = document.getElementById("topcutContainer");
  if (!topcutContainer || !slug) return;

  const tournament = await fetchTournament(slug);
  if (!tournament) return;

  const event = tournament.events.find(ev => ev.slug === slug);
  if (!event || !event.topcut) {
    topcutContainer.innerHTML = "<p>No top cut available.</p>";
    return;
  }

  // Update topcut size text
  const topcutSizeText = document.getElementById("topcut-size-text");
  if (topcutSizeText) topcutSizeText.textContent = `Top ${event.topcut.size}`;

  // Clear container
  topcutContainer.innerHTML = "";

  // Render topcut card
  const topcutCard = document.createElement("a");
  topcutCard.className = "pool-card";
  topcutCard.href = withBase(`/pages/tournaments/topcut.html?slug=${encodeURIComponent(slug)}`);
  topcutCard.textContent = `Top ${event.topcut.size} Bracket`;
  topcutContainer.appendChild(topcutCard);
}

// Auto-load on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if(slug) await loadTopCut(slug);
});
