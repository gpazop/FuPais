// ========================================================
// FUPAIS — MAIN APPLICATION CONTROLLER
// Archetype: Clinical Blueprint on Frosted Paper (shadcn/ui)
// ========================================================

import { MIGRATION_PRESETS } from "../data/migrationPresets.js";
import { getCountryRule } from "../data/presets.js";
import { buildDashboard } from "../domain/dashboard.js";
import {
  formatDateISO,
  formatDatePretty,
  parseDate,
  addDays,
  differenceInDays
} from "../domain/dates.js";
import { FuPaisCalendar } from "../components/calendar.js";
import { FuPaisDock } from "../components/dock.js";
import { loadState, saveState, subscribe, notify } from "../state/store.js";

class FuPaisApp {
  constructor(state) {
    this.state = state;
    this.calendar = null;
    this.metrics = null;

    this.initElements();
    this.syncPresetOptions();
    this.initCalendar();
    this.bindEvents();

    // El render es un suscriptor más del store: cualquier mutación anunciada
    // con commit() vuelve a pintar sin que el handler conozca update().
    this.unsubscribe = subscribe(() => this.update());

    this.update();
  }

  /**
   * Boot: hydrate persisted state (via the state store), then build the UI in
   * the same order as before. Only the persistence source changes, not the
   * rendering.
   */
  static async create() {
    const state = await loadState();
    const app = new FuPaisApp(state);

    app.dock = await FuPaisDock.create(app);
    window.fuPaisDock = app.dock;

    return app;
  }

  async persist() {
    await saveState(this.state);
  }

  /**
   * Anuncia al store que el estado cambió. Sustituye a las llamadas directas
   * a `update()` desde los handlers: el re-render llega por suscripción.
   */
  commit() {
    notify(this.state);
  }

  initElements() {
    // Stat elements
    this.elDaysAbroad = document.getElementById("stat-days-abroad");
    this.elTotalAllowed = document.getElementById("stat-total-allowed");
    this.elDaysRemaining = document.getElementById("stat-days-remaining");
    this.elExpiryDateText = document.getElementById("stat-expiry-text");
    this.elProgressBar = document.getElementById("stay-progress-fill");
    this.elPercentText = document.getElementById("stay-percent-text");
    this.elAlertContainer = document.getElementById("smart-alert-container");

    // Header / Country badge
    this.elStatusBadge = document.getElementById("header-status-badge");
    this.elCountryTitle = document.getElementById("country-title");
    this.elCountrySubtitle = document.getElementById("country-subtitle");
    this.elCountryFlag = document.getElementById("country-flag");
    this.elPresetSelect = document.getElementById("preset-selector");
    this.elOfficialPortalLink = document.getElementById("official-portal-link");

    // Procedure list container
    this.elProcedureList = document.getElementById("procedures-list-container");

    // Modals
    this.configModal = document.getElementById("config-modal");
    this.dayModal = document.getElementById("day-modal");
  }

  initCalendar() {
    const calendarContainer = document.getElementById("calendar-mount-point");
    this.calendar = new FuPaisCalendar(calendarContainer, (dateStr) => {
      this.openDayInspector(dateStr);
    });
  }

  getPreset() {
    return MIGRATION_PRESETS[this.state.presetId] || MIGRATION_PRESETS.colombia_intercambio;
  }

  recalculate() {
    const preset = this.getPreset();

    // Pre-sync `done` from persisted checkboxes; buildDashboard derives everything
    // else (targetDate, daysUntilProc, isPast, urgent) from the pure domain layer.
    const tasks = preset.procedures.map(proc => ({
      ...proc,
      done: this.state.completedProcedures[proc.id] === true
    }));

    this.metrics = buildDashboard({
      profile: {
        entryDateStr: this.state.entryDateStr,
        allowedDays: this.state.allowedDays,
        countryCode: preset.countryCode,
        ruleKey: preset.ruleKey
      },
      tasks,
      today: new Date()
    });
  }

  update() {
    this.recalculate();
    this.renderHeaderAndBanner();
    this.renderMetrics();
    this.renderProcedures();
    this.calendar.setData(this.metrics, this.state.customEvents);
    if (this.dock) {
      this.dock.renderMapTelemetry();
    }
    this.persist();
  }

