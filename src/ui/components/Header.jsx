// ========================================================
// FUPAIS — Header (barra superior)
// Brand, selector de normativa, badge de estado, disparador de
// configuración y acceso móvil a Búsqueda (Spotlight).
// Accesible: landmark <header> y etiquetas asociadas.
// ========================================================

import Badge from "./Badge.jsx";
import PresetSelector from "./PresetSelector.jsx";

export default function Header({
  presetId,
  onPresetChange,
  onOpenConfig,
  onOpenSearch,
  onGoHome,
  statusBadge
}) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <button type="button" className="brand-logo brand-home" aria-label="FuPais, ir a Inicio" onClick={onGoHome}>
          <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <path d="M15 48V16h21M15 30h15m7 3v9a6 6 0 0 0 12 0V30m-5 4 5-5 5 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="brand-title-row">
            <h1 className="brand-title">FuPais</h1>
            <Badge variant="solid">v2.0</Badge>
          </div>
          <p className="brand-subtitle">
            Control de días fuera de tu país, prórrogas y alertas legales
          </p>
        </div>
      </div>

      <div className="header-actions">
        <PresetSelector
          value={presetId}
          onChange={onPresetChange}
          label="Normativa de país de destino"
        />

        <div className="header-buttons">
          <button
            type="button"
            className="btn btn-outline btn-sm header-mobile-only"
            onClick={onOpenSearch}
            aria-label="Buscar países, trámites o fechas"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Buscar
          </button>

          <button
            id="btn-open-config"
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenConfig}
            aria-label="Ajustar fechas y perfil de viaje"
          >
            Ajustar Fechas
          </button>
        </div>

        <div
          id="header-status-badge"
          className={`badge ${statusBadge?.type ?? "badge-solid"}`}
          title={statusBadge?.detailMessage ?? undefined}
        >
          <span className="badge-dot" aria-hidden="true"></span>
          {statusBadge?.label ?? "Verificando..."}
        </div>

      </div>
    </header>
  );
}
