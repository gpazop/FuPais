// ========================================================
// FUPAIS — PUBLIC GEOCODING ADAPTER
// Implements the geocoding port over two free public endpoints:
//   - BigDataCloud reverse-geocode-client (coordinates -> city/country)
//   - Nominatim /search               (free text -> coordinates)
//
// Both return null when the response is not ok, so the caller can decide
// what to show. Network errors propagate on purpose: the map UI already
// logs them with its own console.warn and switches to offline copy.
// ========================================================

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

// The same adapter runs in the browser and inside the serverless proxy.
// Nominatim's usage policy requires an identifying User-Agent for
// server-side calls; browsers silently drop that forbidden header, so
// setting it here is safe for both runtimes.
const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "FuPais/1.0 (+https://github.com/gpazop/FuPais)"
};

export const publicGeocodingAdapter = {
  async reverseGeocode(lat, lng) {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
      { headers: REQUEST_HEADERS }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const city =
      normalizeText(data.city) ||
      normalizeText(data.locality) ||
      normalizeText(data.principalSubdivision) ||
      "Zona Geográfica";
    const country = normalizeText(data.countryName) || "Internacional";

    return { city, country };
  },

  async searchPlace(query) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: REQUEST_HEADERS }
    );
    if (!res.ok) return null;

    const results = await res.json();
    if (!results || results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon)
    };
  }
};
