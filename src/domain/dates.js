/**
 * Helpers de fechas (puros, sin DOM) — testables con Vitest.
 *
 * Convención de la app: conteo inclusivo. El día de llegada es el Día 1,
 * por lo que con N días autorizados el último día legal es llegada + (N - 1).
 */

/** Convierte 'YYYY-MM-DD' a Date local (medianoche). Sin argumento devuelve hoy. */
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Date → 'YYYY-MM-DD' (hora local, sin zona horaria). */
export function formatDateISO(date) {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

/** 'YYYY-MM-DD' → '17 jul 2026' (formato corto en español). */
export function formatDateSpanish(dateStr) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Días naturales entre dos Dates (date2 - date1). Ambos a medianoche local. */
export function getDaysDifference(date1, date2) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

/** 'YYYY-MM-DD' + N días → 'YYYY-MM-DD'. */
export function addDaysToDate(dateStr, days) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + Number(days));
  return formatDateISO(d);
}

/**
 * Último día legal de estancia (conteo inclusivo: el día de llegada es el Día 1).
 * Ej.: llegada 01/01 + 90 días autorizados => último día legal 31/03 (no 01/04).
 */
export function getLastAllowedDate(arrivalStr, allowedDays) {
  const days = Math.max(1, Number(allowedDays) || 365);
  return addDaysToDate(arrivalStr, days - 1);
}
