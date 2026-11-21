async function loadNav() {
  const placeholder = document.getElementById("nav-t-placeholder");
  if (!placeholder) return;

  // 1. Dynamic Base Path Detection (Handles localhost & GitHub Pages)
  const isGitHub = window.location.hostname.includes("github.io");
  const base = isGitHub ? "/tekkenball-brackets" : "";

  // 2. Extract Slug or Fallback
  const urlParams = new URLSearchParams(window.location.search);
  let slug = urlParams.get("slug");

  // Only fallback if NO slug exists in URL
  if (!slug) {
    slug = "tekken-ball-hosted-by-dqretro";
    urlParams.set("slug", slug);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }

  // 3. Inject Navigation HTML
  placeholder.innerHTML = `
    <nav>
      <!-- Logos -->
      <a href="${base}/index.html" class="nav-logo" id="homeLogo">
        <img src="${base}/images/dqretro/logos/dqretro_logo_purpleyblue.png" alt="DQRetro Logo" height="50">
      </a>
      <a href="${base}/pages/tournaments/tournaments.html" class="nav-logo" id="tournamentLogo">
        <img src="${base}/images/dqretro/icons/dqretro_startgg_tournament_icon.png" alt="Tournament Logo" height="50">
      </a>

      <!-- Tournament Sub-Navigation Links -->
      <a data-slug-link="overview" href="#">Overview</a>
      <a data-slug-link="standings" href="#">Standings</a>
      <a data-slug-link="matches" href="#">Matches</a>
      <a data-slug-link="stats" href="#">Stats</a>

      <!-- Global Navigation -->
      <a href="${base}/pages/player-profiles/players-search/players-search.html">Player Profiles</a>
    </nav>
  `;

  // 4. Attach Dynamic Slug Routing
  const currentPage = window.location.pathname.split("/").pop().replace(".html", "");

  document.querySelectorAll("[data-slug-link]").forEach(link => {
    const page = link.getAttribute("data-slug-link");

    // Build destination URL keeping the active slug parameter
    const linkParams = new URLSearchParams();
    linkParams.set("slug", slug);
    const target = `${base}/pages/tournaments/${page}.html?${linkParams.toString()}`;

    // Direct navigation
    link.href = target;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.assign(target);
    });

    // Highlight current active tab
    if (page === currentPage) {
      link.classList.add("active");
    }
  });
}

// Auto-run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNav);
} else {
  loadNav();
}