  showNotification(msg) {
    const existing = document.getElementById("fupais-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "fupais-toast";
    toast.className = "card card-sm";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      background: var(--color-ink);
      color: #fafafa;
      box-shadow: var(--shadow-floating);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      padding: 12px 18px;
      animation: modalIn 0.25s ease;
    `;
    toast.innerHTML = `<span>✓</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  renderHeaderAndBanner() {
    const preset = this.getPreset();

    if (this.elCountryFlag) this.elCountryFlag.textContent = preset.countryCode || "CO";
    if (this.elCountryTitle) this.elCountryTitle.textContent = `${this.state.destinationCountry} • ${this.state.visaType}`;
    if (this.elCountrySubtitle) {
      this.elCountrySubtitle.textContent = `País de origen: ${this.state.originCountry} | Ingreso: ${formatDatePretty(this.metrics.entryDate)} | Vencimiento: ${formatDatePretty(this.metrics.expiryDate)}`;
    }

    if (this.elOfficialPortalLink && preset.officialPortalUrl) {
      this.elOfficialPortalLink.href = preset.officialPortalUrl;
      this.elOfficialPortalLink.title = `Ir al portal oficial de ${preset.officialEntityName}`;
      this.elOfficialPortalLink.style.display = "inline-flex";
    }

    if (this.elStatusBadge) {
      this.elStatusBadge.className = `badge ${this.metrics.statusBadge.type}`;
      this.elStatusBadge.innerHTML = `<span class="badge-dot"></span> ${this.metrics.statusBadge.label}`;
    }

    // Smart Alert Box con datos migratorios precisos
    if (this.elAlertContainer) {
      let alertContent = "";

      if (this.metrics.isExpired) {
        alertContent = `
          <div class="alert-box">
            <svg class="icon icon-lg alert-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div class="alert-content">
              <div class="alert-title text-ember">
                Estancia Vencida — Plazo Legal Excedido
              </div>
              <div class="alert-desc">
                Tu período autorizado expiró hace ${Math.abs(this.metrics.daysRemaining)} días. De acuerdo con ${preset.officialEntityName}, deberás solicitar un Salvoconducto (SC-2) por permanencia irregular para salir del país o regularizarte.
              </div>
            </div>
          </div>
        `;
      } else if (this.metrics.isInsideRiskWindow) {
        // En los últimos 5 días antes de vencer
        alertContent = `
          <div class="alert-box" style="border-left-color: var(--color-ember);">
            <svg class="icon icon-lg alert-icon text-ember" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div class="alert-content">
              <div class="alert-title text-ember">
                <span>¡Atención Urgente! Quedan solo ${this.metrics.daysRemaining} días para vencimiento</span>
                <span class="badge badge-ember">Demora de respuesta: 3-5 días hábiles</span>
              </div>
              <div class="alert-desc">
                Has ingresado en la zona de riesgo por tiempos de respuesta. ${preset.officialEntityName} tarda entre 3 y 5 días en procesar y validar el pago de la prórroga. Radica tu solicitud inmediatamente a través del Formulario Único de Trámites (FUT).
                <div style="margin-top: 8px;">
                  <a href="${preset.futFormUrl || preset.officialPortalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-destructive btn-sm">
                    Ir al Formulario Oficial de Radicación ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (this.metrics.isInsideOptimalWindow) {
        // En la ventana óptima (entre 15 y 5 días antes)
        const daysToSafeLimit = differenceInDays(this.metrics.safeDeadlineDate, this.metrics.today);
        alertContent = `
          <div class="alert-box">
            <svg class="icon icon-lg alert-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div class="alert-content">
              <div class="alert-title">
                <span>Ventana Óptima de Radicación Abierta</span>
                <span class="badge badge-solid">Faltan ${this.metrics.daysRemaining} días para vencer</span>
              </div>
              <div class="alert-desc">
                ${preset.legalNotice}
                <br><strong>Recomendación activa:</strong> Te quedan <strong>${daysToSafeLimit} días</strong> para radicar antes del límite seguro (5 días de anticipación). Radicar ahora asegura que tu prórroga se resuelva sin contratiempos.
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                  <a href="${preset.officialPortalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                    Radicar en ${preset.officialEntityName} ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (this.metrics.isBeforeWindow) {
        // Aún falta para los 15 días previos
        const daysToWindow = differenceInDays(this.metrics.prorrogaWindowStartDate, this.metrics.today);
        alertContent = `
          <div class="card card-sm" style="background-color: var(--surface-sidebar); border: 1px solid var(--color-hairline);">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="font-size: 13px; color: var(--color-ink-soft); line-height: 1.45;">
                <strong>Normativa Oficial:</strong> ${preset.legalNotice}
                <br><span style="color: var(--color-mid-gray);">La ventana de prórroga se abrirá el <strong>${formatDatePretty(this.metrics.prorrogaWindowStartDate)}</strong> (en ${daysToWindow} días). No intentes solicitarla antes porque el sistema no la aceptará.</span>
              </div>
              <span class="badge badge-soft">Estancia Regular</span>
            </div>
          </div>
        `;
      } else {
        alertContent = `
          <div class="card card-sm" style="background-color: var(--surface-sidebar); border: 1px solid var(--color-hairline);">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="font-size: 13px; color: var(--color-ink-soft);">
                <strong>Normativa Vigente:</strong> ${preset.legalNotice}
              </div>
              <span class="badge badge-soft">Al día</span>
            </div>
          </div>
        `;
      }

      this.elAlertContainer.innerHTML = alertContent;
    }
  }

  renderMetrics() {
    if (this.elDaysAbroad) this.elDaysAbroad.textContent = this.metrics.daysAbroad;
    if (this.elTotalAllowed) this.elTotalAllowed.textContent = `/ ${this.metrics.totalPeriodDays} días autorizados`;
    if (this.elDaysRemaining) this.elDaysRemaining.textContent = `${this.metrics.daysRemaining} días`;
    if (this.elExpiryDateText) this.elExpiryDateText.textContent = `Límite actual: ${formatDatePretty(this.metrics.expiryDate)}`;

    if (this.elProgressBar) {
      this.elProgressBar.style.width = `${this.metrics.percentElapsed}%`;
      if (this.metrics.isInsideOptimalWindow || this.metrics.isInsideRiskWindow || this.metrics.isExpired) {
        this.elProgressBar.classList.add("fill-warning");
      } else {
        this.elProgressBar.classList.remove("fill-warning");
      }
    }

    if (this.elPercentText) {
      this.elPercentText.textContent = `${this.metrics.percentElapsed}% de estancia completada`;
    }
  }

  renderProcedures() {
    if (!this.elProcedureList) return;

    const html = this.metrics.resolvedProcedures.map(proc => {
      let deadlineBadge = "";
      if (proc.daysUntilProc !== null) {
        if (proc.daysUntilProc > 0) {
          deadlineBadge = `<span class="badge ${proc.urgent ? 'badge-ember' : 'badge-soft'}">En ${proc.daysUntilProc} días</span>`;
        } else if (proc.daysUntilProc === 0) {
          deadlineBadge = `<span class="badge badge-ember">¡Vence Hoy!</span>`;
        } else {
          deadlineBadge = `<span class="badge badge-outline">Pasado</span>`;
        }
      }

      return `
        <div class="procedure-item ${proc.urgent && !proc.done ? 'is-urgent' : ''} ${proc.done ? 'is-done' : ''}">
          <input
            type="checkbox"
            class="procedure-checkbox"
            data-id="${proc.id}"
            ${proc.done ? "checked" : ""}
          />
          <div class="procedure-body">
            <div class="procedure-title">
              <span style="${proc.done ? 'text-decoration: line-through; color: var(--color-mid-gray);' : ''}">${proc.title}</span>
              ${deadlineBadge}
            </div>
            <div class="procedure-desc">${proc.desc}</div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
              ${proc.targetDate ? `<div class="procedure-deadline">Fecha objetivo: ${formatDatePretty(proc.targetDate)}</div>` : '<div></div>'}
              ${proc.officialUrl ? `
                <a href="${proc.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="height: 24px; padding: 0 8px; font-size: 11px; text-decoration: none;">
                  Portal Oficial ↗
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");

    this.elProcedureList.innerHTML = html;

    // Attach checkbox toggles with auto-extension of stay
    this.elProcedureList.querySelectorAll(".procedure-checkbox").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        const isChecked = e.target.checked;
        this.state.completedProcedures[id] = isChecked;

        // Auto-actualizar estancia si el trámite es de prórroga aprobada.
        // La prórroga solo amplía `allowedDays`; el vencimiento se vuelve a derivar.
        const proc = this.metrics.resolvedProcedures.find(p => p.id === id);
        if (proc && proc.isExtensionAction && proc.extendsDays) {
          if (isChecked) {
            this.state.allowedDays += proc.extendsDays;
            const newExpiry = addDays(parseDate(this.state.entryDateStr), this.state.allowedDays - 1);
            this.showNotification(`¡Prórroga Registrada! Tu estancia legal se ha extendido +${proc.extendsDays} días (hasta el ${formatDatePretty(newExpiry)}).`);
          } else {
            this.state.allowedDays -= proc.extendsDays;
            this.showNotification(`Se revirtió la extensión de ${proc.extendsDays} días.`);
          }
        }

        this.commit();
      });
    });
  }

