// ========================================================
// FUPAIS — API GEOCODING ADAPTER
// Implements the geocoding port over the serverless proxy at
// /api/geocode. It is a pure client: no fallback to the public
// providers, so dev and production behave the same way.
//
// Status mapping:
//   404 -> null  ("the backend answered, nothing usable")
//   other non-2xx -> throw, so map.js keeps its own console.warn and
//                    shows the offline copy
//   malformed 2xx payload -> null
// ========================================================

const ENDPOINT = "/api/geocode";

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

const readJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export const apiGeocodingAdapter = {
  async reverseGeocode(lat, lng) {
    const res = await fetch(
      `${ENDPOINT}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`La API de geocoding respondió ${res.status}`);

    const data = await readJson(res);
    if (!data || !isNonEmptyString(data.city) || !isNonEmptyString(data.country)) return null;

    return { city: data.city, country: data.country };
  },

  async searchPlace(query) {
    const res = await fetch(`${ENDPOINT}?q=${encodeURIComponent(query)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`La API de geocoding respondió ${res.status}`);

    const data = await readJson(res);
    if (!data || !isFiniteNumber(data.lat) || !isFiniteNumber(data.lng)) return null;

    return { lat: data.lat, lng: data.lng };
  }
};
