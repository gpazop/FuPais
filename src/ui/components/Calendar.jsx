// ========================================================
// FUPAIS — Calendar (Sprint 4)
// Calendario de estancia 100% declarativo: reemplaza a FuPaisCalendar
// (innerHTML completo por setData → parpadeo y pérdida de foco) y a
// CalendarWrapper. La lógica de grilla vive en ui/domain/monthGrid.js
// (pura, testeada); este componente solo la renderiza.
//
// Mejoras honestas sobre el vanilla:
//   - La vista NO vuelve a "salto" al mes de hoy en cada cambio de
//     métricas (antes setData() reseteaba la vista); solo se sincroniza
//     cuando cambia el MES de hoy (y el botón "Hoy" siempre vuelve).
//   - Celdas activas con role="button" + teclado (Enter/Espacio).
//   - Cero innerHTML: los títulos de trámites/eventos son texto React
//     (el vanilla los inyectaba crudos en el HTML).
// ========================================================

import { useEffect, useMemo, useState } from "react";
import { buildMonthGrid, MONTH_NAMES } from "../domain/monthGrid.js";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_OFFSETS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

function monthKeyOf(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function Calendar({ metrics, customEvents = [], onDateSelect }) {
  const [view, setView] = useState(() =>
    metrics?.today
      ? { year: metrics.today.getFullYear(), month: metrics.today.getMonth() }
      : { year: new Date().getFullYear(), month: new Date().getMonth() }
  );
  const [focusedDate, setFocusedDate] = useState(null);

  // Sincroniza la vista SOLO cuando cambia el mes de "hoy" (no en
  // cada recomputación de métricas — corrige el salto del vanilla).
  const todayMonthKey = metrics?.today ? monthKeyOf(metrics.today) : null;
  useEffect(() => {
    if (todayMonthKey === null) return;
    setView((prev) => {
      const [year, month] = todayMonthKey.split("-").map(Number);
      return prev.year === year && prev.month === month
        ? prev
        : { year, month };
    });
  }, [todayMonthKey]);

  const grid = useMemo(
    () =>
      metrics
        ? buildMonthGrid({
            year: view.year,
            month: view.month,
            metrics,
            customEvents
          })
        : null,
    [view, metrics, customEvents]
  );

  if (!metrics || !grid) return null;

  const firstDay = grid.cells.find((cell) => !cell.muted);
  const entryDate = grid.cells.find((cell) => !cell.muted && cell.dateISO === focusedDate)
    ?? grid.cells.find((cell) => cell.classes.includes("day-today"))
    ?? firstDay;

  const goToToday = () => {
    if (metrics.today) {
      setView({
        year: metrics.today.getFullYear(),
        month: metrics.today.getMonth()
      });
    } else {
      const now = new Date();
      setView({ year: now.getFullYear(), month: now.getMonth() });
    }
  };

  const prevMonth = () =>
    setView((prev) =>
      prev.month === 0
        ? { year: prev.year - 1, month: 11 }
        : { ...prev, month: prev.month - 1 }
    );

  const nextMonth = () =>
    setView((prev) =>
      prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { ...prev, month: prev.month + 1 }
    );

  return (
    <div className="calendar-wrapper">
      <div className="calendar-topbar">
        <div className="calendar-nav">
          <h3 className="calendar-month-title">{grid.monthTitle}</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={prevMonth}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="btn btn-outline btn-sm" onClick={goToToday}>
            Hoy
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={nextMonth}
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-box box-abroad"></span> Fuera del país
          </span>
          <span className="legend-item">
            <span className="legend-box box-prorroga"></span> Ventana Óptima
          </span>
          <span className="legend-item">
            <span className="legend-box box-risk"></span> Riesgo Demora (5d)
          </span>
          <span className="legend-item">
            <span className="legend-box box-deadline"></span> Vencimiento Legal
          </span>
        </div>
      </div>

      <div className="calendar-grid-header">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days-grid" role="group"
        aria-label="Días del mes. Usa las flechas para recorrer las fechas.">
        {grid.cells.map((cell, index) =>
          cell.muted ? (
            <div
              key={`muted-${index}`}
              className={cell.classes.join(" ")}
              aria-hidden="true"
            >
              <div className="cal-day-top">
                <span className="cal-day-num">{cell.dayNum}</span>
              </div>
            </div>
          ) : (
            <div
              key={cell.dateISO}
              className={cell.classes.join(" ")}
              data-date={cell.dateISO}
              role="button"
              tabIndex={cell === entryDate ? 0 : -1}
              aria-current={cell.classes.includes("day-today") ? "date" : undefined}
              onFocus={() => setFocusedDate(cell.dateISO)}
              aria-label={`${cell.dayNum} de ${grid.monthTitle}${
                cell.counter ? ` — ${cell.counter.text}` : ""
              }`}
              onClick={() => onDateSelect?.(cell.dateISO)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDateSelect?.(cell.dateISO);
                }
                const offset = DAY_OFFSETS[e.key];
                if (offset) {
                  e.preventDefault();
                  const target = e.currentTarget.parentElement.children[index + offset];
                  if (target?.hasAttribute("data-date")) target.focus();
                }
              }}
            >
              <div className="cal-day-top">
                <span className="cal-day-num">{cell.dayNum}</span>
                {cell.counter ? (
                  <span
                    className={
                      cell.counter.ember
                        ? "cal-day-counter counter-ember"
                        : "cal-day-counter"
                    }
                  >
                    {cell.counter.text}
                  </span>
                ) : null}
              </div>
              {cell.procedures.length > 0 || cell.events.length > 0 ? (
                <div className="cal-day-events">
                  {cell.procedures.map((proc, i) => (
                    <span
                      key={`proc-${i}`}
                      className={`cal-event-pill ${
                        proc.urgent ? "pill-ember" : "pill-dark"
                      }`}
                      title={proc.title}
                    >
                      ★ {proc.title}
                    </span>
                  ))}
                  {cell.events.map((ev, i) => (
                    <span
                      key={`ev-${i}`}
                      className="cal-event-pill pill-gray"
                      title={ev.title}
                    >
                      • {ev.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
}
