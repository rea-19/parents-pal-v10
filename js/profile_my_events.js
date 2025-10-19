$(document).ready(function() {
    const bookedEvents = JSON.parse(localStorage.getItem("bookedEvents") || "[]");
    const favouriteEvents = JSON.parse(localStorage.getItem("favouriteEvents") || "[]");

    const bookedContainer = $("#booked-events");
    const favouriteContainer = $("#favourite-events");

    function createEventCard(event, type) {
        const card = $(`
            <div class="event-card">
                <div class="image-container">
                    <img src="${event.eventimage || 'https://source.unsplash.com/featured/?event,library'}" 
                         alt="${event.subject}" class="event-image">
                    <div class="overlay"></div>
                    <div class="title">${event.subject}</div>
                    <div class="info">
                        <p><strong>Date:</strong> ${event.formatteddatetime || "N/A"}</p>
                        <p><strong>Location:</strong> ${event.location || "N/A"}</p>
                        <div class="card-buttons">
                            <button class="view-details-btn">View Details</button>
                            <button class="remove-btn">Not Interested Anymore</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // View Details
        card.find(".view-details-btn").click(function() {
            const url = `event_details.html?subject=${encodeURIComponent(event.subject)}&start=${encodeURIComponent(event.start_datetime)}&end=${encodeURIComponent(event.end_datetime)}`;
            window.location.href = url;
        });

        // Remove / Not Interested
        card.find(".remove-btn").click(function() {
            if (confirm(`This will remove this event from your list. Are you sure you want to remove "${event.subject}"?`)) {
                let storageArray = JSON.parse(localStorage.getItem(type) || "[]");
                storageArray = storageArray.filter(e => !(e.subject === event.subject && e.start_datetime === event.start_datetime));
                localStorage.setItem(type, JSON.stringify(storageArray));
                card.remove();
            }
        });

        return card;
    }

    if (bookedEvents.length === 0) {
        bookedContainer.append("<p>No booked events yet.</p>");
    } else {
        bookedEvents.forEach(event => bookedContainer.append(createEventCard(event, "bookedEvents")));
    }

    if (favouriteEvents.length === 0) {
        favouriteContainer.append("<p>No favourite events yet.</p>");
    } else {
        favouriteEvents.forEach(event => favouriteContainer.append(createEventCard(event, "favouriteEvents")));
    }
});
