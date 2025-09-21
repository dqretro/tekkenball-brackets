let videos = [];

// --------------------------
// Loading / Messages
// --------------------------
function showLoading(msg = "Loading videos...") {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

function showGalleryMessage(msg) {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

// --------------------------
// Fetch videos from Harry's database
// --------------------------
async function fetchVideosFromDB() {
  try {
    showLoading();

    const proxyUrl = "https://corsproxy.io/?";
    const targetUrl = "https://therollingbuffoons.zapto.org/tournamenttracker/video";
    const res = await fetch(proxyUrl + encodeURIComponent(targetUrl));

    console.log("Fetch response status:", res.status, res.statusText);

    const text = await res.text();
    console.log("Raw response text:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      showGalleryMessage("Failed to parse JSON from the database.");
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      showGalleryMessage("No videos found in the database.");
      return;
    }

    // Map the correct keys
    videos = data.map(item => ({
      youtubeId: item.you_tube_video_id || "",
      title: item.title || "Untitled",
      year: item.release_date ? new Date(item.release_date).getFullYear() : "Unknown",
      thumbnail: item.you_tube_thumbnail_url || "",
      url: item.you_tube_video_url || ""
    })).filter(v => v.youtubeId);

    console.log("Videos loaded:", videos);

    populateYearFilter();
    loadGallery();
  } catch (err) {
    console.error("Failed to fetch videos:", err);
    showGalleryMessage("Failed to fetch videos from the database.");
  }
}


// --------------------------
// Populate Year Dropdown
// --------------------------
function populateYearFilter() {
  const yearFilter = document.getElementById("yearFilter");
  if (!yearFilter) return;

  const years = [...new Set(videos.map(v => v.year))].sort((a, b) => b - a);

  yearFilter.innerHTML = "<option value='all'>All Years</option>";
  years.forEach(y => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearFilter.appendChild(option);
  });

  yearFilter.addEventListener("change", () => loadGallery(yearFilter.value));
}

// --------------------------
// Load Gallery
// --------------------------
function loadGallery(year = "all") {
  const container = document.getElementById("gallery-grid");
  if (!container) return;

  container.innerHTML = "";

  const filtered = videos.filter(v => year === "all" || v.year === parseInt(year));

  if (filtered.length === 0) {
    showGalleryMessage("No videos available for the selected year.");
    return;
  }

  filtered.forEach(video => {
    const div = document.createElement("div");
    div.className = "gallery-item";

    const thumb = document.createElement("img");
    thumb.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
    thumb.alt = video.title;

    const link = document.createElement("a");
    link.href = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    link.target = "_blank";
    link.appendChild(thumb);

    div.appendChild(link);
    container.appendChild(div);
  });
}

// --------------------------
// Initialize
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();
  fetchVideosFromDB();
});
