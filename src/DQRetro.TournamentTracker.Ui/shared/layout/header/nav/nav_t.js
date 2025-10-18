async function loadNav() {
  const placeholder = document.getElementById("nav-t-placeholder");
  if (!placeholder) return;

  // Detect base path
  const base = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

  // Default slug
  const DEFAULT_SLUG = "vsfighting-xiii-tekken-ball-hosted-by-dqretro";

  // Get slug from URL
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug") || DEFAULT_SLUG;

  // Ensure slug is in the current URL
  if (!urlParams.get("slug")) {
    urlParams.set("slug", slug);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }

  // Inject nav HTML
  placeholder.innerHTML = `
    <nav>
      <!-- Logos -->
      <a href="${base}/index.html" class="nav-logo" id="homeLogo">
        <img src="${base}/images/dqretro/logos/dqretro_logo_purpleyblue.png" alt="DQRetro Logo" height="50">
      </a>
      <a href="${base}/pages/tournaments/tournaments.html" class="nav-logo" id="tournamentLogo">
        <img src="${base}/images/dqretro/logos/tournament_logo.png" alt="Tournament Logo" height="50">
      </a>

      <!-- Tournament Links -->
      <a data-slug-link="overview" href="#">Overview</a>
      <a data-slug-link="brackets" href="#">Brackets</a>
      <a data-slug-link="standings" href="#">Standings</a>
      <a data-slug-link="matches" href="#">Matches</a>
      <a data-slug-link="stats" href="#">Stats</a>

      <!-- Non-slug link -->
      <a href="${base}/pages/player-profiles/players-search/players-search.html">Players-Profiles</a>
      
    </nav>
  `;

  // Make tournament links slug-aware and clickable
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    const page = link.getAttribute("data-slug-link");

    // Build the full URL
    const linkParams = new URLSearchParams(window.location.search);
    linkParams.set("slug", slug);
    const target = `${base}/pages/tournaments/${page}.html?${linkParams.toString()}`;

    // Force full reload with correct slug
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.assign(target);
    });

    // Highlight current page
    const currentPage = window.location.pathname.split("/").pop().replace(".html", "");
    link.classList.toggle("active", page === currentPage);
  });
}

document.addEventListener("DOMContentLoaded", loadNav);