  openDayInspector(dateStr) {
    const selectedDate = parseDate(dateStr);
    const modalDateTitle = document.getElementById("day-modal-title");
    const modalBody = document.getElementById("day-modal-body");

    if (modalDateTitle) {
      modalDateTitle.textContent = formatDatePretty(selectedDate);
    }

    const dayNumber = differenceInDays(selectedDate, this.metrics.entryDate) + 1;
    const isAbroad = selectedDate >= this.metrics.entryDate && selectedDate <= this.metrics.expiryDate;
    const isDeadline = selectedDate.getTime() === this.metrics.expiryDate.getTime();
    const isProrroga = selectedDate >= this.metrics.prorrogaWindowStartDate && selectedDate <= this.metrics.safeDeadlineDate;
    const isRisk = selectedDate > this.metrics.safeDeadlineDate && selectedDate <= this.metrics.expiryDate;

    // Events on this date
    const dayProcs = this.metrics.resolvedProcedures.filter(p => {
      return p.targetDate && formatDateISO(p.targetDate) === dateStr;
    });

    const dayCustom = this.state.customEvents.filter(ev => ev.date === dateStr);

    let html = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-12);">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          ${isAbroad ? `<span class="badge badge-solid">Día ${dayNumber} fuera de tu país</span>` : `<span class="badge badge-outline">Fuera de intervalo de viaje</span>`}
          ${isDeadline ? `<span class="badge badge-ember">Fecha Límite Legal</span>` : ''}
          ${isProrroga ? `<span class="badge badge-soft">Ventana Óptima de Radicación</span>` : ''}
          ${isRisk ? `<span class="badge badge-ember">Riesgo Alto por Tiempos de Respuesta</span>` : ''}
        </div>

