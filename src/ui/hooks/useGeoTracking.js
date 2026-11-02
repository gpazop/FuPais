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
  accuracy: "Alta (GPS Satelital)"
};

/** Zona legal derivada (misma semántica del reverseGeocode vanilla). */
function computeLegalZone(country, destinationCountry, originCountry) {
  const c = (country || "").toLowerCase();
  const dest = (destinationCountry || "").toLowerCase();
  const origin = (originCountry || "").toLowerCase();
  if (dest && (c.includes(dest) || dest.includes(c))) {
    return `Territorio de ${destinationCountry} — Estancia Legal Vigente`;
  }
  if (origin && (c.includes(origin) || origin.includes(c))) {
    return `País de Origen (${originCountry}) — Residencia Nacional`;
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
  const [legalZone, setLegalZone] = useState(
    "Territorio Colombiano — Estancia Legal Vigente"
  );
  const [locating, setLocating] = useState(false);

  // Refs "latest": las props del viaje pueden cambiar en cualquier
  // render sin invalidar las callbacks.
  const destRef = useRef(destinationCountry);
  destRef.current = destinationCountry;
  const originRef = useRef(originCountry);
  originRef.current = originCountry;
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;

  /** Coordenadas → ciudad/país vía puerto. Devuelve la location o null. */
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const location = await geocoding.reverseGeocode(lat, lng);
      if (location) {
        setMeta((prev) => ({
          ...prev,
          city: location.city || prev.city,
          country: location.country || prev.country
        }));
        setLegalZone(
          computeLegalZone(location.country, destRef.current, originRef.current)
        );
      }
      return location;
    } catch (error) {
      // Sin conexión o backend caído: el HUD conserva lo último conocido.
      console.warn("Geocodificación falló:", error);
      return null;
    }
  }, []);

  /** Posición manual (clic en el mapa o drag del marcador). */
  const setManualPosition = useCallback(
    async (lat, lng) => {
      const roundLat = parseFloat(Number(lat).toFixed(4));
      const roundLng = parseFloat(Number(lng).toFixed(4));
      setPosition({ lat: roundLat, lng: roundLng });
      setMeta((prev) => ({
        ...prev,
        accuracy: "Ubicación Manual (Fijada en el mapa)"
      }));
      const location = await reverseGeocode(roundLat, roundLng);
      const place = location
        ? `${location.city}, ${location.country}`
        : `${roundLat}°, ${roundLng}°`;
      notifyRef.current?.(
        `📍 Posición fijada en: ${place} (${roundLat}°, ${roundLng}°)`
      );
    },
    [reverseGeocode]
  );

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
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          setMeta((prev) => ({
            ...prev,
            accuracy: `GPS Satelital en Vivo ±${Math.round(pos.coords.accuracy)}m`
          }));
          setPosition({ lat, lng });
          await reverseGeocode(lat, lng);
          setLocating(false);
          resolve({ lat, lng });
        },
        (err) => {
          setLocating(false);
          notifyRef.current?.(
            `GPS no disponible (${err.message}). Haz clic en el mapa para fijar tu posición.`
          );
          resolve(null);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    });
  }, [reverseGeocode]);

  /** Búsqueda de lugar → coordenadas (y posición manual geocodificada). */
  const findPlace = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (!q) return null;
      try {
        const place = await geocoding.searchPlace(q);
        if (!place) {
          notifyRef.current?.(`No se encontró el lugar "${q}"`);
          return null;
        }
        await setManualPosition(place.lat, place.lng);
        return place;
      } catch (error) {
        console.warn("Búsqueda de lugar falló:", error);
        notifyRef.current?.(`No se pudo buscar "${q}" en este momento.`);
        return null;
      }
    },
    [setManualPosition]
  );

  return {
    position,
    meta,
    legalZone,
    locating,
    locate,
    setManualPosition,
    findPlace
  };
}

export default useGeoTracking;
