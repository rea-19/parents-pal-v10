let slideImages = [];
let slideIndex = 0;
const MAX_IMAGES = 100;
const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 600;

const DATASETS = [
  "infants-and-toddlers-events",
  "library-events"
];

/**
 * Fetch images from a single dataset
 */
async function fetchImagesFromDataset(dataset) {
  let page = 1;
  let hasMore = true;
  const datasetImages = [];

  while (datasetImages.length < MAX_IMAGES && hasMore) {
    const API_URL = `https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/${dataset}/records?limit=50&offset=${(page - 1) * 50}&order_by=-start_datetime`;

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data && data.results && data.results.length > 0) {
        let addedCount = 0;
        data.results.forEach(record => {
          let imageUrl = null;

          // Try multiple fields to get the image
          if (record.eventimage && record.eventimage.url) imageUrl = record.eventimage.url;
          else if (typeof record.eventimage === "string") imageUrl = record.eventimage;
          else if (record.libraryeventimage && typeof record.libraryeventimage === "string") imageUrl = record.libraryeventimage;
          else if (record.media && Array.isArray(record.media) && record.media.length > 0) {
            const mediaImg = record.media.find(m => m.url && m.url.match(/\.(jpg|jpeg|png|gif)$/i));
            if (mediaImg) imageUrl = mediaImg.url;
          }

          if (imageUrl) {
            datasetImages.push(imageUrl);
            addedCount++;
          }
        });

        if (addedCount === 0) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching ${dataset} page ${page}:`, error);
      hasMore = false;
    }
  }

  return datasetImages;
}

/**
 * Fetch all images from all datasets
 */
async function fetchSlideImages() {
  slideImages = [];

  for (const dataset of DATASETS) {
    const images = await fetchImagesFromDataset(dataset);
    slideImages.push(...images);
  }

  if (slideImages.length === 0) usePlaceholderImages();

  console.log(`✅ Loaded ${slideImages.length} total images`);
}

/**
 * Fallback if API fails completely
 */
function usePlaceholderImages() {
  for (let i = 0; i < 10; i++) {
    slideImages.push(`https://picsum.photos/seed/${3000 + i}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`);
  }
}

/* ---------- Slideshow logic ---------- */
async function initializeSlideshow() {
  await fetchSlideImages();

  const slidesContainer = $(".slides");
  slidesContainer.empty();

  if (slideImages.length === 0) {
    slidesContainer.html("<p>Error loading slideshow images.</p>");
    return;
  }

  slideImages.forEach((url, index) => {
    const img = $("<img>").addClass("slide").attr("src", url).attr("alt", `Event Image #${index + 1}`);
    if (index === 0) img.addClass("displaySlide");
    slidesContainer.append(img);
  });

  startAutoSlideshow();
}

function showSlide() {
  const slides = $(".slide");
  if (slideIndex >= slides.length) slideIndex = 0;
  if (slideIndex < 0) slideIndex = slides.length - 1;
  slides.removeClass("displaySlide");
  slides.eq(slideIndex).addClass("displaySlide");
}

window.nextSlide = function () { slideIndex++; showSlide(); resetAutoSlideshow(); };
window.previousSlide = function () { slideIndex--; showSlide(); resetAutoSlideshow(); };

let slideshowInterval;
const SLIDE_DURATION = 5000;

function startAutoSlideshow() {
  clearInterval(slideshowInterval);
  slideshowInterval = setInterval(() => { slideIndex = (slideIndex + 1) % slideImages.length; showSlide(); }, SLIDE_DURATION);
}

function resetAutoSlideshow() {
  clearInterval(slideshowInterval);
  startAutoSlideshow();
}

$(document).ready(() => {
  initializeSlideshow();
  $(".slider").hover(
    () => clearInterval(slideshowInterval),
    () => startAutoSlideshow()
  );
});
