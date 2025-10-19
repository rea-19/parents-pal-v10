// ==========================
// Helper functions
// ==========================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function generateFilterMatchItem(iconClass, value, defaultLabel) {
  const isCustomImage = iconClass.endsWith('.png') || iconClass.endsWith('.jpg') || iconClass.endsWith('.svg');
  const displayValue = value || defaultLabel;

  let pillText = displayValue;
  if (iconClass.includes('calendar') && displayValue) {
    const dateMatch = displayValue.match(/, (\d+ \w+)/);
    pillText = dateMatch ? dateMatch[1] : displayValue;
  }
  if (iconClass.includes('cost')) pillText = pillText.replace('N/A', 'Free');

  const iconHtml = isCustomImage
    ? `<img src="${iconClass}" class="custom-filter-icon" alt="Filter Icon">`
    : `<i class="fa-solid ${iconClass}"></i>`;

  return `
    <div class="filter-match-item">
      ${iconHtml}
      <span>${pillText}</span>
    </div>
  `;
}

// ==========================
// Main Page Load
// ==========================
$(document).ready(function () {
  const subject = getQueryParam("subject");
  const start = getQueryParam("start");
  const end = getQueryParam("end");

  if (!subject || !start || !end) {
    $("#event-details").html("<p>Missing event details.</p>");
    return;
  }

  const apiURLs = [
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records?limit=100",
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records?limit=100",
  ];

  Promise.all(apiURLs.map(url => fetch(url).then(res => res.json())))
    .then(datasets => {
      const allResults = datasets.flatMap(data => data.results);

      const record = allResults.find(r =>
        r.subject === subject &&
        r.start_datetime === start &&
        r.end_datetime === end
      );

      if (record) {
        let bookingUrl = null;
        if (record.booking) {
          const match = record.booking.match(/href=["']([^"']+)["']/);
          if (match && match[1]) bookingUrl = match[1];
        }

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

        // ---------------------------
        // Buttons Functionality
        // ---------------------------
        $("#book-now-btn").click(function () {
          const booked = JSON.parse(localStorage.getItem("bookedEvents") || "[]");
          const alreadySaved = booked.some(e => e.subject === record.subject && e.start_datetime === record.start_datetime);
          if (!alreadySaved) {
            booked.push(record);
            localStorage.setItem("bookedEvents", JSON.stringify(booked));
          }
          alert("There is no booking needed for this, but we saved it in your Booked Events for reference.");
        });

        $("#save-event-btn").click(function () {
          const favourites = JSON.parse(localStorage.getItem("favouriteEvents") || "[]");
          const alreadySaved = favourites.some(e => e.subject === record.subject && e.start_datetime === record.start_datetime);
          if (!alreadySaved) {
            favourites.push(record);
            localStorage.setItem("favouriteEvents", JSON.stringify(favourites));
          }
          alert("We saved it in your Saved Events, in your profile.");
        });

        $("#copy-address-btn").click(function () {
          navigator.clipboard.writeText(record.location || "Location not available").then(() => {
            alert("Address copied to clipboard!");
          }).catch(err => console.error("Copy failed:", err));
        });
      } else {
        $("#event-details").html("<p>Event not found.</p>");
      }
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      $("#event-details").html("<p>Error loading event details.</p>");
    });

  // ==========================
  // Review Popup + Points System
  // ==========================
  const popup = $("#reviewPopup");
  const writeBtn = $("#writeReviewBtn");
  const closeBtn = $(".close");
  const cancelBtn = $(".cancel-btn");
  const reviewerChoice = $("#reviewerChoice");
  const nameField = $("#nameField");

  // Show popup
  writeBtn.click(() => popup.fadeIn(200).css("display", "flex"));

  // Hide popup
  function closePopup() {
    popup.fadeOut(200);
    $("#reviewForm")[0].reset();
    nameField.hide();
  }
  closeBtn.click(closePopup);
  cancelBtn.click(closePopup);

  reviewerChoice.change(function () {
    if ($(this).val() === "named") nameField.slideDown(200);
    else nameField.slideUp(200);
  });

  // Points system setup
  const progress = document.querySelector(".progress-done");
  let userPoints = parseInt(localStorage.getItem("userPoints") || "0", 10);
  const goal = 50;

  function updateProgressBar() {
    if (!progress) return;
    const percentage = Math.min((userPoints / goal) * 100, 100);
    progress.style.width = `${percentage}%`;
  //  progress.innerText = `${userPoints}/${goal}`; ----> only adds the text under the button (eg 5/50
    localStorage.setItem("userPoints", userPoints);
  }

  function addPoints(points) {
    userPoints += points;
    updateProgressBar();
  }

  updateProgressBar();

  // Handle review submission
  $("#reviewForm").submit(function (e) {
    e.preventDefault();
    const choice = reviewerChoice.val();
    const name = choice === "named" ? $("#reviewerName").val() : "Anonymous";

    addPoints(5);
    updateHeaderProgress(5);
    alert(`Thank you, ${name}! You’ve earned 5 points for leaving a review.`);
    closePopup();
  });

  // ==========================
// 🔄 Update Global Progress Bar (Header Integration)
// ==========================
function updateHeaderProgress(pointsToAdd = 0) {
  // Only update if user is logged in
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  if (!loggedIn) return;

  // Load existing points or start from 0
  let userPoints = parseInt(localStorage.getItem("userPoints") || "0", 10);
  const goal = 50;

  // Add new points
  userPoints += pointsToAdd;
  localStorage.setItem("userPoints", userPoints);

  // Find the progress bar in the header
  const bar = document.querySelector("#signedin-progressbar .progress-done");
  if (bar) {
    const percentage = Math.min((userPoints / goal) * 100, 100);
    bar.style.width = `${percentage}%`;
    bar.innerText = `${userPoints}/${goal}`;
  }

  // (Optional) check if user reached the goal
  if (userPoints >= goal) {
    console.log("🎉 Goal reached! Consider triggering a reward popup here.");
  }
}
});
