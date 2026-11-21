// Assets pages: renders images and colours listed in assets.json.
// Paths in assets.json are site-root paths ("/images/..."); withBase() from
// script.js adds the /tekkenball-brackets prefix on GitHub Pages.

async function loadAssetsData() {
  const res = await fetch(withBase("pages/assets/assets.json"));
  if (!res.ok) throw new Error(`assets.json: HTTP ${res.status}`);
  return res.json();
}

function displayAssets(containerId, assets) {
  const container = document.getElementById(containerId);
  if (!container || !Array.isArray(assets)) return;
  for (const src of new Set(assets)) {
    const url = withBase(src);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    const img = document.createElement("img");
    img.src = url;
    img.alt = src.split("/").pop().replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ");
    img.title = src.split("/").pop();
    img.loading = "lazy";
    link.appendChild(img);
    container.appendChild(link);
  }
}

function displayColors(containerId, colors) {
  const container = document.getElementById(containerId);
  if (!container || !Array.isArray(colors)) return;
  for (const color of colors) {
    const box = document.createElement("div");
    box.className = "color-box";
    box.style.backgroundColor = color.hex;
    const name = document.createElement("strong");
    name.textContent = color.name;
    box.append(name, document.createElement("br"), color.hex);
    container.appendChild(box);
  }
}

function displayPreview(containerId, assets, count = 4) {
  const container = document.getElementById(containerId);
  if (!container || !Array.isArray(assets)) return;
  for (const src of [...new Set(assets)].slice(0, count)) {
    const img = document.createElement("img");
    img.src = withBase(src);
    img.alt = "";
    container.appendChild(img);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadAssetsData();
    // Every section in assets.json renders into the element with the same id, if the page has one.
    for (const [key, value] of Object.entries(data)) {
      if (key === "colors") displayColors("color-codes", value);
      else displayAssets(key, value);
    }
    // Landing page previews
    displayPreview("preview-dqretro", [...(data.logos || []), ...(data.icons || [])]);
    displayPreview("preview-games", data["game-boxart"]);
  } catch (err) {
    console.error("Error loading assets:", err);
  }
});
