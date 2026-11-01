// ========================================================
// FUPAIS — Map (React Leaflet v5)
// Mapa migratorio con pines de países publicados y rutas
// de vuelo. Reemplaza la lógica vanilla de dock/map.js.
// ========================================================

import { useState, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle
} from "react-leaflet";
import L from "leaflet";
import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";
import { PRESET_COORDS } from "../../data/presetCoords.js";

// Ícono radar del usuario (estilo original del dock)
const radarIcon = L.divIcon({
  className: "custom-radar-marker",
  html: `
    <div style="position: relative; width: 28px; height: 28px; transform: translate(-50%, -50%);">
      <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(14, 165, 233, 0.4); border: 2px solid #38bdf8; animation: radarWave 2s infinite ease-out;"></div>
      <div style="position: absolute; inset: 6px; border-radius: 50%; background: #0ea5e9; border: 2px solid #ffffff; box-shadow: 0 0 10px #0ea5e9;"></div>
      <div style="position: absolute; inset: 10px; border-radius: 50%; background: #ffffff;"></div>
    </div>
  `,
  iconSize: [28, 28]
});

// Ícono de pin de país (divIcon sin onclick inline)
function countryPin(flag, name) {
  return L.divIcon({
    className: "custom-country-pin",
    html: `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <span>${flag}</span>
        <span>${name}</span>
      </div>
    `,
    iconSize: [80, 24]
  });
}

export default function Map({ appApi, layerKey = "streets" }) {
  const [userPosition, setUserPosition] = useState([4.7110, -74.0721]);
  const mapRef = useRef(null);

  const tileLayers = {
    streets: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    terrain: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
  };

  const handleMapCreate = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerClick = useCallback((coords, presetId) => {
    if (!appApi?.applyPreset) return;
    appApi.applyPreset(presetId);
    if (mapRef.current) {
      mapRef.current.flyTo(coords, 6, { duration: 1.2 });
    }
  }, [appApi]);

  return (
    <MapContainer
      center={userPosition}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      onCreate={handleMapCreate}
    >
      <TileLayer
        url={tileLayers[layerKey]}
        maxZoom={20}
        attribution="&copy; Google Maps"
      />

      {/* Marcador de usuario (radar) */}
      <Marker
        position={userPosition}
        icon={radarIcon}
        draggable
        title="Tu Ubicación (Arrastra para mover manualmente)"
      />

      {/* Círculo de cobertura radar */}
      <Circle
        center={userPosition}
        radius={40000}
        color="#0ea5e9"
        fillColor="#38bdf8"
        fillOpacity={0.12}
        weight={1.5}
      />

      {/* Pines de países publicados (data-driven desde MIGRATION_PRESETS) */}
      {Object.values(MIGRATION_PRESETS).map((p) => {
        const coords = PRESET_COORDS[p.id];
        if (!coords) return null;

        return (
          <Marker
            key={p.id}
            position={coords}
            icon={countryPin(p.flag, p.destinationCountry)}
            title={p.destinationCountry}
            onClick={() => handleMarkerClick(coords, p.id)}
          >
            <Popup>
              <div style="padding: 4px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700;">
                  <span>{p.flag}</span>
                  <span>{p.destinationCountry}</span>
                </div>
                <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 2px;">
                  {p.visaType}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  Límite legal: <strong>{p.totalAllowedDays} días</strong>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  {p.legal.summary}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Ruta de vuelo Lima → Bogotá (países publicados) */}
      <Polyline
        positions={[
          [-12.0464, -77.0428],
          [4.7110, -74.0721]
        ]}
        color="#0ea5e9"
        weight={2}
        dashArray="6, 8"
        opacity={0.7}
      />
    </MapContainer>
  );
}
