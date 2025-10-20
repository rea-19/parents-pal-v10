// ------------------- MAP INITIALIZATION -------------------
const map = L.map("map").setView([-27.47, 153.03], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors",
  maxZoom: 18
}).addTo(map);

// ------------------- ICONS -------------------
const iconEvents = L.icon({ iconUrl: "/src/events-black.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconMarkets = L.icon({ iconUrl: "/src/markets-black.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconParks = L.icon({ iconUrl: "/src/park-black.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const iconToilet = L.icon({ iconUrl: "/src/toilet-black.png", iconSize: [32, 32], iconAnchor: [16, 32] });

// ------------------- LAYER GROUPS -------------------
const allMarkers = {
  events: L.layerGroup().addTo(map),
  markets: L.layerGroup().addTo(map),
  parks: L.layerGroup().addTo(map),
  toilet: L.layerGroup().addTo(map)
};

// ------------------- POPUP TEMPLATE -------------------
function createPopupHTML({ name, cost, date, address, description }) {
  return `
    <div class="popup-card">
      <div class="popup-header">
        <span class="popup-title">${name}</span>
        ${cost ? `<span class="popup-price">${cost}</span>` : ""}
      </div>
      ${date ? `<div class="popup-meta"><strong>Date:</strong> ${date}</div>` : ""}
      ${address ? `<div class="popup-location">${address}</div>` : ""}
      ${description ? `<div class="popup-description">${description}</div>` : ""}
    </div>
  `;
}

// ------------------- PRE-GEOCODED LOCATIONS -------------------
// Add all known locations here or from batch geocoding CSV/JSON
const preGeocodedLocations = {
  // Markets
  "Manly Creative Markets": [-27.4483, 153.1831],
  "Jan Power Manly Markets": [-27.447, 153.187],
  "Carseldine Farmers & Artisan Markets": [-27.354, 153.023],
  "Milton Markets": [-27.4732, 153.0029],
  "Nundah Farmers Market": [-27.4014, 153.0602],
  "BrisStyle Twilight Market": [-27.4689, 153.0235],
  "Rocklea Sunday Discovery Market": [-27.5434, 153.0113],

  // Library Events (example)
  "Garden City Library": [-27.5205, 153.0732],
  "Chermside Library": [-27.4145, 153.0336],
  "Brisbane Square Library": [-27.470625396194546, 153.02388106519612],
  "Wynnum Library": [-27.444842597699093, 153.17225409271745],
  "Annerley Library": [-27.50907108406768, 153.03424875104642],
  "Svoboda Park, Kuraby": [-27.605330811942043, 153.09853130435903],
  "Indooroopilly Library": [-27.501126577924424, 152.97272005594172],
  "Sunnybank Hills Library": [-27.610127737977063, 153.0566373235251],
  "Carindale Library": [-27.500918856572852, 153.10410697749504],
  "Toowong Library": [-27.4854046911848, 152.99426424800188],
  "Mt Gravatt Library": [-27.538158008751573, 153.08250378436225],

  // Infants & Toddlers Events (example)
  "Perrin Park, Toowong": [-27.491531764237564, 152.99212386203067],
  "Museum of Brisbane, Brisbane City": [-27.468503592804012, 153.02446606573247],
  "Richard Randall Art Studio, Toowong": [-27.474753552734985, 152.9785945154643],
  "7th Brigade Park, Chermside": [-27.37905929772551, 153.03915101709947],
  "Little Bayside Park": [-27.4501, 153.1822],
  "New Farm Park": [-27.4567, 153.0465]
};

// ------------------- PROCESS EVENTS -------------------
function processEvents(records) {
  records.forEach(record => {
    const f = record.fields || {};
    let coords = f.geo_point_2d || (record.geometry?.coordinates ? [...record.geometry.coordinates].reverse() : null);

    // Fallback to pre-geocoded
    if (!coords && f.location && preGeocodedLocations[f.location]) {
      coords = preGeocodedLocations[f.location];
    }

    if (!coords) return; // skip if no coordinates

    const popup = createPopupHTML({
      name: f.event_name || f.subject || "Event",
      cost: f.cost || "Free",
      date: f.start_datetime || f.formatteddatetime || "TBA",
      address: f.location || f.venueaddress || "",
      description: f.description || ""
    });

    L.marker(coords, { icon: iconEvents }).bindPopup(popup).addTo(allMarkers.events);
  });

  console.log("Finished processing events");
}

// ------------------- PROCESS MARKETS -------------------
function processMarkets(records) {
  records.forEach(record => {
    const f = record.fields || {};
    const name = f.subject?.trim() || "Unnamed Market";
    const address = f.location || f.venueaddress || "";
    const date = f.start_datetime || f.formatteddatetime || "TBA";
    const description = f.description || "No description available";
    const cost = f.cost || "Free";

    console.log("Market name:", name, "| Location:", address);

    let coords = f.geo_point_2d || (record.geometry?.coordinates ? [...record.geometry.coordinates].reverse() : null);

    // Fallback to pre-geocoded
    if (!coords && name) {
      const match = Object.keys(preGeocodedLocations).find(k =>
        k.toLowerCase() === name.toLowerCase() ||
        name.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(name.toLowerCase())
      );
      if (match) {
        coords = preGeocodedLocations[match];
        console.log("Matched geocoded location:", match, coords);
      }
    }

    if (!coords) {
      console.warn("Missing coordinates for market:", name);
      return;
    }

    const popup = createPopupHTML({
      name,
      cost,
      date,
      address,
      description
    });

    const marker = L.marker(coords, { icon: iconMarkets }).bindPopup(popup);
    marker.addTo(allMarkers.markets);
  });

  console.log("Finished processing markets");
}

// ------------------- PROCESS PARKS -------------------
function processParks(records) {
  records.forEach(record => {
    const f = record.fields || {};
    const coords = f.geo_point_2d || (record.geometry?.coordinates ? [...record.geometry.coordinates].reverse() : null);
    if (!coords) return;

    const popup = `
      <div class="popup-card">
        <span class="popup-title">${f.park_name || "Park"}</span><br>
        <strong>Suburb:</strong> ${f.suburb || "Unknown"}
      </div>
    `;
    L.marker(coords, { icon: iconParks }).bindPopup(popup).addTo(allMarkers.parks);
  });
}

// ------------------- PROCESS TOILETS -------------------
function processToilets(records) {
  records.forEach(record => {
    const f = record.fields || {};
    if (!f.latitude || !f.longitude) return;

    const popup = `
      <div class="popup-card">
        <span class="popup-title">${f.name || "Toilet"}</span><br>
        <div class="popup-meta">
          <div><strong>Facility Type:</strong> ${f.facilityType || "Unknown Type"}</div>
          <div><strong>Address:</strong> ${f.address || "No address provided"}</div>
          <div><strong>${f.babyChange === "Yes" ? "✅ Baby Change Available" : "❌ No Baby Change"}</strong></div>
          <div><strong>${f.babyCareRoom === "Yes" ? "✅ Baby Care Room Available" : "❌ No Baby Care Room"}</strong></div>
          <div><strong>Opening Hours:</strong> ${f.openingHours ||  "Opening hours not listed"}</div>
        </div>
      </div>
    `;
    L.marker([f.latitude, f.longitude], { icon: iconToilet }).bindPopup(popup).addTo(allMarkers.toilet);
  });
}

// ------------------- FETCH DATA -------------------

// Events (live from Brisbane API)
Promise.all([
  fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=library-events&q=&rows=500").then(r => r.json()),
  fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=infants-and-toddlers-events&q=&rows=500").then(r => r.json())
]).then(([lib, toddlers]) => {
  processEvents(lib.records);
  processEvents(toddlers.records);
}).catch(err => console.error("Events fetch error:", err));

// Markets 
fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=markets-events&q=&rows=20")
  .then(res => res.json())
  .then(data => {
    console.log("Markets API response:", data);
    processMarkets(data.records);
  })
  .catch(err => console.error("Markets fetch error:", err));

// Parks
fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=park-locations&q=&rows=500")
  .then(r => r.json())
  .then(data => processParks(data.records))
  .catch(err => console.error("Parks error:", err));

// Toilets
fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=public-toilets-in-brisbane&q=&rows=500")
  .then(r => r.json())
  .then(data => processToilets(data.records))
  .catch(err => console.error("Toilets error:", err));

// ------------------- BUTTON TOGGLE -------------------
document.addEventListener("DOMContentLoaded", () => {
  const state = { events: true, markets: true, parks: true, toilet: true };

  document.querySelectorAll(".filter-button").forEach(btn => {
    const type = btn.dataset.type;
    btn.addEventListener("click", () => {
      state[type] = !state[type];
      if (state[type]) {
        map.addLayer(allMarkers[type]);
        btn.classList.add("active");
      } else {
        map.removeLayer(allMarkers[type]);
        btn.classList.remove("active");
      }
    });
  });
});