        <div class="card card-sm" style="background-color: var(--surface-sidebar);">
          <div class="text-caption">Hitos Migratorios y Trámites Oficiales</div>
          ${dayProcs.length === 0 ? `<div style="font-size: 13px; color: var(--color-mid-gray); margin-top: 4px;">Sin trámites oficiales fijados para este día.</div>` : ''}
          ${dayProcs.map(p => `
            <div style="margin-top: 8px; font-size: 13px; font-weight: 500;">
              ★ ${p.title}
              <div style="font-size: 12px; color: var(--color-mid-gray); font-weight: 400; margin-top: 2px;">${p.desc}</div>
              ${p.officialUrl ? `<div style="margin-top: 4px;"><a href="${p.officialUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--color-ink);">Abrir portal oficial ↗</a></div>` : ''}
            </div>
          `).join("")}
        </div>

        <div class="card card-sm" style="background-color: var(--surface-sidebar);">
          <div class="text-caption">Eventos y Recordatorios Personales</div>
          ${dayCustom.length === 0 ? `<div style="font-size: 13px; color: var(--color-mid-gray); margin-top: 4px;">No hay notas personales registradas.</div>` : ''}
          ${dayCustom.map(ev => `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 13px;">
              <span>• ${ev.title}</span>
              <button class="btn btn-outline btn-sm delete-event-btn" data-id="${ev.id}">Eliminar</button>
            </div>
          `).join("")}
        </div>

