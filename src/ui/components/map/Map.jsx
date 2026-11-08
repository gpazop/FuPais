// ========================================================
// FUPAIS — Map (react-leaflet v5, Sprint 3)
// Mapa 100% controlado y SIN REMONTAR:
//   - MapContainer aplica center/zoom al montar. El centro inicial usa
//     el preset activo y los cambios posteriores pasan por MapController.
//   - API v5 correcta: instancia vía useMapEvents (no `onCreate`, que
//     no existe), markers con eventHandlers (no `onClick`), Popup con
//     estilos objeto (no strings) — mata el hallazgo H5.
//   - MapController: el ÚNICO cerebro imperativo del mapa (dentro del
//     contexto de MapContainer): presetId → flyTo (efecto único, sin
//     vuelo al montar), flyRequest imperativa (GPS/búsqueda) e
//     invalidateSize al activar la pestaña.
//   - Íconos con identidad estable (mapIcons.js) → cero churn.
// ========================================================

import { memo, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents
} from "react-leaflet";
import { MIGRATION_PRESETS } from "../../../data/migrationPresets.js";
import { PRESET_COORDS } from "../../../data/presetCoords.js";
import { INITIAL_CENTER, radarIcon, getCountryPinIcon } from "./mapIcons.js";

const TILE_LAYERS = {
  streets: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps"
  },
  satellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satélite"
  },
  terrain: {
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Relieve"
  }
};

function MapController({ presetId, active, flyRequest, onPickLocation }) {
  // useMapEvents: obtiene la instancia Y binde los eventos del mapa.
  const map = useMapEvents({
    click: (e) => onPickLocation?.(e.latlng.lat, e.latlng.lng)
  });

  const prevPresetRef = useRef(null);
  const lastFlyKeyRef = useRef(null);

  // Cambio de preset (Header / pin / tarjeta) → UN solo vuelo.
  // El primer presetId conocido no vuela: MapContainer ya usa su centro.
  useEffect(() => {
    if (!presetId) return undefined;
    if (prevPresetRef.current === null) {
      prevPresetRef.current = presetId;
      return undefined;
    }
    if (prevPresetRef.current === presetId) return undefined;
    prevPresetRef.current = presetId;
    const coords = PRESET_COORDS[presetId];
    if (coords) map.flyTo(coords, 6, { duration: 1.2 });
    return undefined;
  }, [presetId, map]);

  // Vuelo imperativo (GPS en vivo / búsqueda de lugar), disparado por
  // una clave única para no repetir el mismo vuelo en re-renders.
  useEffect(() => {
    if (!flyRequest?.key || flyRequest.key === lastFlyKeyRef.current) {
      return undefined;
    }
    lastFlyKeyRef.current = flyRequest.key;
    map.flyTo([flyRequest.lat, flyRequest.lng], flyRequest.zoom ?? 12, {
      duration: 1.5
    });
    return undefined;
  }, [flyRequest, map]);

  // La vista se montó oculta (.fupais-view sin active) → recalcular
  // tamaño al activar la pestaña (paridad con el invalidateSize vanilla).
  useEffect(() => {
    if (!active) return undefined;
    const raf = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(raf);
  }, [active, map]);

  return null;
}

function Map({
  presetId,
  active = false,
  layerKey = "streets",
  position,
  flyRequest,
  onApplyPreset,
  onPickLocation
}) {
  const tile = TILE_LAYERS[layerKey] || TILE_LAYERS.streets;

  return (
    <MapContainer
      id="real-google-map"
      center={PRESET_COORDS[presetId] ?? INITIAL_CENTER}
      zoom={6}
      zoomControl={true}
    >
      <MapController
        presetId={presetId}
        active={active}
        flyRequest={flyRequest}
        onPickLocation={onPickLocation}
      />

      {/* key={layerKey} → swap limpio de la capa base sin re-descargar el resto */}
      <TileLayer
        key={layerKey}
        url={tile.url}
        maxZoom={20}
        attribution={tile.attribution}
      />

      {/* Marcador radar del usuario (draggable) */}
      <Marker
        position={[position.lat, position.lng]}
        icon={radarIcon}
        draggable
        title="Tu Ubicación (Arrastra para mover manualmente)"
        eventHandlers={{
          dragend: (e) => {
            const ll = e.target.getLatLng();
            onPickLocation?.(ll.lat, ll.lng);
          }
        }}
      />

      {/* Círculo de cobertura radar */}
      <Circle
        center={[position.lat, position.lng]}
        radius={40000}
        color="#0ea5e9"
        fillColor="#38bdf8"
        fillOpacity={0.12}
        weight={1.5}
      />

      {/* Pines de países publicados (data-driven desde MIGRATION_PRESETS).
          El clic SOLO aplica el preset: el vuelo lo ejecuta MapController
          al detectar el cambio de presetId (una sola fuente de verdad). */}
      {Object.values(MIGRATION_PRESETS).map((p) => {
        const coords = PRESET_COORDS[p.id];
        if (!coords) return null;

        return (
          <Marker
            key={p.id}
            position={coords}
            icon={getCountryPinIcon(p)}
            title={p.destinationCountry}
            eventHandlers={{ click: () => onApplyPreset?.(p.id) }}
          >
            <Popup>
              <div style={{ padding: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 16,
                    fontWeight: 700
                  }}
                >
                  <span>{p.flag}</span>
                  <span>{p.destinationCountry}</span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#0284c7",
                    fontWeight: 600,
                    marginTop: 2
                  }}
                >
                  {p.visaType}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Límite legal: <strong>{p.totalAllowedDays} días</strong>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  {p.legal?.summary}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Ruta de vuelo Lima → Bogotá (entre países publicados) */}
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

// Memoizado: todas las props son primitivas o callbacks estables de
// useGeoTracking. El mapa solo re-renderiza cuando cambia un DATO real
// (presetId, capa, posición, vuelo) — nunca por renders ajenos.
export default memo(Map);
