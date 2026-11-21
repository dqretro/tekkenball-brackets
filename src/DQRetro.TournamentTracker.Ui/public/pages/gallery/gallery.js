// --------------------------
// Global Variables
// --------------------------
let videos = [];
let photos = [];
let banners = [];
let currentVideoPage = 1;
let currentPhotoPage = 1;
const itemsPerPage = 8;

let currentBannerIndex = 0;
let bannerInterval;

// --------------------------
// Loading / Messages
// --------------------------
function showLoading(containerId, msg = "Loading...") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

function showGalleryMessage(containerId, msg) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p class="gallery-message">${msg}</p>`;
}

// --------------------------
// Fetch Videos (YouTube API v3)
// --------------------------
async function fetchVideos() {
  try {
    showLoading("gallery-grid", "Loading videos from YouTube...");

    // 1. Fetch credentials from config.json
    const configRes = await fetch("config.json");
    if (!configRes.ok) throw new Error("Could not load config.json");
    const config = await configRes.json();

    // 2. Fetch the Uploads Playlist ID dynamically from the Channels API endpoint
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${config.CHANNEL_ID}&key=${config.YOUTUBE_API_KEY}`;
    const channelRes = await fetch(channelUrl);
    if (!channelRes.ok) {
      const errData = await channelRes.json();
      throw new Error(errData.error?.message || `Channels API returned status ${channelRes.status}`);
    }

    const channelData = await channelRes.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("YouTube Channel not found. Check CHANNEL_ID in config.json.");
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // 3. Query playlistItems endpoint using the retrieved uploads playlist ID
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${config.YOUTUBE_API_KEY}`;
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) {
      const errData = await playlistRes.json();
      throw new Error(errData.error?.message || `PlaylistItems API returned status ${playlistRes.status}`);
    }

    const data = await playlistRes.json();
    const items = data.items || [];

    if (items.length === 0) {
      showGalleryMessage("gallery-grid", "No videos found.");
      return;
    }

    // 4. Map YouTube items to internal video data format
    videos = items
      .map(item => {
        const snippet = item.snippet || {};
        const youtubeId = snippet.resourceId?.videoId || "";
        const title = snippet.title || "Untitled";
        const publishedAt = snippet.publishedAt || "";
        const year = publishedAt ? new Date(publishedAt).getFullYear() : "Unknown";

        return { youtubeId, title, year };
      })
      .filter(v => v.youtubeId && v.title !== "Private video" && v.title !== "Deleted video");

    populateVideoYearFilter();
    loadVideos();
  } catch (err) {
    console.error("Error fetching YouTube videos:", err);
    showGalleryMessage("gallery-grid", "Failed to fetch videos from YouTube.");
  }
}

// --------------------------
// Fetch Photos + Banners (local JSON)
// --------------------------
async function fetchPhotos() {
  try {
    showLoading("photo-gallery-grid", "Loading photos...");
    const res = await fetch("gallery-photos.json");
    const data = await res.json();

    banners = Array.isArray(data.banners) ? data.banners : [];
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];

    if (gallery.length === 0) {
      showGalleryMessage("photo-gallery-grid", "No photos found.");
      return;
    }

    photos = gallery.map(item => ({
      url: item.url || "",
      title: item.title || "Untitled",
      year: item.year || "Unknown",
      alt: item.alt || item.title || "Photo"
    })).filter(p => p.url);

    if (banners.length > 0) initBannerSlider();

    populatePhotoYearFilter();
    loadPhotos();
  } catch (err) {
    console.error("Error fetching photos:", err);
    showGalleryMessage("photo-gallery-grid", "Failed to fetch photos.");
  }
}

// --------------------------
// Populate Year Filters
// --------------------------
function populateVideoYearFilter() {
  const yearFilter = document.getElementById("yearFilter");
  if (!yearFilter) return;
  const years = [...new Set(videos.map(v => v.year))].sort((a, b) => b - a);
  yearFilter.innerHTML = "<option value='all'>All Years</option>";
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearFilter.appendChild(opt);
  });
  yearFilter.addEventListener("change", () => {
    currentVideoPage = 1;
    loadVideos(yearFilter.value, currentVideoPage);
  });
}

function populatePhotoYearFilter() {
  const yearFilter = document.getElementById("photoYearFilter");
  if (!yearFilter) return;
  const years = [...new Set(photos.map(p => p.year))].sort((a, b) => b - a);
  yearFilter.innerHTML = "<option value='all'>All Years</option>";
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearFilter.appendChild(opt);
  });
  yearFilter.addEventListener("change", () => {
    currentPhotoPage = 1;
    loadPhotos(yearFilter.value, currentPhotoPage);
  });
}

// --------------------------
// Banner Slider
// --------------------------
function initBannerSlider() {
  const slider = document.getElementById("banner-slider");
  if (!slider) return;
  slider.innerHTML = "";

  banners.forEach((banner, index) => {
    const slide = document.createElement("div");
    slide.className = "banner-slide";
    const link = document.createElement("a");
    link.href = banner.link || "#";
    link.target = "_blank";
    const img = document.createElement("img");
    img.src = banner.url;
    img.alt = banner.alt || banner.title || `Banner ${index + 1}`;
    link.appendChild(img);
    slide.appendChild(link);
    slider.appendChild(slide);
  });

  updateBannerSlider();

  const prevBtn = document.getElementById("prev-banner");
  const nextBtn = document.getElementById("next-banner");
  if (prevBtn) prevBtn.onclick = () => changeBanner(-1);
  if (nextBtn) nextBtn.onclick = () => changeBanner(1);

  if (bannerInterval) clearInterval(bannerInterval);
  bannerInterval = setInterval(() => changeBanner(1), 5000);
}

function updateBannerSlider() {
  const slider = document.getElementById("banner-slider");
  if (slider) {
    slider.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
  }
}

function changeBanner(direction) {
  if (!banners.length) return;
  currentBannerIndex = (currentBannerIndex + direction + banners.length) % banners.length;
  updateBannerSlider();
}

// --------------------------
// Load Videos
// --------------------------
function loadVideos(year = "all", page = currentVideoPage) {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  container.innerHTML = "";

  const filtered = videos.filter(v => year === "all" || v.year === parseInt(year));
  if (filtered.length === 0) {
    showGalleryMessage("gallery-grid", "No videos available.");
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

  paginated.forEach(video => {
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

  renderPagination(filtered.length, page, "video");
}

// --------------------------
// Load Photos
// --------------------------
function loadPhotos(year = "all", page = currentPhotoPage) {
  const container = document.getElementById("photo-gallery-grid");
  if (!container) return;
  container.innerHTML = "";

  const filtered = photos.filter(p => year === "all" || p.year === parseInt(year));
  if (filtered.length === 0) {
    showGalleryMessage("photo-gallery-grid", "No photos available.");
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

  paginated.forEach(photo => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.title;
    div.appendChild(img);
    container.appendChild(div);
  });

  renderPagination(filtered.length, page, "photo");
}

// --------------------------
// Pagination Controls
// --------------------------
function renderPagination(totalItems, page, type) {
  const pagination = type === "video" ? document.getElementById("pagination") : document.getElementById("photo-pagination");
  if (!pagination) return;

  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === page ? "active-page" : "";
    btn.addEventListener("click", () => {
      if (type === "video") {
        currentVideoPage = i;
        loadVideos(undefined, i);
      } else {
        currentPhotoPage = i;
        loadPhotos(undefined, i);
      }
    });
    pagination.appendChild(btn);
  }
}

// --------------------------
// Tabs Switching
// --------------------------
function initGalleryTabs() {
  const videosTab = document.getElementById("videos-tab");
  const photosTab = document.getElementById("photos-tab");
  const videoGrid = document.getElementById("gallery-grid");
  const photoGrid = document.getElementById("photo-gallery-grid");
  const videoFilter = document.getElementById("video-filter-container");
  const photoFilter = document.getElementById("photo-filter-container");
  const videoPagination = document.getElementById("pagination");
  const photoPagination = document.getElementById("photo-pagination");

  if (!videosTab || !photosTab) return;

  videosTab.addEventListener("click", () => {
    videosTab.classList.add("active-tab");
    photosTab.classList.remove("active-tab");
    if (videoGrid) videoGrid.style.display = "grid";
    if (videoFilter) videoFilter.style.display = "block";
    if (videoPagination) videoPagination.style.display = "flex";
    if (photoGrid) photoGrid.style.display = "none";
    if (photoFilter) photoFilter.style.display = "none";
    if (photoPagination) photoPagination.style.display = "none";
  });

  photosTab.addEventListener("click", () => {
    photosTab.classList.add("active-tab");
    videosTab.classList.remove("active-tab");
    if (photoGrid) photoGrid.style.display = "grid";
    if (photoFilter) photoFilter.style.display = "block";
    if (photoPagination) photoPagination.style.display = "flex";
    if (videoGrid) videoGrid.style.display = "none";
    if (videoFilter) videoFilter.style.display = "none";
    if (videoPagination) videoPagination.style.display = "none";
  });
}

// --------------------------
// Initialize
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadNav === "function") loadNav();
  if (typeof loadFooter === "function") loadFooter();
  initGalleryTabs();
  fetchVideos();
  fetchPhotos();
});