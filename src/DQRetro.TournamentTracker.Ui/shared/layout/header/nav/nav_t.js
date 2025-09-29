async function loadNav() {
  const placeholder = document.getElementById("nav-t-placeholder");
  if (!placeholder) return;

  placeholder.innerHTML = `
    <nav>
      <a href="/index.html" class="nav-logo" id="homeLogo">
        <img src="/images/dqretro/logos/dqretro_logo_purpleyblue.png" alt="DQRetro Logo" height="50">
      </a>
      <a href="/pages/tournaments/tournaments.html" class="nav-logo" id="tournamentLogo">
        <img src="/images/dqretro/logos/tournament_logo.png" alt="Tournament Logo" height="50">
      </a>

      <a data-slug-link="overview">Overview</a>
      <a data-slug-link="brackets">Brackets</a>
      <a data-slug-link="standings">Standings</a>
      <a data-slug-link="matches">Matches</a>
      <a data-slug-link="stats">Stats</a>
    </nav>
  `;

  const slug = new URLSearchParams(window.location.search).get("slug");

  document.querySelectorAll("[data-slug-link]").forEach(link => {
    const page = link.getAttribute("data-slug-link");
    link.href = slug
      ? `/pages/tournaments/${page}.html?slug=${encodeURIComponent(slug)}`
      : `/pages/tournaments/${page}.html`;
  });

  const currentPage = window.location.pathname.split("/").pop().replace(".html", "");
  document.querySelectorAll("[data-slug-link]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-slug-link") === currentPage);
  });

  const tournamentLogo = document.getElementById("tournamentLogo");
  if (tournamentLogo && slug) {
    tournamentLogo.href = `/pages/tournaments/tournaments.html?slug=${encodeURIComponent(slug)}`;
  }

  const homeLogo = document.getElementById("homeLogo");
  if (homeLogo) homeLogo.href = `/index.html`;
}
