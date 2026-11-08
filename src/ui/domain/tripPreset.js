import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";

export function getTripPreset({ presetId, destinationCountry, visaType }) {
  if (!Object.hasOwn(MIGRATION_PRESETS, presetId)) return null;
  const preset = MIGRATION_PRESETS[presetId];
  if (destinationCountry && destinationCountry !== preset.destinationCountry) return null;
  const legacyExchange = presetId === "colombia_intercambio" &&
    visaType === "Estudiante de Intercambio (PIP-2)";
  return !visaType || visaType === preset.visaType || legacyExchange ? preset : null;
}
