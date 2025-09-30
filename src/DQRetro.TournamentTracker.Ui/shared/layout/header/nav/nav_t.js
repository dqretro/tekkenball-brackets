async function loadNav() {
  const placeholder = document.getElementById("nav-t-placeholder");
  if (!placeholder) return;

  // Determine base path for GitHub Pages vs local
  const base = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

  // Insert nav HTML
  placeholder.innerHTML = `
    <nav>
      <a href="#" class="nav-logo" id="homeLogo">
        <img src="${base}/images/dqretro/logos/dqretro_logo_purpleyblue.png" alt="DQRetro Logo" height="50">
      </a>
      <a href="#" class="nav-logo" id="tournamentLogo">
        <img src="${base}/images/dqretro/logos/tournament_logo.png" alt="Tournament Logo" height="50">
      </a>

      <a data-slug-link="overview">Overview</a>
      <a data-slug-link="brackets">Brackets</a>
      <a data-slug-link="standings">Standings</a>
      <a data-slug-link="matches">Matches</a>
      <a data-slug-link="stats">Stats</a>
    </nav>
  `;

  const slug = new URLSearchParams(window.location.search).get("slug");

  // Update nav links dynamically
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    const page = link.getAttribute("data-slug-link");
    link.href = slug
      ? `${base}/pages/tournaments/${page}.html?slug=${encodeURIComponent(slug)}`
      : `${base}/pages/tournaments/${page}.html`;
  });

  // Highlight current page
  const currentPage = window.location.pathname.split("/").pop().replace(".html", "");
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-slug-link") === currentPage);
  });

  // Set logo links
  const tournamentLogo = document.getElementById("tournamentLogo");
  if (tournamentLogo) {
    tournamentLogo.href = slug
      ? `${base}/pages/tournaments/tournaments.html?slug=${encodeURIComponent(slug)}`
      : `${base}/pages/tournaments/tournaments.html`;
  }

  const homeLogo = document.getElementById("homeLogo");
  if (homeLogo) homeLogo.href = `${base}/index.html`;
}
