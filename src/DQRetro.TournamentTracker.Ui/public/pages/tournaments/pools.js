// ---------------------------
// Pools Display
// ---------------------------
async function loadPools(slug) {
  const poolsContainer = document.getElementById("poolsContainer");
  if (!poolsContainer || !slug) return;

  const decodedSlug = decodeURIComponent(slug);
  const shortSlug = decodedSlug.includes("/event/") ? decodedSlug.split("/event/")[1] : decodedSlug.split("/").pop();

  let event = null;

  // Search through fetchTournament if defined, or directly load JSON
  if (typeof fetchTournament === "function") {
    const tournament = await fetchTournament(slug);
    if (tournament && tournament.events) {
      event = tournament.events.find(ev => 
        ev.slug === decodedSlug || ev.slug === shortSlug || (ev.slug && ev.slug.endsWith(shortSlug))
      );
    }
  }

  if (!event || !event.pools) {
    poolsContainer.innerHTML = "<p>No pools available.</p>";
    return;
  }

  // Update pool count text
  const poolCountText = document.getElementById("pool-count");
  if (poolCountText) poolCountText.textContent = event.pools.length;

  // Clear container
  poolsContainer.innerHTML = "";

  // Render each pool
  event.pools.forEach(pool => {
    const poolCard = document.createElement("a");
    poolCard.className = "pool-card";
    poolCard.href = withBase(`/pages/tournaments/pools.html?slug=${encodeURIComponent(event.slug || shortSlug)}&pool=${encodeURIComponent(pool.name)}`);
    poolCard.textContent = pool.name + " Bracket";
    poolsContainer.appendChild(poolCard);
  });

  // Optional: show first pool name
  const poolsSizeText = document.getElementById("pools-size-text");
  if (poolsSizeText && event.pools.length) poolsSizeText.textContent = event.pools[0].name;
}

// Auto-load on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (slug) await loadPools(slug);
});