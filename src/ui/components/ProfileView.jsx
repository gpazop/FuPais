// ========================================================
// FUPAIS — ProfileView (vista Perfil)
// Resumen del viaje en formato "pasaporte" (usa el diseño heredado
// .passport-card con marca de agua, sello y línea MRZ) + ficha de
// métricas (reutiliza .gps-hud-card / .telemetry-*). Solo lectura:
// la edición del viaje vive en ConfigModal (Ajustar Fechas).
// ========================================================

import { formatDateISO, formatDatePretty } from "../../domain/dates.js";

export default function ProfileView({ state, metrics, preset, onOpenConfig }) {
  if (!state || !metrics) return null;

  const resolved = metrics.resolvedProcedures || [];
  const done = resolved.filter((p) => p.done).length;
  const total = resolved.length;
  const mrz = `FUPAIS<<${(state.destinationCountry || "")
    .toUpperCase()
    .replace(/\s+/g, "")}<<ING:${formatDateISO(
    metrics.entryDate
  )}<VENC:${formatDateISO(metrics.expiryDate)}<D:${metrics.daysAbroad}/${
    state.allowedDays
  }`;

  return (
    <div className="profile-view-container">
      {/* Tarjeta pasaporte */}
      <div className="passport-card">
        <div className="passport-watermark" aria-hidden="true">
          {preset?.countryCode || "CO"}
        </div>
        <div className="passport-stamp-seal">
          {metrics.statusBadge?.urgent ? "Atención" : "Vigente"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Perfil del Viajero · FuPais
        </div>
        <h2 style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 700 }}>
          {preset?.flag} {state.destinationCountry}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.85 }}>
          {state.visaType}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>
          Origen: {state.originCountry} · Ingreso:{" "}
          {formatDatePretty(metrics.entryDate)}
        </p>
        <div className="passport-mrz-code">{mrz}</div>
      </div>

      {/* Ficha de estancia */}
      <div className="gps-hud-card" aria-label="Resumen de estancia">
        <div className="telemetry-row">
          <span className="telemetry-label">Estado migratorio</span>
          <span
            className={`badge ${metrics.statusBadge?.type || "badge-soft"}`}
            style={{ fontSize: 11 }}
          >
            {metrics.statusBadge?.label}
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">Días fuera de tu país</span>
          <span className="telemetry-value">
            {metrics.daysAbroad} / {state.allowedDays}
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">Vencimiento legal</span>
          <span className="telemetry-value" style={{ fontSize: 12 }}>
            {formatDatePretty(metrics.expiryDate)} ({metrics.daysRemaining}{" "}
            días)
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">Trámites completados</span>
          <span className="telemetry-value">
            {done} de {total}
          </span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">Normativa activa</span>
          <span className="telemetry-value" style={{ fontSize: 12 }}>
            {preset
              ? `${preset.flag} ${preset.destinationCountry} — ${preset.visaType}`
              : "—"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onOpenConfig?.()}
        >
          Ajustar fechas del viaje
        </button>
      </div>
    </div>
  );
}
