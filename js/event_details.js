function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Helper function to generate filter match items with icons and correct labels
function generateFilterMatchItem(iconClass, value, defaultLabel) {
    // Check if the iconClass is a file path (simple check for image extensions)
    const isCustomImage = iconClass.endsWith('.png') || iconClass.endsWith('.jpg') || iconClass.endsWith('.svg');

    // Use the actual value if available, otherwise use a placeholder text based on the default
    const displayValue = value || defaultLabel;
    
    // Quick and dirty way to get the short date for the pill from the full datetime string
    let pillText = displayValue;
    if (iconClass.includes('calendar') && displayValue) {
        // Assuming formatteddatetime is something like "Thursday, 13 October 2025, 9:00 AM"
        const dateMatch = displayValue.match(/, (\d+ \w+)/);
        pillText = dateMatch ? dateMatch[1] : displayValue;
    }
    
    // Custom logic to match the image's pill content
    if (iconClass.includes('cost')) pillText = pillText.replace('N/A', 'Free');

    // ----------------------------------------------------
    // *** CORE CHANGE IS HERE ***
    // ----------------------------------------------------
    let iconHtml;

    if (isCustomImage) {
        // Renders an IMG tag for custom files
        iconHtml = `<img src="${iconClass}" class="custom-filter-icon" alt="Filter Icon">`;
    } else {
        // Renders the standard I tag for Font Awesome classes (fa-...)
        iconHtml = `<i class="fa-solid ${iconClass}"></i>`;
    }

    return `
        <div class="filter-match-item">
            ${iconHtml}
            <span>${pillText}</span>
        </div>
    `;
}

$(document).ready(function() {
    const subject = getQueryParam("subject");
    const start = getQueryParam("start");
    const end = getQueryParam("end");

    if (!subject || !start || !end) {
        $("#event-details").html("<p>Missing event details.</p>");
        return;
    }

    const apiURLs = [
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records?limit=100",
        "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records?limit=100"
    ];

    Promise.all(apiURLs.map(url => fetch(url).then(res => res.json())))
        .then(datasets => {
            // Merge results from both datasets
            const allResults = datasets.flatMap(data => data.results);

            // Try to find the event that matches subject, start, end
            const record = allResults.find(r =>
                r.subject === subject &&
                r.start_datetime === start &&
                r.end_datetime === end
            );

            if (record) {
                // Get the booking URL if it exists (reusing your original logic)
                let bookingUrl = null;
                if (record.booking) {
                    const match = record.booking.match(/href=["']([^"']+)["']/);
                    if (match && match[1]) {
                        bookingUrl = match[1];
                    }
                }
                
                // The Elfsight reviews widget is still included in the main HTML 
                // using the div with class "reviews", so the dynamic review box 
                // that was previously hardcoded is now removed as requested.

        $("#event-details").html(`
            <div class="page-content-wrapper">
                
                <div class="event-image-header" style="background-image: url('${record.eventimage || "https://source.unsplash.com/featured/?event,library"}');">
                    <div class="header-overlay">
                        <h2 class="event-heading">${record.subject}</h2>
                    </div>
                </div>

                <div class="content-row-container">
                    
                    <div class="main-event-content">
                        <div class="about-event-box">
                            <h3 class="about-the-event-title">About the event</h3>
                            <p class="event-description">${record.description || "No description for this event."}</p>
                        </div>
                        
                        <div class="event-actions-bar">
                            <button class="action-button primary" id="book-now-btn">
                                <i class="fa-solid fa-book-open"></i> Book Now 
                            </button>
                            <button class="action-button secondary" id="save-event-btn">
                                <i class="fa-solid fa-bookmark"></i> Save Event 
                            </button>
                            <button class="action-button tertiary" id="copy-address-btn">
                                <i class="fa-solid fa-copy"></i> Copy Address 
                            </button>
                        </div>
                    </div>

                    <div class="filter-matches-panel">
                        <h4>Filter matches</h4>
                        <div class="filter-match-list">
                            ${generateFilterMatchItem('/src/location.png', record.location, 'Chermside Library')}
                            ${generateFilterMatchItem('/src/activity.png', record.primaryeventtype, 'Creative')}
                            ${generateFilterMatchItem('/src/calendar.png', record.formatteddatetime, '13 October')}
                            ${generateFilterMatchItem('/src/age.png', record.age, '3 - 5 years')}
                            ${generateFilterMatchItem('/src/cost.png', record.cost, 'Free')}
                        </div>
                    </div>
                </div>
                
            </div>
        `);

                // ------------------ BUTTON FUNCTIONALITY ------------------

                // Book Now button functionality
                $("#book-now-btn").click(function() {
                    // Instead of sending people to bookingUrl, we auto-save it in Booked Events
                    const booked = JSON.parse(localStorage.getItem("bookedEvents") || "[]");

                    // Prevent duplicates
                    const alreadySaved = booked.some(e => e.subject === record.subject && e.start_datetime === record.start_datetime);
                    if (!alreadySaved) {
                        booked.push(record);
                        localStorage.setItem("bookedEvents", JSON.stringify(booked));
                    }

                    alert("There is no booking needed for this, but we saved it in your Booked Events for reference.");
                });

                // Save Event button functionality
                $("#save-event-btn").click(function() {
                    const favourites = JSON.parse(localStorage.getItem("favouriteEvents") || "[]");

                    // Prevent duplicates
                    const alreadySaved = favourites.some(e => e.subject === record.subject && e.start_datetime === record.start_datetime);
                    if (!alreadySaved) {
                        favourites.push(record);
                        localStorage.setItem("favouriteEvents", JSON.stringify(favourites));
                    }

                    alert("We saved it in your Saved Events, in your profile.");
                });

                // Copy Address
                $("#copy-address-btn").click(function() {
                    navigator.clipboard.writeText(record.location || "Location not available").then(() => {
                        alert("Address copied to clipboard!");
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                    });
                });
                
                // Original legacy buttons mapping to the new ones
                $("#save-booked").click(function() {
                    $("#save-event-btn").click();
                });
                $("#save-favourite").click(function() {
                    $("#save-event-btn").click(); 
                });

            } else {
                $("#event-details").html("<p>Event not found.</p>");
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            $("#event-details").html("<p>Error loading event details.</p>");
        });
});