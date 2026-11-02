// ========================================================
// FUPAIS — mapIcons (Sprint 3)
// Identidad ESTABLE para los íconos Leaflet: crear L.divIcon dentro
// del render obliga a Leaflet a destruir/recrear marcadores en cada
// render (churn y parpadeo). El radar es un singleton; los pines de
// país se cachean por presetId en un Map module-level.
// ========================================================

import L from "leaflet";

/** Centro inicial del mapa (Bogotá D.C.) — NUNCA cambia tras el montaje. */
export const INITIAL_CENTER = [4.7110, -74.0721];

const radarHtml = `
  <div style="position: relative; width: 28px; height: 28px; transform: translate(-50%, -50%);">
    <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(14, 165, 233, 0.4); border: 2px solid #38bdf8; animation: radarWave 2s infinite ease-out;"></div>
    <div style="position: absolute; inset: 6px; border-radius: 50%; background: #0ea5e9; border: 2px solid #ffffff; box-shadow: 0 0 10px #0ea5e9;"></div>
    <div style="position: absolute; inset: 10px; border-radius: 50%; background: #ffffff;"></div>
  </div>
`;

export const radarIcon = L.divIcon({
  className: "custom-radar-marker",
  html: radarHtml,
  iconSize: [28, 28]
});

const pinIconCache = new Map();

/**
 * Pin de país con identidad estable por presetId. Los datos provienen
 * del registro publicado (MIGRATION_PRESETS), no de input de usuario.
 */
export function getCountryPinIcon(preset) {
  if (!pinIconCache.has(preset.id)) {
    const html = `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <span>${preset.flag}</span>
        <span>${preset.destinationCountry}</span>
      </div>
    `;
    pinIconCache.set(
      preset.id,
      L.divIcon({ className: "custom-country-pin", html, iconSize: [80, 24] })
    );
  }
  return pinIconCache.get(preset.id);
}
