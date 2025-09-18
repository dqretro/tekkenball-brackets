let API_KEY = "";
let CHANNEL_ID = "";
let videos = [];

// Show loading indicator
function showLoading(msg = "Loading videos...") {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

// Show a message in the gallery grid
function showGalleryMessage(msg) {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

// Load config.json for API key & channel ID
async function loadConfig() {
  try {
    showLoading(); // show loading while config loads
    const res = await fetch("config.json"); // ensure path is correct
    if (!res.ok) throw new Error(`Failed to fetch config.json: ${res.status}`);
    
    const data = await res.json();
    API_KEY = data.YOUTUBE_API_KEY;
    CHANNEL_ID = data.CHANNEL_ID;

    if (!API_KEY || !CHANNEL_ID) {
      showGalleryMessage("API key or Channel ID missing in config.json");
      return;
    }

    await fetchVideos();
  } catch (err) {
    console.error("Failed to load config:", err);
    showGalleryMessage("Failed to load configuration.");
  }
}

// Fetch videos from YouTube API
async function fetchVideos(pageToken = "") {
  try {
    showLoading(); // show loading while fetching videos

    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&pageToken=${pageToken}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      if (videos.length === 0) showGalleryMessage("No videos found for this channel.");
      return;
    }

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

    // Handle pagination
    if (data.nextPageToken) {
      await fetchVideos(data.nextPageToken);
    } else {
      populateYearFilter();
      loadGallery();
    }
  } catch (err) {
    console.error("Failed to fetch videos:", err);
    showGalleryMessage("Failed to fetch videos from YouTube.");
  }
}

// Populate year dropdown
function populateYearFilter() {
  const yearFilter = document.getElementById("yearFilter");
  if (!yearFilter) return;

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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();
  loadConfig();
});
