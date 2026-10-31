// ========================================================
// FUPAIS — GEOCODING PROXY
// Single serverless endpoint in front of the free public providers:
//
//   GET /api/geocode?lat=..&lng=..  -> { city, country }
//   GET /api/geocode?q=..           -> { lat, lng }
//
// The upstream parsing lives in publicGeocodingAdapter, so client and
// server share one implementation. This handler only validates input,
// bounds the upstream call, and translates outcomes into HTTP:
//
//   200 -> usable payload (cached at the edge for a day)
//   400 -> missing / ambiguous / out-of-range parameters
//   404 -> upstream answered but had nothing usable
//   405 -> anything other than GET (with Allow: GET)
//   502 -> upstream threw, timed out, or returned malformed JSON
//
// Error responses are never cached.
// ========================================================

import { publicGeocodingAdapter } from "../src/services/adapters/publicGeocodingAdapter.js";

const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_QUERY_LENGTH = 160;

const SUCCESS_CACHE = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
const ERROR_CACHE = "no-store";

const sendJson = (res, status, payload, cacheControl = ERROR_CACHE) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheControl);
  if (status === 405) res.setHeader("Allow", "GET");
  res.end(JSON.stringify(payload));
};

const rejectParams = (res, message) =>
  sendJson(res, 400, { error: "invalid_params", message });

const parseCoordinate = (value) => {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("upstream_timeout")), ms);
    if (typeof timer.unref === "function") timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const isUsableLocation = (location) =>
  Boolean(location) &&
  typeof location.city === "string" &&
  location.city.trim() !== "" &&
  typeof location.country === "string" &&
  location.country.trim() !== "";

const isUsablePlace = (place) =>
  Boolean(place) && Number.isFinite(place.lat) && Number.isFinite(place.lng);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const queryParam = url.searchParams.get("q");

  const hasCoords = latParam !== null || lngParam !== null;
  const hasQuery = queryParam !== null;

  if (hasCoords && hasQuery) {
    rejectParams(res, "Usa ?lat&lng o ?q, no ambos.");
    return;
  }
  if (!hasCoords && !hasQuery) {
    rejectParams(res, "Faltan parámetros: usa ?lat&lng o ?q.");
    return;
  }

  try {
    if (hasCoords) {
      if (latParam === null || lngParam === null) {
        rejectParams(res, "lat y lng deben venir juntos.");
        return;
      }

      const lat = parseCoordinate(latParam);
      const lng = parseCoordinate(lngParam);
      if (lat === null || lng === null) {
        rejectParams(res, "lat y lng deben ser números finitos.");
        return;
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        rejectParams(res, "lat debe estar entre -90 y 90 y lng entre -180 y 180.");
        return;
      }

      const location = await withTimeout(
        publicGeocodingAdapter.reverseGeocode(lat, lng),
        UPSTREAM_TIMEOUT_MS
      );
      if (!isUsableLocation(location)) {
        sendJson(res, 404, { error: "not_found" });
        return;
      }

      sendJson(res, 200, { city: location.city, country: location.country }, SUCCESS_CACHE);
      return;
    }

    const query = typeof queryParam === "string" ? queryParam.trim() : "";
    if (query === "") {
      rejectParams(res, "q no puede estar vacío.");
      return;
    }
    if (query.length > MAX_QUERY_LENGTH) {
      rejectParams(res, `q no puede superar los ${MAX_QUERY_LENGTH} caracteres.`);
      return;
    }

    const place = await withTimeout(
      publicGeocodingAdapter.searchPlace(query),
      UPSTREAM_TIMEOUT_MS
    );
    if (!isUsablePlace(place)) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    sendJson(res, 200, { lat: place.lat, lng: place.lng }, SUCCESS_CACHE);
  } catch (error) {
    console.error("[geocode] upstream falló:", error);
    sendJson(res, 502, { error: "upstream_unavailable" });
  }
}
