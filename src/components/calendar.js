// ========================================================
// FUPAIS — CALENDAR RENDERER & INTERACTION
// ========================================================

import { formatDatePretty, differenceInDays, formatDateISO } from "../domain/dates.js";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export class FuPaisCalendar {
  constructor(containerElement, onDaySelectCallback) {
    this.container = containerElement;
    this.onDaySelect = onDaySelectCallback;
    this.currentViewDate = new Date();
    this.metrics = null;
    this.customEvents = [];
  }

  setData(metrics, customEvents = []) {
    this.metrics = metrics;
    this.customEvents = customEvents;
    // Default to the month of today or entry date
    if (metrics && metrics.today) {
      this.currentViewDate = new Date(metrics.today.getFullYear(), metrics.today.getMonth(), 1);
    }
    this.render();
  }

  nextMonth() {
    this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
    this.render();
  }

  prevMonth() {
    this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
    this.render();
  }

  goToToday() {
    if (this.metrics && this.metrics.today) {
      this.currentViewDate = new Date(this.metrics.today.getFullYear(), this.metrics.today.getMonth(), 1);
    } else {
      this.currentViewDate = new Date();
    }
    this.render();
  }

  render() {
    if (!this.container || !this.metrics) return;

    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of week: 0 = Sun, 1 = Mon, ... We want Monday as index 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    // Total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Build header bar
    const html = `
      <div class="calendar-wrapper">
        <div class="calendar-topbar">
          <div class="calendar-nav">
            <h3 class="calendar-month-title">${MONTH_NAMES[month]} ${year}</h3>
            <button class="btn btn-outline btn-sm" id="cal-prev-btn" title="Mes anterior">
              <svg class="icon" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="btn btn-outline btn-sm" id="cal-today-btn">Hoy</button>
            <button class="btn btn-outline btn-sm" id="cal-next-btn" title="Mes siguiente">
              <svg class="icon" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-box box-abroad"></span> Fuera del país</span>
            <span class="legend-item"><span class="legend-box box-prorroga"></span> Ventana Óptima</span>
            <span class="legend-item"><span class="legend-box box-risk"></span> Riesgo Demora (5d)</span>
            <span class="legend-item"><span class="legend-box box-deadline"></span> Vencimiento Legal</span>
          </div>
        </div>

        <div class="calendar-grid-header">
          <div class="calendar-day-header">Lun</div>
          <div class="calendar-day-header">Mar</div>
          <div class="calendar-day-header">Mié</div>
          <div class="calendar-day-header">Jue</div>
          <div class="calendar-day-header">Vie</div>
          <div class="calendar-day-header">Sáb</div>
          <div class="calendar-day-header">Dom</div>
        </div>

        <div class="calendar-days-grid" id="cal-days-grid">
          ${this._renderDayCells(year, month, startDayOfWeek, daysInMonth, daysInPrevMonth)}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._attachEvents();
  }

  _renderDayCells(year, month, startDayOfWeek, daysInMonth, daysInPrevMonth) {
    let cellsHtml = "";
    const {
      entryDate,
      expiryDate,
      today,
      prorrogaWindowStartDate,
      safeDeadlineDate,
      prorrogaWindowEndDate,
      resolvedProcedures
    } = this.metrics;

    // 1. Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDateNum = daysInPrevMonth - i;
      cellsHtml += `
        <div class="cal-day day-muted">
          <div class="cal-day-top">
            <span class="cal-day-num">${prevDateNum}</span>
          </div>
        </div>
      `;
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDate = new Date(year, month, dayNum);
      const isToday = cellDate.getTime() === today.getTime();
      const isAbroad = cellDate >= entryDate && cellDate <= expiryDate;
      const isDeadline = cellDate.getTime() === expiryDate.getTime();
      const isProrrogaWindow = cellDate >= prorrogaWindowStartDate && cellDate <= safeDeadlineDate;
      const isRiskWindow = cellDate > safeDeadlineDate && cellDate <= expiryDate;

      // Day counter: how many days abroad by this date
      const daysSinceEntry = cellDate >= entryDate ? differenceInDays(cellDate, entryDate) + 1 : null;

      // Check if procedures occur on this day
      const dayProcedures = resolvedProcedures.filter(p => {
        if (!p.targetDate) return false;
        return p.targetDate.getFullYear() === cellDate.getFullYear() &&
               p.targetDate.getMonth() === cellDate.getMonth() &&
               p.targetDate.getDate() === cellDate.getDate();
      });

      // Check custom events
      const dayCustomEvents = this.customEvents.filter(ev => {
        return ev.date === formatDateISO(cellDate);
      });

      // Construct CSS classes
      const classes = ["cal-day"];
      if (isAbroad) classes.push("day-abroad");
      if (isProrrogaWindow) classes.push("day-prorroga-window");
      if (isRiskWindow) classes.push("day-prorroga-urgent");
      if (isToday) classes.push("day-today");
      if (isDeadline) classes.push("day-deadline");

      // Badge for counter
      let counterHtml = "";
      if (isDeadline) {
        counterHtml = `<span class="cal-day-counter counter-ember">LÍMITE</span>`;
      } else if (daysSinceEntry !== null && daysSinceEntry > 0 && isAbroad) {
        counterHtml = `<span class="cal-day-counter">Día ${daysSinceEntry}</span>`;
      }

      // Event Pills inside cell
      let eventsHtml = "";
      if (dayProcedures.length > 0 || dayCustomEvents.length > 0) {
        eventsHtml += `<div class="cal-day-events">`;
        dayProcedures.forEach(proc => {
          const pillClass = proc.urgent ? "pill-ember" : "pill-dark";
          eventsHtml += `<span class="cal-event-pill ${pillClass}" title="${proc.title}">★ ${proc.title}</span>`;
        });
        dayCustomEvents.forEach(ev => {
          eventsHtml += `<span class="cal-event-pill pill-gray" title="${ev.title}">• ${ev.title}</span>`;
        });
        eventsHtml += `</div>`;
      }

      cellsHtml += `
        <div class="${classes.join(" ")}" data-date="${formatDateISO(cellDate)}">
          <div class="cal-day-top">
            <span class="cal-day-num">${dayNum}</span>
            ${counterHtml}
          </div>
          ${eventsHtml}
        </div>
      `;
    }

    // 3. Next month leading days to complete full grid row
    const totalFilled = startDayOfWeek + daysInMonth;
    const remainingToComplete = (7 - (totalFilled % 7)) % 7;
    for (let j = 1; j <= remainingToComplete; j++) {
      cellsHtml += `
        <div class="cal-day day-muted">
          <div class="cal-day-top">
            <span class="cal-day-num">${j}</span>
          </div>
        </div>
      `;
    }

    return cellsHtml;
  }

  _attachEvents() {
    const prevBtn = this.container.querySelector("#cal-prev-btn");
    const nextBtn = this.container.querySelector("#cal-next-btn");
    const todayBtn = this.container.querySelector("#cal-today-btn");

    if (prevBtn) prevBtn.addEventListener("click", () => this.prevMonth());
    if (nextBtn) nextBtn.addEventListener("click", () => this.nextMonth());
    if (todayBtn) todayBtn.addEventListener("click", () => this.goToToday());

    const days = this.container.querySelectorAll(".cal-day[data-date]");
    days.forEach(dayEl => {
      dayEl.addEventListener("click", () => {
        const dateStr = dayEl.getAttribute("data-date");
        if (this.onDaySelect && dateStr) {
          this.onDaySelect(dateStr);
        }
      });
    });
  }
}
