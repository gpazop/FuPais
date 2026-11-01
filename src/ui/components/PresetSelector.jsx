// ========================================================
// FUPAIS — PresetSelector
// Selector de normativa migratoria por país. Opciones
// derivadas del registro publicado MIGRATION_PRESETS.
// Accesible: label asociado, role="combobox" implícito
// mediante <select>, y announcement de cambio.
// ========================================================

import { useEffect } from "react";
import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";

export default function PresetSelector({
  value,
  onChange,
  label = "Normativa de país de destino",
  className = ""
}) {
  useEffect(() => {
    const select = document.getElementById("preset-selector");
    if (select && select.value !== value) {
      select.value = value;
    }
  }, [value]);

  return (
    <div className={`preset-selector-wrapper ${className}`}>
      <label htmlFor="preset-selector" className="input-label">
        {label}
      </label>
      <select
        id="preset-selector"
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ maxWidth: 320, fontSize: 13 }}
        title="Seleccionar perfil de normativa migratoria"
      >
        {Object.values(MIGRATION_PRESETS).map((p) => (
          <option key={p.id} value={p.id}>
            {p.destinationCountry} — {p.visaType}
          </option>
        ))}
      </select>
    </div>
  );
}
