// ========================================================
// FUPAIS — monthGrid (Sprint 4)
// Utilidad PURA de grilla mensual del calendario de estancia.
// Extrae la lógica de _renderDayCells de FuPaisCalendar (clase
// vanilla eliminada en este sprint) a un módulo sin DOM, testeable
// con Vitest — mismo espíritu que domain/dates.js.
//
// Convención de la app: conteo inclusivo, el día de llegada es el
// Día 1 (entryDate + differenceInDays + 1).
// Semana: lunes-indexada (Lun…Dom), paridad con el original.
// ========================================================

import { differenceInDays, formatDateISO } from "../../domain/dates.js";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

/**
 * Construye la grilla de un mes como DATOS (sin HTML).
 *
 * @param {object} args
 * @param {number} args.year           Año de la vista.
 * @param {number} args.month          Mes 0-based de la vista.
 * @param {object} args.metrics        Salida de buildDashboard() (fechas Date a medianoche local).
 * @param {Array}  args.customEvents   Eventos personales `{ id, title, date: 'YYYY-MM-DD' }`.
 * @returns {{ monthTitle: string, cells: Array }} Celdas con clases CSS, contador de estancia, trámites y eventos.
 */
export function buildMonthGrid({ year, month, metrics, customEvents = [] }) {
  const {
    entryDate,
    expiryDate,
    today,
    prorrogaWindowStartDate,
    safeDeadlineDate,
    resolvedProcedures
  } = metrics;

  const firstDayOfMonth = new Date(year, month, 1);
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Domingo pasa al final
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const mutedCell = (dayNum) => ({
    muted: true,
    dayNum,
    dateISO: null, // sin data-date → NO clicable (paridad con el original)
    classes: ["cal-day", "day-muted"],
    counter: null,
    procedures: [],
    events: []
  });

  const cells = [];

  // 1. Días de cola del mes anterior.
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push(mutedCell(daysInPrevMonth - i));
  }

  // 2. Días del mes actual.
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const cellDate = new Date(year, month, dayNum);
    const time = cellDate.getTime();
    const isToday = time === today.getTime();
    const isAbroad = cellDate >= entryDate && cellDate <= expiryDate;
    const isDeadline = time === expiryDate.getTime();
    const isProrrogaWindow =
      !metrics.manual && cellDate >= prorrogaWindowStartDate && cellDate <= safeDeadlineDate;
    const isRiskWindow = !metrics.manual && cellDate > safeDeadlineDate && cellDate <= expiryDate;

    // Contador de estancia: día de llegada = Día 1.
    const daysSinceEntry =
      cellDate >= entryDate ? differenceInDays(cellDate, entryDate) + 1 : null;

    const procedures = (resolvedProcedures || []).filter((p) => {
      if (!p.targetDate) return false;
      return (
        p.targetDate.getFullYear() === year &&
        p.targetDate.getMonth() === month &&
        p.targetDate.getDate() === dayNum
      );
    });

    const iso = formatDateISO(cellDate);
    const events = customEvents.filter((ev) => ev.date === iso);

    const classes = ["cal-day"];
    if (isAbroad) classes.push("day-abroad");
    if (isProrrogaWindow) classes.push("day-prorroga-window");
    if (isRiskWindow) classes.push("day-prorroga-urgent");
    if (isToday) classes.push("day-today");
    if (isDeadline) classes.push("day-deadline");

    let counter = null;
    if (isDeadline) {
      counter = { text: "LÍMITE", ember: true };
    } else if (daysSinceEntry !== null && daysSinceEntry > 0 && isAbroad) {
      counter = { text: `Día ${daysSinceEntry}`, ember: false };
    }

    cells.push({
      muted: false,
      dayNum,
      dateISO: iso,
      classes,
      counter,
      procedures,
      events
    });
  }

  // 3. Días de cabeza del mes siguiente para completar la última fila.
  const totalFilled = startDayOfWeek + daysInMonth;
  const remainingToComplete = (7 - (totalFilled % 7)) % 7;
  for (let j = 1; j <= remainingToComplete; j++) {
    cells.push(mutedCell(j));
  }

  return { monthTitle: `${MONTH_NAMES[month]} ${year}`, cells };
}

export { MONTH_NAMES };
