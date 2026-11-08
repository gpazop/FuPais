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
  statusBadge
}) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <div className="brand-logo" aria-hidden="true">Fu</div>
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

        {/* El color del estado lo decide `buildDashboard` (statusBadge.type):
            antes se forzaba `badge-solid`, así que un viaje vencido o en
            riesgo se pintaba igual que uno al día. */}
        <div
          id="header-status-badge"
          className={`badge ${statusBadge?.type ?? "badge-solid"}`}
          title={statusBadge?.detailMessage ?? undefined}
        >
          <span className="badge-dot" aria-hidden="true"></span>
          {statusBadge?.label ?? "Verificando..."}
        </div>

        <button
          id="btn-open-config"
          className="btn btn-outline btn-sm"
          onClick={onOpenConfig}
          aria-label="Ajustar fechas y perfil de viaje"
        >
          Ajustar Fechas
        </button>

      </div>
    </header>
  );
}
