async function loadNav() {
  const placeholder = document.getElementById("nav-t-placeholder");
  if (!placeholder) return;

  // Base path
  const base = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

  // Insert nav HTML with dummy hrefs
  placeholder.innerHTML = `
    <nav>
      <a href="${base}/index.html" class="nav-logo" id="homeLogo">
        <img src="${base}/images/dqretro/logos/dqretro_logo_purpleyblue.png" alt="DQRetro Logo" height="50">
      </a>
      <a href="${base}/pages/tournaments/tournaments.html" class="nav-logo" id="tournamentLogo">
        <img src="${base}/images/dqretro/logos/tournament_logo.png" alt="Tournament Logo" height="50">
      </a>

      <a data-slug-link="overview" href="#">Overview</a>
      <a data-slug-link="brackets" href="#">Brackets</a>
      <a data-slug-link="standings" href="#">Standings</a>
      <a data-slug-link="matches" href="#">Matches</a>
      <a data-slug-link="stats" href="#">Stats</a>
    </nav>
  `;

  const slug = new URLSearchParams(window.location.search).get("slug");

  // Update nav links dynamically
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    const page = link.getAttribute("data-slug-link");
    link.setAttribute(
      "href",
      slug
        ? `${base}/pages/tournaments/${page}.html?slug=${encodeURIComponent(slug)}`
        : `${base}/pages/tournaments/${page}.html`
    );
  });

  // Highlight current page
  const currentPage = window.location.pathname.split("/").pop().replace(".html", "");
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-slug-link") === currentPage);
  });
}
