/**
 * Motor de reglas de permanencia (puro, sin DOM).
 *
 * Modelo: el usuario tiene una lista de viajes (estancias fuera de su país de
 * origen o dentro del país de destino, según la regla) y cada regla define una
 * ventana móvil (rolling window): "máximo N días dentro de cualquier ventana
 * de W días". Es el modelo tipo Schengen (90/180) y también aplica a varias
 * reglas latinoamericanas.
 *
 * Convenciones:
 * - Todas las fechas son strings 'YYYY-MM-DD' (hora local, sin zona horaria).
 * - El conteo de días de presencia es inclusivo en ambos extremos.
 * - Un viaje con `end: null` está en curso: para cálculos se recorta a `today`.
 */
import { parseDate } from './dates.js';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Normaliza y fusiona viajes que se solapan o son contiguos.
 * Devuelve viajes como { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } ordenados.
 * `todayStr` recorta viajes en curso (`end: null`).
 */
export function mergeTrips(trips, todayStr) {
  if (!Array.isArray(trips) || trips.length === 0) return [];
  const today = parseDate(todayStr || formatDateISOOfNow());

  const normalized = trips
    .filter(t => t && t.start)
    .map(t => {
      const start = parseDate(t.start);
      const end = t.end ? parseDate(t.end) : today;
      return start <= end ? { start, end } : { start: end, end: start };
    })
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const trip of normalized) {
    const last = merged[merged.length - 1];
    // Contiguo (end + 1 día) también se fusiona: la presencia no se interrumpe.
    if (last && trip.start <= new Date(last.end.getTime() + DAY_MS)) {
      if (trip.end > last.end) last.end = trip.end;
    } else {
      merged.push({ ...trip });
    }
  }

  return merged.map(t => ({ start: isoOf(t.start), end: isoOf(t.end) }));
}

/**
 * Días de presencia dentro del rango inclusivo [from, to].
 * Los viajes se fusionan antes de contar, así los solapes no duplican días.
 */
export function daysPresentInRange(trips, fromStr, toStr) {
  const from = parseDate(fromStr);
  const to = parseDate(toStr);
  if (from > to) return 0;

  const merged = mergeTrips(trips, toStr);
  let total = 0;
  for (const trip of merged) {
    const s = parseDate(trip.start);
    const e = parseDate(trip.end);
    const lo = s < from ? from : s;
    const hi = e > to ? to : e;
    if (lo <= hi) total += Math.round((hi - lo) / DAY_MS) + 1;
  }
  return total;
}

/**
 * Días ya usados en la ventana móvil de `windowDays` que termina en `today`
 * (inclusive). Es el número que la UI mostrará como "días consumidos".
 */
export function usedDaysInRollingWindow(trips, todayStr, windowDays = 180) {
  const today = parseDate(todayStr);
  const windowStart = new Date(today.getTime() - (windowDays - 1) * DAY_MS);
  return daysPresentInRange(trips, isoOf(windowStart), todayStr);
}

/**
 * Días usados dentro del AÑO CALENDARIO de `dateStr` (1 de enero – 31 de
 * diciembre, inclusivo en ambos extremos). Es el modelo que usan reglas como
 * Colombia: "máximo 180 días continuos o discontinuos dentro del año calendario".
 */
export function usedDaysInCalendarYear(trips, dateStr) {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  return daysPresentInRange(trips, `${year}-01-01`, `${year}-12-31`);
}

/**
 * Máximo de días que puede durar un NUEVO viaje que empieza en `start`
 * sin exceder `maxDays` según el tipo de ventana:
 *
 * - 'rolling' (por defecto, tipo Schengen): ninguna ventana móvil de
 *   `windowDays` días puede superar `maxDays`.
 * - 'calendar-year' (tipo Colombia): dentro de cada año calendario (1 ene –
 *   31 dic) no se puede superar `maxDays`. La ventana se reinicia el 1 de
 *   enero de cada año.
 *
 * Simula día a día: el viaje puede incluir el día d solo si el total de
 * presencia en la ventana de ese día (incluyendo ese día) no supera maxDays.
 * Devuelve el número de días del nuevo viaje (0 si ni siquiera puede entrar).
 * `horizonDays` acota la simulación (techo del resultado).
 */
export function maxDaysForNewTrip({ trips, start, windowDays = 180, maxDays = 90, horizonDays = 365, today, windowType = 'rolling' }) {
  const startStr = start;
  const existing = mergeTrips(trips, today);
  const allStarts = [parseDate(startStr), ...existing.map(t => parseDate(t.start))];
  const epoch = new Date(Math.min(...allStarts.map(d => d.getTime())));

  // Índices de día (enteros) con presencia de los viajes existentes.
  const present = new Set();
  for (const t of existing) {
    const s = Math.round((parseDate(t.start) - epoch) / DAY_MS);
    const e = Math.round((parseDate(t.end) - epoch) / DAY_MS);
    for (let i = s; i <= e; i++) present.add(i);
  }

  // Inicio de la ventana que aplica a cada día simulado.
  const windowStartIdx = (dayIdx, dayEpochMs) => {
    if (windowType === 'calendar-year') {
      const dayIso = isoOf(new Date(dayEpochMs));
      return Math.round((parseDate(`${dayIso.slice(0, 4)}-01-01`) - epoch) / DAY_MS);
    }
    return dayIdx - windowDays + 1;
  };

  const startIdx = Math.round((parseDate(startStr) - epoch) / DAY_MS);
  let added = 0;

  for (let d = startIdx; d < startIdx + horizonDays; d++) {
    // Presencia en la ventana de este día, contando el día d del nuevo viaje.
    let count = 1; // el día d del nuevo viaje
    const windowStart = windowStartIdx(d, epoch.getTime() + d * DAY_MS);
    for (let w = windowStart; w <= d - 1; w++) {
      if (present.has(w)) count++;
    }
    if (count > maxDays) break;
    present.add(d);
    added++;
  }

  return added;
}

// --- internals ---

function isoOf(date) {
  const month = '' + (date.getMonth() + 1);
  const day = '' + date.getDate();
  return [date.getFullYear(), month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

function formatDateISOOfNow() {
  return isoOf(new Date());
}
