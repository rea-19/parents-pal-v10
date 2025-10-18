const map = L.map("map").setView([-27.5, 153.0], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: 'Map data © OpenStreetMap',
  maxZoom: 18
}).addTo(map);

const allMarkers = {
  events: [],
  markets: [],
  parks: [],
  toilet: []
};

const iconEvents = L.icon({ iconUrl: "/src/events.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconMarkets = L.icon({ iconUrl: "/src/markets.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconParks = L.icon({ iconUrl: "/src/parks.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconToilet = L.icon({ iconUrl: "/src/toilets.png", iconSize: [32, 32], iconAnchor: [16, 32] });

function geocodeAddress(address) {
  return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
    .then(res => res.json())
    .then(results => results.length ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) } : null);
}

function focusOnSuburb(suburbName) {
  if (!suburbName) return;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(suburbName + ", Brisbane, Australia")}`)
    .then(res => res.json())
    .then(results => {
      if (results.length > 0) {
        map.setView([parseFloat(results[0].lat), parseFloat(results[0].lon)], 14);
      }
    });
}

function processEventRecords(records) {
  const geocodePromises = records.map(record => {
    const name = record.subject || record.subject || "Event";
    const address = record.venueaddress || record.venueaddress || "";
    const suburb = (address || "").toLowerCase();
    const date = record.formatteddatetime || record.date || "TBA";
    const description = record.description || record.description || "No description available";
    const cost = record.cost || record.cost || "$$$";

    if (!address) return Promise.resolve();

    return geocodeAddress(address).then(coords => {
      if (!coords) return;

      const popupHTML = `
        <div class="popup-card">
          <div class="popup-header">
            <span class="popup-title">${name}</span>
            <span class="popup-price">${cost}</span>
          </div>
          <div class="popup-meta"><div><strong>Date:</strong> ${date}</div></div>
          <div class="popup-location">${address}</div>
          <div class="popup-description">${description}</div>
        </div>
      `;

      const marker = L.marker([coords.lat, coords.lon], { icon: iconEvents }).bindPopup(popupHTML);
      marker.suburb = suburb;
      allMarkers.events.push(marker);
    });
  });

  return Promise.all(geocodePromises);
}

Promise.all([
  fetch("https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/library-events/records?limit=100").then(res => res.json()),
  fetch("https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/infants-and-toddlers-events/records?limit=100").then(res => res.json())
])
.then(([libraryData, toddlersData]) => {
  return Promise.all([
    processEventRecords(libraryData.results),
    processEventRecords(toddlersData.results)
  ]);
})
.then(() => console.log("All event markers loaded."));

function processMarkets(records) {
  const geocodePromises = records.map(record => {
    const name = record.subject || "Unnamed Market";
    const address = record.location || record.venueaddress || "";
    const suburb = (address || "").toLowerCase();
    const date = record.formatteddatetime || record.date || "TBA";
    const description = record.description || "No description available";
    const cost = record.cost || "$$$";

    if (!address) return Promise.resolve();

    return geocodeAddress(address).then(coords => {
      if (!coords) return;

      const popupHTML = `
        <div class="popup-card">
          <div class="popup-header">
            <span class="popup-title">${name}</span>
            <span class="popup-price">${cost}</span>
          </div>
          <div class="popup-meta">
            <div><strong>Date:</strong> ${date}</div>
          </div>
          <div class="popup-location">${address}</div>
          <div class="popup-description">${description}</div>
        </div>
      `;

      const marker = L.marker([coords.lat, coords.lon], { icon: iconMarkets }).bindPopup(popupHTML);
      marker.suburb = suburb;

      allMarkers.markets.push(marker);
    });
  });

  return Promise.all(geocodePromises);
}

fetch("https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/markets-events/records?limit=100")
  .then(res => res.json())
  .then(data => processMarkets(data.results))
  .then(() => console.log("Market markers loaded."))
  .catch(err => console.error("Error loading markets dataset:", err));

function processParks(records) {
  records.forEach(record => {
    const coords = record.geo_point_2d;
    if (!coords || !Array.isArray(coords) || coords.length !== 2) return;

    const lat = coords[0];
    const lon = coords[1];

    const name = record.PARK_NAME || "Unnamed Park";
    const suburbRaw = record.SUBURB || record.STREET_ADDRESS || "";
    const suburb = suburbRaw.trim().toLowerCase();

    const popupHTML = `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-title">${name}</span>
        </div>
        <div class="popup-meta">
          <div><strong>Suburb:</strong> ${suburbRaw}</div>
        </div>
      </div>
    `;

    const marker = L.marker([lat, lon], { icon: iconParks }).bindPopup(popupHTML);
    marker.suburb = suburb;

    allMarkers.parks.push(marker);

    console.log("Park marker added:", name, "| Lat:", lat, "| Lon:", lon);
  });

  console.log("Total parks loaded:", allMarkers.parks.length);
}


fetch("https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/park-locations/records?limit=100")
  .then(res => res.json())
  .then(data => {
    processParks(data.results);

    allMarkers.parks.forEach(marker => marker.addTo(map));
  })
  .catch(err => console.error("Error loading parks dataset:", err));


  allMarkers.parks.forEach(marker => marker.addTo(map));

function processToilets(records) {
  records.forEach(record => {
    const lat = record.latitude;
    const lon = record.longitude;
    if (!lat || !lon) return;

    const name = record.name || "Unnamed Facility";
    const facilityType = record.facilitytype || "Unknown Type";
    const address = record.address || "No address provided";
    const suburbRaw = record.suburb || "";
    const suburb = suburbRaw.trim().toLowerCase();
    const babyChange = record.babychange === "Yes" ? "✅ Baby Change Available" : "❌ No Baby Change";
    const babyCareRoom = record.babycareroom === "Yes" ? "✅ Baby Care Room Available" : "❌ No Baby Care Room";
    const openingHours = record.openinghours || "Opening hours not listed";

    const popupHTML = `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-title">${name}</span>
        </div>
        <div class="popup-meta">
          <div><strong>Facility Type:</strong> ${facilityType}</div>
          <div><strong>Address:</strong> ${address}</div>
          <div><strong>Suburb:</strong> ${suburb}</div>
          <div><strong>${babyChange}</strong></div>
          <div><strong>${babyCareRoom}</strong></div>
          <div><strong>Opening Hours:</strong> ${openingHours}</div>
        </div>
      </div>
    `;

    const marker = L.marker([lat, lon], { icon: iconToilet }).bindPopup(popupHTML);
    marker.suburb = suburb;

    allMarkers.toilet.push(marker);
  });

  console.log("Toilet markers loaded:", allMarkers.toilet.length);
}

fetch("https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/public-toilets-in-brisbane/records?limit=100")
  .then(res => res.json())
  .then(data => processToilets(data.results))
  .catch(err => console.error("Error loading toilets dataset:", err));

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.type;
    const suburbInput = document.getElementById("suburbInput").value.trim().toLowerCase();

    if (suburbInput) focusOnSuburb(suburbInput);
    else map.setView([-27.5, 153.0], 10);

    document.querySelectorAll(".filter-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    Object.values(allMarkers).flat().forEach(marker => map.removeLayer(marker));

    allMarkers[category].forEach(marker => {
      const markerSuburb = marker.suburb || "";
      if (
        suburbInput === "" ||
        markerSuburb.includes(suburbInput) ||
        markerSuburb.includes(suburbInput.replace(/\s+/g, "-")) ||
        markerSuburb.includes(suburbInput.replace(/\s+/g, ""))
      ) {
        marker.addTo(map);
      }
    });

    document.getElementById("eventDetailsPanel").classList.add("hidden");
  });
});
