// ========================================================
// FUPAIS — GEOCODING PORT
// The single boundary between the UI and any geocoding backend.
//
// Contract (async on purpose: both calls hit the network):
//   geocoding.reverseGeocode(lat, lng) -> { city, country } | null
//   geocoding.searchPlace(query)       -> { lat, lng }       | null
//
// `null` means "the backend answered but had nothing usable" (e.g. a
// non-2xx response). Network failures are NOT swallowed here: the caller
// keeps its own console.warn so the offline path stays debuggable.
//
// Call sites must never call fetch directly. To move to a backend, write
// another adapter and call setGeocodingAdapter(); no UI code changes.
// ========================================================

import { publicGeocodingAdapter } from "./adapters/publicGeocodingAdapter.js";

let currentAdapter = publicGeocodingAdapter;

/**
 * Swap the geocoding backend (e.g. a serverless proxy once it exists).
 * @param {{reverseGeocode: Function, searchPlace: Function}} adapter
 */
export function setGeocodingAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter.reverseGeocode !== "function" ||
    typeof adapter.searchPlace !== "function"
  ) {
    throw new TypeError(
      "El adaptador debe implementar reverseGeocode(lat, lng) y searchPlace(query)."
    );
  }
  currentAdapter = adapter;
}

/** @returns {{reverseGeocode: Function, searchPlace: Function}} */
export function getGeocodingAdapter() {
  return currentAdapter;
}

export const geocoding = {
  /**
   * Resolve coordinates into a human city/country pair.
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{city: string, country: string} | null>}
   */
  async reverseGeocode(lat, lng) {
    return currentAdapter.reverseGeocode(lat, lng);
  },

  /**
   * Resolve a free-text place into coordinates.
   * @param {string} query
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  async searchPlace(query) {
    return currentAdapter.searchPlace(query);
  }
};
