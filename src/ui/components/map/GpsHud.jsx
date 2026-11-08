// ========================================================
// FUPAIS — GpsHud (Sprint 3)
// Telemetría migratoria declarativa: reemplaza renderMapTelemetry y
// sus getElementById a #hud-gps-* que NUNCA existieron en el DOM
// React. Reutiliza el CSS heredado (.gps-hud-card + .telemetry-*).
// ========================================================

export default function GpsHud({ position, meta, legalZone, locating, resolving }) {
  const place = [meta.city, meta.country].filter(Boolean).join(", ");
  let location = place || "Lugar sin identificar";
  if (locating) location = "Obteniendo ubicación del dispositivo…";
  if (resolving) location = "Buscando ciudad y país…";
  return (
    <section className="gps-hud-card" aria-label="Ubicación en el mapa">
      <div className="telemetry-row">
        <span className="telemetry-label">Coordenadas</span>
        <span className="telemetry-value">
          {position.lat}°, {position.lng}°
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">Ubicación resuelta</span>
        <span className="telemetry-value" style={{ fontSize: 12 }} role="status">
          {location}
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">Fuente</span>
        <span className="telemetry-value" style={{ fontSize: 12 }}>
          {meta.accuracy}
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">País respecto al viaje</span>
        <span className="telemetry-value" style={{ fontSize: 12 }}>
          {legalZone}
        </span>
      </div>
    </section>
  );
}
