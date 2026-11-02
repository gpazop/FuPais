// ========================================================
// FUPAIS — GpsHud (Sprint 3)
// Telemetría migratoria declarativa: reemplaza renderMapTelemetry y
// sus getElementById a #hud-gps-* que NUNCA existieron en el DOM
// React. Reutiliza el CSS heredado (.gps-hud-card + .telemetry-*).
// ========================================================

export default function GpsHud({ position, meta, legalZone, locating }) {
  return (
    <section className="gps-hud-card" aria-label="Telemetría GPS en vivo">
      <div className="telemetry-row">
        <span className="telemetry-label">Coordenadas</span>
        <span className="telemetry-value">
          {position.lat}°, {position.lng}°
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">Ubicación resuelta</span>
        <span className="telemetry-value" style={{ fontSize: 12 }}>
          {locating
            ? "Resolviendo dirección satelital..."
            : `${meta.city}, ${meta.country}`}
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">Precisión</span>
        <span className="telemetry-value" style={{ fontSize: 12 }}>
          {meta.accuracy}
        </span>
      </div>
      <div className="telemetry-row">
        <span className="telemetry-label">Zona legal</span>
        <span className="telemetry-value" style={{ fontSize: 12 }}>
          {legalZone}
        </span>
      </div>
    </section>
  );
}
