// ========================================================
// FUPAIS — SettingsPanel (vista Configuración)
// Panel de ajustes del dock 100% controlado: recibe settings de
// useDockSettings (hidratados de la clave legacy) y emite parches
// via onChange. La persistencia es automática (efecto del hook).
// Marcado con el CSS heredado: .settings-group/.settings-row +
// .segmented-control + .ios-switch (todo ya diseñado, cero CSS nuevo).
// ========================================================

const POSITIONS = [
  { key: "bottom", label: "Abajo" },
  { key: "left", label: "Izquierda" },
  { key: "top", label: "Arriba" }
];

const THEMES = [
  { key: "light", label: "Claro" },
  { key: "dark", label: "Oscuro" }
];

function SettingsRow({ title, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-info">
        <span className="settings-title">{title}</span>
        {desc ? <span className="settings-desc">{desc}</span> : null}
      </div>
      {children}
    </div>
  );
}

function IosSwitch({ checked, onChange, label }) {
  return (
    <label className="ios-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={label}
      />
      <span className="ios-slider"></span>
    </label>
  );
}

export default function SettingsPanel({ settings, onChange }) {
  return (
    <div className="settings-view-container">
      <div>
        <h2 className="text-heading-sm" style={{ margin: 0 }}>
          Configuración del Sistema
        </h2>
        <p
          className="text-caption"
          style={{ textTransform: "none", marginTop: 2 }}
        >
          Los ajustes se guardan automáticamente en tu navegador.
        </p>
      </div>

      <div className="settings-group">
        <SettingsRow
          title="Posición del Dock"
          desc="Dónde anclar la barra de navegación flotante"
        >
          <div
            className="segmented-control"
            role="group"
            aria-label="Posición del dock"
          >
            {POSITIONS.map((pos) => (
              <button
                key={pos.key}
                className={
                  settings.position === pos.key
                    ? "segment-btn active"
                    : "segment-btn"
                }
                onClick={() => onChange?.({ position: pos.key })}
                aria-pressed={settings.position === pos.key}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          title="Tema de la interfaz"
          desc="Blueprint claro u oscuro"
        >
          <div
            className="segmented-control"
            role="group"
            aria-label="Tema de la interfaz"
          >
            {THEMES.map((theme) => (
              <button
                key={theme.key}
                className={
                  settings.theme === theme.key
                    ? "segment-btn active"
                    : "segment-btn"
                }
                onClick={() => onChange?.({ theme: theme.key })}
                aria-pressed={settings.theme === theme.key}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          title="Efecto de ampliación"
          desc="Los íconos vecinos crecen al pasar el mouse sobre el dock"
        >
          <IosSwitch
            checked={Boolean(settings.magnify)}
            onChange={(v) => onChange?.({ magnify: v })}
            label="Efecto de ampliación"
          />
        </SettingsRow>

        <SettingsRow
          title="Auto-ocultar dock"
          desc="Se esconde tras 1.2s sin hover (vuelve con la señal flotante)"
        >
          <IosSwitch
            checked={Boolean(settings.autoHide)}
            onChange={(v) => onChange?.({ autoHide: v })}
            label="Auto-ocultar dock"
          />
        </SettingsRow>

        <SettingsRow
          title="Sonidos de interfaz"
          desc="Sonidos al interactuar con el Dock, la bóveda y los paneles"
        >
          <IosSwitch
            checked={Boolean(settings.soundEnabled)}
            onChange={(v) => onChange?.({ soundEnabled: v })}
            label="Sonidos de interfaz"
          />
        </SettingsRow>
      </div>
    </div>
  );
}
