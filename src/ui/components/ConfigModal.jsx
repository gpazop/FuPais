import { useState } from "react";
import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";
import { getTripPreset } from "../domain/tripPreset.js";
import { getCountryRule } from "../../data/presets.js";
import { addDays, formatDateISO, formatDatePretty, parseDate } from "../../domain/dates.js";
import { useDialogFocus } from "../hooks/useDialogFocus.js";
import CountrySelect, { normalizeCountry } from "./CountrySelect.jsx";

export default function ConfigModal({ trip, onClose, onSubmit }) {
  const [draft, setDraft] = useState(() => ({
    presetId: trip.presetId,
    entryDateStr: trip.entryDateStr,
    allowedDays: trip.allowedDays,
    originCountry: normalizeCountry(trip.originCountry ?? getTripPreset(trip)?.originCountry),
    destinationCountry: normalizeCountry(trip.destinationCountry ?? getTripPreset(trip)?.destinationCountry),
    visaType: trip.visaType ?? getTripPreset(trip)?.visaType ?? ""
  }));
  const [error, setError] = useState("");
  const dialogRef = useDialogFocus(true, onClose);
  const matchingPreset = getTripPreset({ ...draft, visaType: draft.visaType.trim() });
  const rule = matchingPreset && getCountryRule(matchingPreset.countryCode, matchingPreset.stayType);
  const previousLimit = matchingPreset?.id === getTripPreset(trip)?.id ? Number(trip.allowedDays) : 0;
  const maxDays = Math.max(previousLimit, rule?.maxDaysInWindow ?? rule?.allowedDays ?? 3650);
  const days = Number(draft.allowedDays);
  const entry = parseDate(draft.entryDateStr);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(draft.entryDateStr) &&
    Number.isFinite(entry.getTime()) && formatDateISO(entry) === draft.entryDateStr;
  const registeredExtension = matchingPreset?.id === trip.presetId
    ? matchingPreset?.procedures.find((procedure) =>
      procedure.isExtensionAction && trip.completedProcedures?.[procedure.id]
    )?.extendsDays ?? 0
    : 0;
  const minDays = registeredExtension + 1;
  const validDays = Number.isInteger(days) && days >= minDays && days <= maxDays;

  function change(field, value) {
    setError("");
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function selectPreset(id) {
    const next = MIGRATION_PRESETS[id];
    setError("");
    setDraft((previous) => ({
      ...previous,
      presetId: id || null,
      ...(next && {
        destinationCountry: next.destinationCountry,
        visaType: next.visaType,
        allowedDays: next.totalAllowedDays
      })
    }));
  }

  function submit(event) {
    event.preventDefault();
    if (!validDate || !validDays || !draft.originCountry || !draft.destinationCountry || !draft.visaType.trim()) {
      setError("Selecciona ambos países e indica una fecha, un tipo de estancia y una duración válidos.");
      return;
    }
    onSubmit({
      presetId: matchingPreset?.id ?? null,
      originCountry: draft.originCountry,
      destinationCountry: draft.destinationCountry,
      visaType: draft.visaType.trim(),
      entryDateStr: draft.entryDateStr,
      allowedDays: days
    });
  }

  return (
    <div className="modal-overlay active" id="config-modal">
      <div className="modal-card" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="config-modal-title" tabIndex={-1}>
        <div className="modal-header">
          <h3 id="config-modal-title" className="text-heading-sm">Ajustar Fechas y Perfil de Viaje</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <form id="form-config-trip" onSubmit={submit}>
          <div className="trip-form">
            <div className="input-group">
              <label className="input-label" htmlFor="config-preset-select">Normativa de país de destino</label>
              <select className="select" id="config-preset-select" value={matchingPreset?.id ?? ""} onChange={(event) => selectPreset(event.target.value)}>
                <option value="">Estancia manual</option>
                {Object.values(MIGRATION_PRESETS).map((item) => (
                  <option key={item.id} value={item.id}>{item.destinationCountry} — {item.visaType}</option>
                ))}
              </select>
            </div>
            <div className="form-fields">
              <CountrySelect id="config-origin" label="País de origen" value={draft.originCountry} onChange={(value) => change("originCountry", value)} required />
              <CountrySelect id="config-destination" label="País de destino" value={draft.destinationCountry} onChange={(value) => change("destinationCountry", value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="config-visa">Tipo de estancia o visado</label>
              <input className="input" id="config-visa" required maxLength={100} value={draft.visaType} onChange={(event) => change("visaType", event.target.value)} />
            </div>
            <div className="form-fields">
              <div className="input-group">
                <label className="input-label" htmlFor="config-entry-date">Fecha de ingreso</label>
                <input className="input" id="config-entry-date" type="date" required value={draft.entryDateStr} onChange={(event) => change("entryDateStr", event.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="config-duration">Duración autorizada (días)</label>
                <input className="input" id="config-duration" type="number" required min={minDays} max={maxDays} step={1} value={draft.allowedDays} onChange={(event) => change("allowedDays", event.target.value)} />
              </div>
            </div>
            {registeredExtension > 0 && <p>La duración incluye una prórroga registrada de {registeredExtension} días.</p>}
            {matchingPreset ? (
              <p>Duración inicial sugerida por el preset: {matchingPreset.totalAllowedDays} días.</p>
            ) : (
              <p>Normativa automática no disponible para esta estancia. El conteo usará las fechas y la duración que confirmes.</p>
            )}
            {validDate && validDays && (
              <p>Fin del periodo calculado: {formatDatePretty(addDays(entry, days - 1))}. La llegada cuenta como Día 1.</p>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar y recalcular</button>
          </div>
        </form>
      </div>
    </div>
  );
}