        <div style="margin-top: 8px;">
          <div class="input-label">Agregar recordatorio para este día:</div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <input type="text" id="new-day-event-input" class="input" placeholder="Ej. Pagar tasa, llevar carta a decanatura..." />
            <button class="btn btn-primary btn-sm" id="btn-add-day-event">Guardar</button>
          </div>
        </div>
      </div>
    `;

    if (modalBody) {
      modalBody.innerHTML = html;

      // Bind add event
      const btnAdd = modalBody.querySelector("#btn-add-day-event");
      const inputAdd = modalBody.querySelector("#new-day-event-input");
      if (btnAdd && inputAdd) {
        btnAdd.addEventListener("click", () => {
          const title = inputAdd.value.trim();
          if (title) {
            this.state.customEvents.push({
              id: "ev-" + Date.now(),
              title,
              date: dateStr
            });
            this.commit();
            this.openDayInspector(dateStr);
          }
        });
      }

      // Bind delete events
      modalBody.querySelectorAll(".delete-event-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          this.state.customEvents = this.state.customEvents.filter(ev => ev.id !== id);
          this.commit();
          this.openDayInspector(dateStr);
        });
      });
    }

    if (this.dayModal) {
      this.dayModal.classList.add("active");
    }
  }

  bindEvents() {
    // Open Config Modal
    const btnOpenConfig = document.getElementById("btn-open-config");
    if (btnOpenConfig) {
      btnOpenConfig.addEventListener("click", () => {
        this.openConfigModal();
      });
    }

    // Close Modals
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.configModal) this.configModal.classList.remove("active");
        if (this.dayModal) this.dayModal.classList.remove("active");
      });
    });

    // Close on backdrop click
    [this.configModal, this.dayModal].forEach(modal => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.remove("active");
          }
        });
      }
    });

    // Preset selection change in header
    if (this.elPresetSelect) {
      this.elPresetSelect.value = this.state.presetId;
      this.elPresetSelect.addEventListener("change", (e) => {
        this.applyPreset(e.target.value);
      });
    }

    // Save config form
    const formConfig = document.getElementById("form-config-trip");
    if (formConfig) {
      formConfig.addEventListener("submit", (e) => {
        e.preventDefault();
        const entryInput = document.getElementById("config-entry-date");
        const durationSelect = document.getElementById("config-duration");
        const originInput = document.getElementById("config-origin");
        const destinationInput = document.getElementById("config-destination");
        const visaInput = document.getElementById("config-visa");

        if (entryInput && entryInput.value) this.state.entryDateStr = entryInput.value;
        if (durationSelect && durationSelect.value) {
          // El usuario registra la DURACIÓN en días (conteo inclusivo: la
          // llegada es el Día 1); el vencimiento vuelve a derivarse siempre.
          this.state.allowedDays = Math.max(1, parseInt(durationSelect.value, 10) || 1);
        }
        if (originInput && originInput.value) this.state.originCountry = originInput.value;
        if (destinationInput && destinationInput.value) this.state.destinationCountry = destinationInput.value;
        if (visaInput && visaInput.value) this.state.visaType = visaInput.value;

        if (this.configModal) this.configModal.classList.remove("active");
        this.commit();
      });
    }
  }

  openConfigModal() {
    const entryInput = document.getElementById("config-entry-date");
    const originInput = document.getElementById("config-origin");
    const destinationInput = document.getElementById("config-destination");
    const visaInput = document.getElementById("config-visa");
    const modalPresetSelect = document.getElementById("config-preset-select");

    if (entryInput) entryInput.value = this.state.entryDateStr;
    // La duración se pobla desde la regla legal del preset activo y el
    // preview muestra el vencimiento derivado (llegada = Día 1).
    this.syncDurationOptions();
    this.updateDurationPreview();
    if (originInput) originInput.value = this.state.originCountry;
    if (destinationInput) destinationInput.value = this.state.destinationCountry;
    if (visaInput) visaInput.value = this.state.visaType;
    entryInput.oninput = () => this.updateDurationPreview();
    const durationSelect = document.getElementById("config-duration");
    if (durationSelect) durationSelect.onchange = () => this.updateDurationPreview();
    if (modalPresetSelect) {
      modalPresetSelect.value = this.state.presetId;
      modalPresetSelect.onchange = (e) => {
        this.applyPreset(e.target.value);
        if (entryInput) entryInput.value = this.state.entryDateStr;
        this.syncDurationOptions();
        this.updateDurationPreview();
        if (originInput) originInput.value = this.state.originCountry;
        if (destinationInput) destinationInput.value = this.state.destinationCountry;
        if (visaInput) visaInput.value = this.state.visaType;
      };
    }

    if (this.configModal) this.configModal.classList.add("active");
  }

  /**
   * Pobla el selector de duración con los montos legales del preset activo:
   * la autorización inicial y el tope del periodo (si la regla lo declara).
   * Si el estado persistido tiene una duración fuera de esos montos, se
   * añade como opción "(actual)" para no perderla al reabrir el modal.
   */
  syncDurationOptions() {
    const select = document.getElementById("config-duration");
    if (!select) return;

    const preset = this.getPreset();
    const rule = getCountryRule(preset.countryCode, preset.stayType);

    const amounts = [];
    const pushAmount = (days, note) => {
      if (!Number.isInteger(days) || days < 1) return;
      if (!amounts.some(a => a.days === days)) amounts.push({ days, note });
    };
    // La regla legal es la única fuente de verdad de los montos. Si faltara
    // (preset sin regla — no ocurre entre los publicados), cae al total del propio preset.
    if (rule) {
      pushAmount(rule.allowedDays, "autorización inicial");
      if (rule.maxDaysInWindow) pushAmount(rule.maxDaysInWindow, "tope del periodo");
    } else {
      pushAmount(preset.totalAllowedDays, "autorización inicial");
    }
    // Duración actual puede ser personalizada o heredada de versiones previas.
    pushAmount(this.state.allowedDays, "actual");

    amounts.sort((a, b) => a.days - b.days);
    select.innerHTML = amounts.map(a => {
      const tag = a.note === "autorización inicial" ? "autorización inicial"
        : a.note === "actual" ? "actual"
        : "tope del periodo";
      return `<option value="${a.days}" ${a.days === this.state.allowedDays ? "selected" : ""}>${a.days} días (${tag})</option>`;
    }).join("");
  }

  /** Recalcula el preview del vencimiento derivado: entrada + (días - 1). */
  updateDurationPreview() {
    const preview = document.getElementById("config-duration-preview");
    const select = document.getElementById("config-duration");
    const entryInput = document.getElementById("config-entry-date");
    if (!preview || !select || !select.value) return;

    const entryStr = entryInput && entryInput.value ? entryInput.value : this.state.entryDateStr;
    const entry = parseDate(entryStr);
    const days = Math.max(1, parseInt(select.value, 10) || 1);
    const expiry = addDays(entry, days - 1);
    preview.textContent = `El permiso vencería el ${formatDatePretty(expiry)} (la llegada cuenta como Día 1).`;
  }

  applyPreset(presetId) {
    const preset = MIGRATION_PRESETS[presetId];
    if (!preset) return;

    this.state.presetId = presetId;
    this.state.destinationCountry = preset.destinationCountry;
    this.state.visaType = preset.visaType;
    if (preset.originCountry) this.state.originCountry = preset.originCountry;

    // Reset standard dates based on preset.
    // Semilla demo: entró hace `defaultStayDays` días y tiene `totalAllowedDays`
    // iniciales; el vencimiento se deriva siempre, nunca se guarda.
    const today = new Date();
    const entryDate = addDays(today, -(preset.defaultStayDays ?? 0));

    this.state.entryDateStr = formatDateISO(entryDate);
    this.state.allowedDays = preset.totalAllowedDays;
    this.state.completedProcedures = {};

    if (this.elPresetSelect) this.elPresetSelect.value = presetId;

    this.commit();
  }

  /**
   * Reconstruye los `<option>` de ambos selectores a partir del registro
   * publicado (`MIGRATION_PRESETS`). El markup estático de index.html queda
   * siempre sincronizado con lo que el registro realmente publica.
   */
  syncPresetOptions() {
    const presets = Object.values(MIGRATION_PRESETS);
    if (presets.length === 0) return;

    ["preset-selector", "config-preset-select"].forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = presets
        .map(p => (
          `<option value="${p.id}" ${p.id === this.state.presetId ? "selected" : ""}>` +
          `${p.destinationCountry} — ${p.visaType}` +
          `</option>`
        ))
        .join("");
      select.value = this.state.presetId;
    });
  }
}

// ========================================================
// PUBLIC API — imported by src/main.js
// ========================================================
export { FuPaisApp };

export async function init() {
  window.fuPaisApp = await FuPaisApp.create();
  return window.fuPaisApp;
}
