import { useDialogFocus } from "../hooks/useDialogFocus.js";
// ========================================================
// FUPAIS — ConfigModal
// Modal "Ajustar Fechas y Perfil de Viaje" como componente
// React controlado. Sustituye la manipulación directa del
// DOM en openConfigModal/handleConfigSubmit.
// ========================================================

import { useState, useEffect, useCallback } from "react";
import Badge from "./Badge.jsx";
import {
  getCountryRule,
  getStayTypeRuleKey
} from "../../data/presets.js";
import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";
import {
  formatDateISO,
  formatDatePretty,
  parseDate,
  addDays
} from "../../domain/dates.js";

export default function ConfigModal({
  open,
  onClose,
  onSubmit,
  presetId,
  onPresetChange,
  entryDateStr,
  onEntryDateChange,
  originCountry,
  onOriginCountryChange,
  destinationCountry,
  onDestinationCountryChange,
  visaType,
  onVisaTypeChange,
  allowedDays,
  onAllowedDaysChange
}) {
  const [duration, setDuration] = useState(allowedDays ?? 90);
  const [durationPreview, setDurationPreview] = useState("");

  // Rebuild duration <option>s when preset or allowedDays change
  const [durationOptions, setDurationOptions] = useState([]);

  // Al abrir el modal, la duración mostrada debe reflejar SIEMPRE el valor
  // vigente (p. ej. después de registrar una prórroga de +90 días). Sin esta
  // sincronización el modal conservaba el `allowedDays` del primer montaje y
  // "Guardar y Recalcular" podía sobrescribir una prórroga ya registrada.
  useEffect(() => {
    if (open) setDuration(allowedDays ?? 90);
  }, [open, allowedDays]);

  const rebuildDurationOptions = useCallback(() => {
    const preset = MIGRATION_PRESETS[presetId];
    if (!preset) return;
    const rule = getCountryRule(preset.countryCode, preset.stayType);
    const amounts = [];
    const pushAmount = (days, note) => {
      if (!Number.isInteger(days) || days < 1) return;
      if (!amounts.some((a) => a.days === days)) amounts.push({ days, note });
    };
    if (rule) {
      pushAmount(rule.allowedDays, "autorización inicial");
      if (rule.maxDaysInWindow) pushAmount(rule.maxDaysInWindow, "tope del periodo");
    } else {
      pushAmount(preset.totalAllowedDays, "autorización inicial");
    }
    pushAmount(allowedDays, "actual");
    amounts.sort((a, b) => a.days - b.days);
    setDurationOptions(amounts);
  }, [presetId, allowedDays]);

  useEffect(() => {
    rebuildDurationOptions();
  }, [rebuildDurationOptions]);

  // Update preview when duration or entry date change
  useEffect(() => {
    const entry = parseDate(entryDateStr);
    const days = Math.max(1, duration || 1);
    const expiry = addDays(entry, days - 1);
    setDurationPreview(
      `El permiso vencería el ${formatDatePretty(expiry)} (la llegada cuenta como Día 1).`
    );
  }, [duration, entryDateStr]);

  const dialogRef = useDialogFocus(open, onClose);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entryDateStr,
      allowedDays: duration,
      originCountry,
      destinationCountry,
      visaType
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay active" id="config-modal">
      <div className="modal-card" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="config-modal-title" tabIndex={-1}>
        <div className="modal-header">
          <h3 id="config-modal-title" className="text-heading-sm" style={{ fontSize: 20 }}>
            Ajustar Fechas y Perfil de Viaje
          </h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={onClose}
            aria-label="Cerrar"
            data-close-modal
          >
            ✕
          </button>
        </div>

        <form id="form-config-trip" onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="config-preset-select">
                Normativa de País de Destino:
              </label>
              <select
                id="config-preset-select"
                className="select"
                value={presetId}
                onChange={(e) => onPresetChange(e.target.value)}
              >
                {Object.values(MIGRATION_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.destinationCountry} — {p.visaType}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-12)" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="config-origin">País de Origen:</label>
                <input
                  type="text"
                  id="config-origin"
                  className="input"
                  required
                  value={originCountry}
                  onChange={(e) => onOriginCountryChange(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="config-destination">País de Destino:</label>
                <input
                  type="text"
                  id="config-destination"
                  className="input"
                  required
                  value={destinationCountry}
                  onChange={(e) => onDestinationCountryChange(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="config-visa">Tipo de Estancia / Visado:</label>
              <input
                type="text"
                id="config-visa"
                className="input"
                required
                value={visaType}
                onChange={(e) => onVisaTypeChange(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-12)" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="config-entry-date">Fecha de Salida / Ingreso:</label>
                <input
                  type="date"
                  id="config-entry-date"
                  className="input"
                  required
                  value={entryDateStr}
                  onChange={(e) => onEntryDateChange(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="config-duration">Duración Autorizada (días):</label>
                <select
                  id="config-duration"
                  className="select"
                  required
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                >
                  {durationOptions.map((a) => {
                    const tag =
                      a.note === "autorización inicial"
                        ? "autorización inicial"
                        : a.note === "actual"
                        ? "actual"
                        : "tope del periodo";
                    return (
                      <option key={a.days} value={a.days}>
                        {a.days} días ({tag})
                      </option>
                    );
                  })}
                </select>
                <div id="config-duration-preview" style={{ marginTop: 6, fontSize: 12, color: "var(--color-mid-gray)" }}>
                  {durationPreview}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} data-close-modal>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar y Recalcular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
