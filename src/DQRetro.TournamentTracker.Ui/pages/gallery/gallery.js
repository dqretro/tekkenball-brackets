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
// Fetch Videos
// --------------------------
async function fetchVideos() {
  try {
    showLoading("gallery-grid", "Loading videos...");
    const res = await fetch("https://therollingbuffoons.zapto.org/tournamenttracker/videos");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      showGalleryMessage("gallery-grid", "No videos found in the database.");
      return;
    }
    videos = data.map(item => ({
      youtubeId: item.you_tube_video_id || "",
      title: item.title || "Untitled",
      year: item.release_date ? new Date(item.release_date).getFullYear() : "Unknown",
      thumbnail: item.you_tube_thumbnail_url || "",
      url: item.you_tube_video_url || ""
    })).filter(v => v.youtubeId);
    populateVideoYearFilter();
    loadVideos();
  } catch (err) {
    console.error(err);
    showGalleryMessage("gallery-grid", "Failed to fetch videos.");
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
    console.error(err);
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
  slider.innerHTML = "";

  banners.forEach((banner, index) => {
    const slide = document.createElement("div");
    slide.className = "banner-slide";
    const link = document.createElement("a");
    link.href = banner.link || "#";
    link.target = "_blank";
    const img = document.createElement("img");
    img.src = banner.url;
    img.alt = banner.alt || banner.title || `Banner ${index+1}`;
    link.appendChild(img);
    slide.appendChild(link);
    slider.appendChild(slide);
  });

  updateBannerSlider();

  document.getElementById("prev-banner").addEventListener("click", () => changeBanner(-1));
  document.getElementById("next-banner").addEventListener("click", () => changeBanner(1));

  // auto rotate every 5s
  bannerInterval = setInterval(() => changeBanner(1), 5000);
}

function updateBannerSlider() {
  const slider = document.getElementById("banner-slider");
  slider.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
}

function changeBanner(direction) {
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

  videosTab.addEventListener("click", () => {
    videosTab.classList.add("active-tab");
    photosTab.classList.remove("active-tab");
    videoGrid.style.display = "grid";
    videoFilter.style.display = "block";
    videoPagination.style.display = "flex";
    photoGrid.style.display = "none";
    photoFilter.style.display = "none";
    photoPagination.style.display = "none";
  });

  photosTab.addEventListener("click", () => {
    photosTab.classList.add("active-tab");
    videosTab.classList.remove("active-tab");
    photoGrid.style.display = "grid";
    photoFilter.style.display = "block";
    photoPagination.style.display = "flex";
    videoGrid.style.display = "none";
    videoFilter.style.display = "none";
    videoPagination.style.display = "none";
  });
}

// --------------------------
// Initialize
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();
  initGalleryTabs();
  fetchVideos();
  fetchPhotos();
});
