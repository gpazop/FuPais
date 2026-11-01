// ========================================================
// FUPAIS — Header (barra superior)
// Brand, selector de normativa, badge de estado y
// disparador de configuración de fechas.
// Accesible: landmarks, labels asociados.
// ========================================================

import Badge from "./Badge.jsx";
import PresetSelector from "./PresetSelector.jsx";

export default function Header({
  presetId,
  onPresetChange,
  onOpenConfig,
  statusBadge
}) {
  return (
    <header className="header-bar">
      <div className="brand-section">
        <div className="brand-logo" aria-label="Logo FuPais">Fu</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 className="brand-title">FuPais</h1>
            <Badge variant="solid">v2.0</Badge>
          </div>
          <p className="brand-subtitle">
            Gestión de estancia en el exterior, prórrogas y alertas legales
            oficiales
          </p>
        </div>
      </div>

      <div className="header-actions">
        <PresetSelector
          value={presetId}
          onChange={onPresetChange}
          label="Normativa de país de destino"
        />
        <div id="header-status-badge" className="badge badge-solid">
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
