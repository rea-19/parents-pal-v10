
let slideImages = []; // Array to hold the 7 dynamically loaded image URLs
let slideIndex = 0;
const MAX_IMAGES = 7;
const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 600;

/**
 * Fetches image URLs from Picsum.photos, limited to MAX_IMAGES.
 * Uses unique seeds to ensure different images.
 */
function fetchSlideImages() {
    // Using a simple placeholder image API (Picsum.photos) for demonstration.
    // Replace this with your actual image API endpoint if needed.
    for (let i = 0; i < MAX_IMAGES; i++) {
        // Generate a somewhat unique seed based on a large number + index
        const seed = 1200 + i; 
        const imageUrl = `https://picsum.photos/seed/${seed}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`;
        slideImages.push(imageUrl);
    }
}

/**
 * Initializes the slideshow by dynamically inserting <img> tags
 * and setting up the initial state.
 */
function initializeSlideshow() {
    fetchSlideImages(); // Populate the image array

    const slidesContainer = $('.slides'); // Assuming a container with class 'slides'

    if (slideImages.length === 0) {
        slidesContainer.html('<p>Error loading slideshow images.</p>');
        return;
    }

    // 1. Clear the static images from the HTML
    slidesContainer.empty();

    // 2. Dynamically create and insert <img> tags
    slideImages.forEach((url, index) => {
        const img = $('<img>')
            .addClass('slide')
            .attr('src', url)
            .attr('alt', `Slideshow Image #${index + 1}`);
        
        // Only the first image is visible initially
        if (index === 0) {
            img.addClass('displaySlide');
        }
        slidesContainer.append(img);
    });

    // Start auto-play
    startAutoSlideshow();
}

/**
 * Shows the current slide and updates the index.
 */
function showSlide() {
    const slides = $('.slide');
    
    // Ensure index wraps around
    if (slideIndex >= slides.length) {
        slideIndex = 0;
    }    
    if (slideIndex < 0) {
        slideIndex = slides.length - 1;
    }

    // Hide all slides
    slides.removeClass('displaySlide');
    
    // Show the current slide
    slides.eq(slideIndex).addClass('displaySlide');
}

/**
 * Advances to the next slide (used by the 'next' button onclick).
 * NOTE: This is a global function to work with inline HTML onclick.
 */
window.nextSlide = function() {
    slideIndex++;
    showSlide();
    // Reset auto-play timer on manual navigation
    resetAutoSlideshow();
}

/**
 * Goes back to the previous slide (used by the 'previous' button onclick).
 * NOTE: This is a global function to work with inline HTML onclick.
 */
window.previousSlide = function() {
    slideIndex--;
    showSlide();
    // Reset auto-play timer on manual navigation
    resetAutoSlideshow();
}


//Auto Slideshow Logic
let slideshowInterval;
const SLIDE_DURATION = 5000; // 5 seconds

function startAutoSlideshow() {
    clearInterval(slideshowInterval); // Clear any existing interval
    slideshowInterval = setInterval(function() {
        nextSlide();
    }, SLIDE_DURATION);
}

function resetAutoSlideshow() {
    clearInterval(slideshowInterval);
    startAutoSlideshow();
}


// Start the slideshow when the document is ready
$(document).ready(function() {
    initializeSlideshow();
    
    $('.slider').hover(
        function() { // mouseenter
            clearInterval(slideshowInterval);
        },
        function() { // mouseleave
            startAutoSlideshow();
        }
    );
});