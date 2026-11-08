// ========================================================
// FUPAIS — useGeoTracking (Sprint 3)
// Reemplaza a MapMethods (dock/map.js): GPS real del navegador,
// posición manual (clic en el mapa / drag del marcador), reverse
// geocode vía el PUERTO services/geocoding.js (nunca fetch directo)
// y zona legal derivada del viaje activo.
//
// Callbacks estables (refs "latest") porque Map.jsx está memoizado:
// solo cambian de identidad cuando cambia un dato real.
// ========================================================

import { useCallback, useRef, useState } from "react";
import { geocoding } from "../../services/geocoding.js";

const DEFAULT_POSITION = { lat: 4.7110, lng: -74.0721 }; // Bogotá D.C.
const DEFAULT_META = {
  city: "Bogotá D.C.",
  country: "Colombia",
  accuracy: "Ubicación de referencia"
};

/** Zona legal derivada (misma semántica del reverseGeocode vanilla). */
function computeLegalZone(country, destinationCountry, originCountry) {
  const c = (country || "").trim().toLowerCase();
  if (!c) return "País sin identificar";
  const dest = (destinationCountry || "").toLowerCase();
  const origin = (originCountry || "").toLowerCase();
  if (dest && c === dest) {
    return `País de destino (${destinationCountry})`;
  }
  if (origin && c === origin) {
    return `País de Origen (${originCountry})`;
  }
  return `Territorio Extranjero (${country}) — Fuera de tu país`;
}

export function useGeoTracking({
  destinationCountry,
  originCountry,
  onNotify
} = {}) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const selection = useRef(0);
  const positionRequest = useRef(0);

  // Refs "latest": las props del viaje pueden cambiar en cualquier
  // render sin invalidar las callbacks.
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;

  const updatePosition = useCallback(async (lat, lng, accuracy) => {
    const request = ++positionRequest.current;
    setPosition({ lat, lng });
    setMeta({ city: "", country: "", accuracy });
    setResolving(true);
    try {
      const location = await geocoding.reverseGeocode(lat, lng);
      if (request !== positionRequest.current) return null;
      if (location) {
        setMeta({
          city: location.city?.trim() || "",
          country: location.country?.trim() || "",
          accuracy
        });
      }
      return location;
    } catch (error) {
      console.warn("Geocodificación falló:", error);
      return null;
    } finally {
      if (request === positionRequest.current) setResolving(false);
    }
  }, []);

  /** Posición manual (clic en el mapa o drag del marcador). */
  const applyManualPosition = useCallback(
    async (lat, lng, request) => {
      const roundLat = parseFloat(Number(lat).toFixed(4));
      const roundLng = parseFloat(Number(lng).toFixed(4));
      const location = await updatePosition(roundLat, roundLng, "Ubicación manual");
      if (request !== selection.current) return false;
      const place = [location?.city, location?.country].filter(Boolean).join(", ");
      notifyRef.current?.(
        place
          ? `📍 Posición fijada en: ${place} (${roundLat}°, ${roundLng}°)`
          : `📍 Posición fijada en: ${roundLat}°, ${roundLng}°`
      );
      return true;
    },
    [updatePosition]
  );

  const setManualPosition = useCallback((lat, lng) => {
    setLocating(false);
    return applyManualPosition(lat, lng, ++selection.current);
  }, [applyManualPosition]);

  /**
   * GPS real del navegador. Resuelve { lat, lng } | null para que el
   * llamador decida si vuela el mapa (flyRequest).
   */
  const locate = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        notifyRef.current?.(
          "Geolocalización no soportada por el navegador. Haz clic en el mapa para fijar tu posición."
        );
        resolve(null);
        return;
      }
      const request = ++selection.current;
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (request !== selection.current) return resolve(null);
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          await updatePosition(lat, lng, `GPS del dispositivo ±${Math.round(pos.coords.accuracy)}m`);
          if (request !== selection.current) return resolve(null);
          setLocating(false);
          resolve({ lat, lng });
        },
        (err) => {
          if (request !== selection.current) return resolve(null);
          setLocating(false);
          notifyRef.current?.(
            `GPS no disponible (${err.message}). Haz clic en el mapa para fijar tu posición.`
          );
          resolve(null);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    });
  }, [updatePosition]);

  /** Búsqueda de lugar → coordenadas (y posición manual geocodificada). */
  const findPlace = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (!q) return null;
      const request = ++selection.current;
      setLocating(false);
      try {
        const place = await geocoding.searchPlace(q);
        if (request !== selection.current) return null;
        if (!place) {
          notifyRef.current?.(`No se encontró el lugar "${q}"`);
          return null;
        }
        const applied = await applyManualPosition(place.lat, place.lng, request);
        return applied ? place : null;
      } catch (error) {
        if (request !== selection.current) return null;
        console.warn("Búsqueda de lugar falló:", error);
        notifyRef.current?.(`No se pudo buscar "${q}" en este momento.`);
        return null;
      }
    },
    [applyManualPosition]
  );

  return {
    position,
    meta,
    legalZone: computeLegalZone(meta.country, destinationCountry, originCountry),
    locating,
    resolving,
    locate,
    setManualPosition,
    findPlace
  };
}

export default useGeoTracking;
