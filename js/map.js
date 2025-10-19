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

// ------------------- OPTIONAL GEOCODING -------------------
async function geocodeAddress(address, retries = 3) {
  if (!address) return null;
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encoded}`;

  for (let i = 0; i < retries; i++) {
    try {
      await new Promise(r => setTimeout(r, 1500)); // delay between retries
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn(`Geocoding failed (attempt ${i + 1}) for ${address}:`, e);
    }
  }
  console.error("❌ Could not geocode:", address);
  return null;
}

// ------------------- KNOWN MARKET COORDINATES -------------------
const knownMarketCoords = {
  "Manly Creative Markets": [-27.4483, 153.1831],
  "Jan Power Manly Markets": [-27.447, 153.187],
  "Carseldine Farmers & Artisan Markets": [-27.354, 153.023],
  "Milton Markets": [-27.4732, 153.0029],
  "Nundah Farmers Market": [-27.4014, 153.0602],
  "BrisStyle Twilight Market": [-27.4689, 153.0235],
  "Rocklea Sunday Discovery Market": [-27.5434, 153.0113]
};

// ------------------- PROCESS EVENTS -------------------
async function processEvents(records) {
  for (const record of records) {
    const f = record.fields || {};

    let coords = f.geo_point_2d
      || (record.geometry?.coordinates ? [...record.geometry.coordinates].reverse() : null)
      || await geocodeAddress(f.location || f.venueaddress)
      || [-27.47, 153.03]; // fallback

    const popup = createPopupHTML({
      name: f.event_name || f.subject || "Event",
      cost: f.cost || "Free",
      date: f.start_datetime || f.formatteddatetime || "TBA",
      address: f.location || f.venueaddress || "Address not available",
      description: f.description || ""
    });

    L.marker(coords, { icon: iconEvents }).bindPopup(popup).addTo(allMarkers.events);
  }
  console.log("✅ Finished processing events");
}

// ------------------- PROCESS MARKETS -------------------
async function processMarkets(records) {
  console.log("Markets records loaded:", records.length);

  for (const record of records) {
    const f = record.fields || {};
    let searchAddress = f.venueaddress || f.location || "";

    if (searchAddress && !/brisbane|qld/i.test(searchAddress)) {
      searchAddress += ", Brisbane, QLD, Australia";
    }

    let coords = f.geo_point_2d
      || (record.geometry?.coordinates ? [...record.geometry.coordinates].reverse() : null)
      || knownMarketCoords[f.event_name]
      || await geocodeAddress(searchAddress)
      || [-27.47, 153.03]; // fallback

    const popup = createPopupHTML({
      name: f.event_name || f.subject || "Market",
      cost: f.cost || "Free",
      date: f.start_datetime || f.formatteddatetime || "TBA",
      address: f.venueaddress || f.location || "Address not available",
      description: f.description || "No description available"
    });

    L.marker(coords, { icon: iconMarkets }).bindPopup(popup).addTo(allMarkers.markets);
    await new Promise(r => setTimeout(r, 200)); // small pause to reduce server load
  }

  console.log("✅ Finished processing markets");
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
        <strong>Address:</strong> ${f.address || ""}
      </div>
    `;
    L.marker([f.latitude, f.longitude], { icon: iconToilet }).bindPopup(popup).addTo(allMarkers.toilet);
  });
}

// ------------------- FETCH DATA -------------------

// Events (library + infants)
Promise.all([
  fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=library-events&q=&rows=500").then(r => r.json()),
  fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=infants-and-toddlers-events&q=&rows=500").then(r => r.json())
]).then(([lib, toddlers]) => {
  processEvents(lib.records);
  processEvents(toddlers.records);
}).catch(err => console.error("Events fetch error:", err));

// Markets
fetch("https://data.brisbane.qld.gov.au/api/records/1.0/search/?dataset=markets-events&q=&rows=500")
  .then(r => r.json())
  .then(data => processMarkets(data.records))
  .catch(err => console.error("Markets error:", err));

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
