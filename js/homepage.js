let slideImages = [];
let slideIndex = 0;
const MAX_IMAGES = 100;
const SLIDE_DURATION = 5000;

const apiURLs = [
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records?limit=50",
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records?limit=50"
];

async function fetchSlideImages() {
    slideImages = [];

    for (const url of apiURLs) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.results) {
                data.results.forEach(event => {
                    if (event.eventimage) {
                        slideImages.push(event.eventimage);
                    }
                });
            }
        } catch (err) {
            console.error("Error fetching slideshow images:", err);
        }
    }

    if (slideImages.length === 0) {
        // Fallback
        for (let i = 0; i < 10; i++) {
            slideImages.push(`https://picsum.photos/seed/${3000 + i}/1920/600`);
        }
    }

    initializeSlideshow();
}

function initializeSlideshow() {
    const slidesContainer = $(".slides");
    slidesContainer.empty();

    slideImages.forEach((url, i) => {
        const img = $("<img>").addClass("slide").attr("src", url).attr("alt", `Event #${i + 1}`);
        if (i === 0) img.addClass("displaySlide");
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

window.nextSlide = () => { slideIndex++; showSlide(); resetAutoSlideshow(); };
window.previousSlide = () => { slideIndex--; showSlide(); resetAutoSlideshow(); };

let slideshowInterval;

function startAutoSlideshow() {
    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(() => {
        slideIndex = (slideIndex + 1) % slideImages.length;
        showSlide();
    }, SLIDE_DURATION);
}

function resetAutoSlideshow() {
    clearInterval(slideshowInterval);
    startAutoSlideshow();
}

$(document).ready(() => {
    fetchSlideImages();

    $(".slider").hover(
        () => clearInterval(slideshowInterval),
        () => startAutoSlideshow()
    );
});
