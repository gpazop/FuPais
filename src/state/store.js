// ========================================================
// FUPAIS — STATE STORE (Fase 2)
// Única fuente de verdad del estado persistente de la app.
// La UI nunca toca el puerto de persistencia directamente:
// pasa por loadState()/saveState() de este módulo.
//
// Invariantes del plan de fusión:
//   - El vencimiento SIEMPRE se deriva de { entryDateStr, allowedDays };
//     nunca se guarda. `normalizeState()` elimina el campo legacy al leer.
//   - La persistencia pasa por `services/storage.js` (puerto async),
//     no por localStorage directo.
// ========================================================

import { storage } from "../services/storage.js";
import {
  formatDateISO,
  parseDate,
  addDays,
  differenceInDays
} from "../domain/dates.js";

export const STORAGE_KEY = "fupais_state_v2";

export function defaultState() {
  // Caso real del usuario: Estudiante de intercambio en Colombia (ej. Universidad Santo Tomás)
  // Lleva ~78 días de estancia de sus 90 días iniciales.
  // Faltan 12 días para el vencimiento (está exactamente en la ventana de 15 a 5 días de anticipación).
  const today = new Date();
  const entryDate = addDays(today, -78);

  return {
    presetId: "colombia_intercambio",
    entryDateStr: formatDateISO(entryDate),
    allowedDays: 90, // 90 días iniciales; el vencimiento SIEMPRE se deriva (nunca se guarda)
    originCountry: "Perú",
    destinationCountry: "Colombia",
    visaType: "Estudiante de Intercambio (PIP-2)",
    completedProcedures: {
      // IDs derivados del registro: `${presetId}-p${index + 1}`
      "colombia_intercambio-p1": true
    },
    customEvents: [
      {
        id: "ev-1",
        title: "Entrega de documentos a Oficina de Relaciones Internacionales",
        date: formatDateISO(addDays(today, 2)),
        type: "academico"
      }
    ]
  };
}

/**
 * Legacy hydrate: versiones de `fupais_state_v2` guardaban `expiryDateStr`
 * directo. La forma nueva solo guarda `{ entryDateStr, allowedDays }` — el
 * vencimiento siempre se *deriva*. Convierte el campo viejo al leer y lo
 * elimina de memoria.
 */
export function normalizeState(raw) {
  const state = { ...raw };
  if (state.expiryDateStr && state.entryDateStr && !state.allowedDays) {
    const entry = parseDate(state.entryDateStr);
    const expiry = parseDate(state.expiryDateStr);
    // Conteo inclusivo: día de llegada = Día 1.
    state.allowedDays = Math.max(1, differenceInDays(expiry, entry) + 1);
    delete state.expiryDateStr;
  }
  return state;
}

/**
 * Hydrate: lee el estado persistido (o el default si no hay) y lo normaliza.
 * Async a propósito: hoy es localStorage (sync) detrás del puerto, mañana
 * puede ser un ApiAdapter.
 */
export async function loadState() {
  const stored = await storage.get(STORAGE_KEY);
  return stored ? normalizeState(stored) : defaultState();
}

export async function saveState(state) {
  await storage.set(STORAGE_KEY, state);
}
