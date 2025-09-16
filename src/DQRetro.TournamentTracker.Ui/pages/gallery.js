let API_KEY = "";
let CHANNEL_ID = "";
let videos = [];

// Load config.json for API key & channel ID
async function loadConfig() {
  try {
    const res = await fetch("../config.json");
    const data = await res.json();
    API_KEY = data.YOUTUBE_API_KEY;
    CHANNEL_ID = data.CHANNEL_ID;
    await fetchVideos();
  } catch (err) {
    console.error("Failed to load config:", err);
  }
}

// Fetch videos from YouTube API
async function fetchVideos(pageToken = "") {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&pageToken=${pageToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.items) {
      data.items.forEach(item => {
        if (item.id.kind === "youtube#video") {
          const pubYear = new Date(item.snippet.publishedAt).getFullYear();
          videos.push({
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            year: pubYear
          });
        }
      });
    }

    // Handle pagination
    if (data.nextPageToken) {
      await fetchVideos(data.nextPageToken);
    } else {
      populateYearFilter();
      loadGallery();
    }
  } catch (err) {
    console.error("Failed to fetch videos:", err);
  }
}

// Populate year dropdown
function populateYearFilter() {
  const yearFilter = document.getElementById("yearFilter");
  const years = [...new Set(videos.map(v => v.year))].sort((a, b) => b - a);

  years.forEach(y => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearFilter.appendChild(option);
  });

  yearFilter.addEventListener("change", () => loadGallery(yearFilter.value));
}

// Load gallery
function loadGallery(year = "all") {
  const container = document.getElementById("gallery-grid");
  if (!container) return;

  container.innerHTML = "";

  const filtered = videos.filter(v => year === "all" || v.year === parseInt(year));

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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();
  loadConfig();
});
