// ========================================================
// FUPAIS — APP (React)
// Migración progresiva de ui/app.js (vanilla) → React.
// domain/, data/, state/, services/ permanecen intactos.
// ========================================================

import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadState,
  saveState,
  subscribe,
  notify
} from "../state/store.js";
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

export default function App() {
  // --- Estado local (refleja this.state del vanilla) ---
  const [state, setState] = useState(null);

  // --- Refs para instancias imperativas vanilla ---
  const calendarRef = useRef(null);
  const dockRef = useRef(null);
  const elementsRef = useRef({});

  // --- store subscription (sustituye a subscribe/notify del vanilla) ---
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      // notify(this.state) equivalent: React re-renderiza vía setState
      setState((prev) => ({ ...prev }));
    });
    return unsubscribe;
  }, []);

  // --- Boot: cargar estado persistido ---
  useEffect(() => {
    (async () => {
      const persisted = await loadState();
      setState(persisted);
    })();
  }, []);

  // --- getPreset ---
  const getPreset = useCallback(() => {
    if (!state) return MIGRATION_PRESETS.colombia_intercambio;
    return MIGRATION_PRESETS[state.presetId] || MIGRATION_PRESETS.colombia_intercambio;
  }, [state]);

  // --- recalculate ---
  const [metrics, setMetrics] = useState(null);
  const recalculate = useCallback(() => {
    if (!state) return;
    const preset = getPreset();
    const tasks = preset.procedures.map((proc) => ({
      ...proc,
      done: state.completedProcedures[proc.id] === true
    }));
    const m = buildDashboard({
      profile: {
        entryDateStr: state.entryDateStr,
        allowedDays: state.allowedDays,
        countryCode: preset.countryCode,
        ruleKey: preset.ruleKey
      },
      tasks,
      today: new Date()
    });
    setMetrics(m);
  }, [state, getPreset]);

  useEffect(() => {
    recalculate();
  }, [state, recalculate]);

  // --- commit (notifica al store y persiste) ---
  const commit = useCallback(() => {
    if (!state) return;
    notify(state);
    saveState(state);
  }, [state]);

  // --- applyPreset ---
  const applyPreset = useCallback((presetId) => {
    const preset = MIGRATION_PRESETS[presetId];
    if (!preset || !state) return;
    const today = new Date();
    const entryDate = addDays(today, -(preset.defaultStayDays ?? 0));
    const next = {
      ...state,
      presetId,
      destinationCountry: preset.destinationCountry,
      visaType: preset.visaType,
      originCountry: preset.originCountry ?? state.originCountry,
      entryDateStr: formatDateISO(entryDate),
      allowedDays: preset.totalAllowedDays,
      completedProcedures: {}
    };
    setState(next);
  }, [state]);

  // --- showNotification (toast DOM, mantenido del vanilla) ---
  const showNotification = useCallback((msg) => {
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
  }, []);

  // --- syncPresetOptions (rebuild <option>s from MIGRATION_PRESETS) ---
  const syncPresetOptions = useCallback(() => {
    const presets = Object.values(MIGRATION_PRESETS);
    if (presets.length === 0 || !state) return;
    ["preset-selector", "config-preset-select"].forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (!select) return;
      select.innerHTML = presets
        .map((p) => (
          `<option value="${p.id}" ${p.id === state.presetId ? "selected" : ""}>` +
          `${p.destinationCountry} — ${p.visaType}` +
          "</option>"
        ))
        .join("");
      select.value = state.presetId;
    });
  }, [state]);

  // --- syncDurationOptions ---
  const syncDurationOptions = useCallback(() => {
    const select = document.getElementById("config-duration");
    if (!select || !state) return;
    const preset = getPreset();
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
    pushAmount(state.allowedDays, "actual");
    amounts.sort((a, b) => a.days - b.days);
    select.innerHTML = amounts.map((a) => {
      const tag =
        a.note === "autorización inicial"
          ? "autorización inicial"
          : a.note === "actual"
          ? "actual"
          : "tope del periodo";
      return `<option value="${a.days}" ${a.days === state.allowedDays ? "selected" : ""}>${a.days} días (${tag})</option>`;
    }).join("");
  }, [state, getPreset]);

  // --- updateDurationPreview ---
  const updateDurationPreview = useCallback(() => {
    const preview = document.getElementById("config-duration-preview");
    const select = document.getElementById("config-duration");
    const entryInput = document.getElementById("config-entry-date");
    if (!preview || !select || !select.value) return;
    const entryStr = entryInput && entryInput.value ? entryInput.value : state.entryDateStr;
    const entry = parseDate(entryStr);
    const days = Math.max(1, parseInt(select.value, 10) || 1);
    const expiry = addDays(entry, days - 1);
    preview.textContent = `El permiso vencería el ${formatDatePretty(expiry)} (la llegada cuenta como Día 1).`;
  }, [state]);

  // --- openConfigModal ---
  const openConfigModal = useCallback(() => {
    const entryInput = document.getElementById("config-entry-date");
    const originInput = document.getElementById("config-origin");
    const destinationInput = document.getElementById("config-destination");
    const visaInput = document.getElementById("config-visa");
    const modalPresetSelect = document.getElementById("config-preset-select");
    if (!state) return;
    if (entryInput) entryInput.value = state.entryDateStr;
    syncDurationOptions();
    updateDurationPreview();
    if (originInput) originInput.value = state.originCountry;
    if (destinationInput) destinationInput.value = state.destinationCountry;
    if (visaInput) visaInput.value = state.visaType;
    entryInput.oninput = () => updateDurationPreview();
    const durationSelect = document.getElementById("config-duration");
    if (durationSelect) durationSelect.onchange = () => updateDurationPreview();
    if (modalPresetSelect) {
      modalPresetSelect.value = state.presetId;
      modalPresetSelect.onchange = (e) => {
        applyPreset(e.target.value);
        if (entryInput) entryInput.value = state.entryDateStr;
        syncDurationOptions();
        updateDurationPreview();
        if (originInput) originInput.value = state.originCountry;
        if (destinationInput) destinationInput.value = state.destinationCountry;
        if (visaInput) visaInput.value = state.visaType;
      };
    }
    const configModal = document.getElementById("config-modal");
    if (configModal) configModal.classList.add("active");
  }, [state, syncDurationOptions, updateDurationPreview, applyPreset]);

  // --- openDayInspector ---
  const openDayInspector = useCallback((dateStr) => {
    if (!state || !metrics) return;
    const selectedDate = parseDate(dateStr);
    const modalDateTitle = document.getElementById("day-modal-title");
    const modalBody = document.getElementById("day-modal-body");
    if (modalDateTitle) modalDateTitle.textContent = formatDatePretty(selectedDate);
    const dayNumber = differenceInDays(selectedDate, metrics.entryDate) + 1;
    const isAbroad = selectedDate >= metrics.entryDate && selectedDate <= metrics.expiryDate;
    const isDeadline = selectedDate.getTime() === metrics.expiryDate.getTime();
    const isProrroga = selectedDate >= metrics.prorrogaWindowStartDate && selectedDate <= metrics.safeDeadlineDate;
    const isRisk = selectedDate > metrics.safeDeadlineDate && selectedDate <= metrics.expiryDate;
    const dayProcs = metrics.resolvedProcedures.filter((p) => p.targetDate && formatDateISO(p.targetDate) === dateStr);
    const dayCustom = state.customEvents.filter((ev) => ev.date === dateStr);
    const html = `
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
          ${dayProcs.map((p) => `
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
          ${dayCustom.map((ev) => `
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
      const btnAdd = modalBody.querySelector("#btn-add-day-event");
      const inputAdd = modalBody.querySelector("#new-day-event-input");
      if (btnAdd && inputAdd) {
        btnAdd.onclick = () => {
          const title = inputAdd.value.trim();
          if (title) {
            const nextEvents = [...state.customEvents, { id: "ev-" + Date.now(), title, date: dateStr }];
            setState((prev) => ({ ...prev, customEvents: nextEvents }));
            commit();
            openDayInspector(dateStr);
          }
        };
      }
      modalBody.querySelectorAll(".delete-event-btn").forEach((btn) => {
        btn.onclick = (e) => {
          const id = e.target.getAttribute("data-id");
          setState((prev) => ({ ...prev, customEvents: prev.customEvents.filter((ev) => ev.id !== id) }));
          commit();
          openDayInspector(dateStr);
        };
      });
    }
    const dayModal = document.getElementById("day-modal");
    if (dayModal) dayModal.classList.add("active");
  }, [state, metrics, commit]);

  // --- renderAlert (HTML string → innerHTML) ---
  const renderAlert = useCallback((preset, metrics, state) => {
    if (!preset || !metrics) return null;
    let alertContent = "";
    if (metrics.isExpired) {
      alertContent = `
        <div class="alert-box">
          <svg class="icon icon-lg alert-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <div class="alert-content">
            <div class="alert-title text-ember">Estancia Vencida — Plazo Legal Excedido</div>
            <div class="alert-desc">
              Tu período autorizado expiró hace ${Math.abs(metrics.daysRemaining)} días. De acuerdo con ${preset.officialEntityName}, deberás solicitar un Salvoconducto (SC-2) por permanencia irregular para salir del país o regularizarte.
            </div>
          </div>
        </div>
      `;
    } else if (metrics.isInsideRiskWindow) {
      alertContent = `
        <div class="alert-box" style="border-left-color: var(--color-ember);">
          <svg class="icon icon-lg alert-icon text-ember" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <div class="alert-content">
            <div class="alert-title text-ember">
              <span>¡Atención Urgente! Quedan solo ${metrics.daysRemaining} días para vencimiento</span>
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
    } else if (metrics.isInsideOptimalWindow) {
      const daysToSafeLimit = differenceInDays(metrics.safeDeadlineDate, metrics.today);
      alertContent = `
        <div class="alert-box">
          <svg class="icon icon-lg alert-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <div class="alert-content">
            <div class="alert-title">
              <span>Ventana Óptima de Radicación Abierta</span>
              <span class="badge badge-solid">Faltan ${metrics.daysRemaining} días para vencer</span>
            </div>
            <div class="alert-desc">
              ${preset.legalNotice}
              <br /><strong>Recomendación activa:</strong> Te quedan <strong>${daysToSafeLimit} días</strong> para radicar antes del límite seguro (5 días de anticipación). Radicar ahora asegura que tu prórroga se resuelva sin contratiempos.
              <div style="margin-top: 8px; display: flex; gap: 8px;">
                <a href="${preset.officialPortalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                  Radicar en ${preset.officialEntityName} ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (metrics.isBeforeWindow) {
      const daysToWindow = differenceInDays(metrics.prorrogaWindowStartDate, metrics.today);
      alertContent = `
        <div class="card card-sm" style="background-color: var(--surface-sidebar); border: 1px solid var(--color-hairline);">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="font-size: 13px; color: var(--color-ink-soft); line-height: 1.45;">
              <strong>Normativa Oficial:</strong> ${preset.legalNotice}
              <br /><span style="color: var(--color-mid-gray);">La ventana de prórroga se abrirá el <strong>${formatDatePretty(metrics.prorrogaWindowStartDate)}</strong> (en ${daysToWindow} días). No intentes solicitarla antes porque el sistema no la aceptará.</span>
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
    return <div dangerouslySetInnerHTML={{ __html: alertContent }} />;
  }, []);

  // --- renderProcedures (HTML string + event binding) ---
  const renderProcedures = useCallback((container, metrics, state, applyPresetFn, commitFn, showNotificationFn, formatDatePrettyFn) => {
    if (!container || !metrics) return;
    const html = metrics.resolvedProcedures.map((proc) => {
      let deadlineBadge = "";
      if (proc.daysUntilProc !== null) {
        if (proc.daysUntilProc > 0) {
          deadlineBadge = `<span class="badge ${proc.urgent ? "badge-ember" : "badge-soft"}">En ${proc.daysUntilProc} días</span>`;
        } else if (proc.daysUntilProc === 0) {
          deadlineBadge = `<span class="badge badge-ember">¡Vence Hoy!</span>`;
        } else {
          deadlineBadge = `<span class="badge badge-outline">Pasado</span>`;
        }
      }
      return `
        <div class="procedure-item ${proc.urgent && !proc.done ? "is-urgent" : ""} ${proc.done ? "is-done" : ""}">
          <input type="checkbox" class="procedure-checkbox" data-id="${proc.id}" ${proc.done ? "checked" : ""} />
          <div class="procedure-body">
            <div class="procedure-title">
              <span style="${proc.done ? "text-decoration: line-through; color: var(--color-mid-gray);" : ""}">${proc.title}</span>
              ${deadlineBadge}
            </div>
            <div class="procedure-desc">${proc.desc}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
              ${proc.targetDate ? `<div class="procedure-deadline">Fecha objetivo: ${formatDatePrettyFn(proc.targetDate)}</div>` : '<div></div>'}
              ${proc.officialUrl ? `<a href="${proc.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="height: 24px; padding: 0 8px; font-size: 11px; text-decoration: none;">Portal Oficial ↗</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
    container.innerHTML = html;
    container.querySelectorAll(".procedure-checkbox").forEach((cb) => {
      cb.onchange = (e) => {
        const id = e.target.getAttribute("data-id");
        const isChecked = e.target.checked;
        setState((prev) => ({ ...prev, completedProcedures: { ...prev.completedProcedures, [id]: isChecked } }));
        const proc = metrics.resolvedProcedures.find((p) => p.id === id);
        if (proc && proc.isExtensionAction && proc.extendsDays) {
          if (isChecked) {
            setState((prev) => ({ ...prev, allowedDays: prev.allowedDays + proc.extendsDays }));
            const newExpiry = addDays(parseDate(state.entryDateStr), state.allowedDays + proc.extendsDays - 1);
            showNotificationFn(`¡Prórroga Registrada! Tu estancia legal se ha extendido +${proc.extendsDays} días (hasta el ${formatDatePrettyFn(newExpiry)}).`);
          } else {
            setState((prev) => ({ ...prev, allowedDays: prev.allowedDays - proc.extendsDays }));
            showNotificationFn(`Se revirtió la extensión de ${proc.extendsDays} días.`);
          }
        }
        commitFn();
      };
    });
  }, []);

  // --- API expuesta al dock (sustituye a this.app del vanilla) ---
  const appApi = {
    state,
    metrics,
    applyPreset,
    showNotification,
    openConfigModal,
    commit,
    getPreset
  };

  // --- Vista Inicio (Dashboard) ---
  const renderInicio = () => {
    if (!state || !metrics) return null;
    const preset = getPreset();
    return (
      <section className="fupais-view active" id="view-inicio">
        <section className="country-strip">
          <div className="country-details">
            <div className="badge badge-solid" id="country-flag-badge" style={{ width: 36, height: 36, borderRadius: 10, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {preset.countryCode || "CO"}
            </div>
            <div>
              <h2 className="text-subheading" id="country-title" style={{ fontSize: 16 }}>
                {state.destinationCountry} • {state.visaType}
              </h2>
              <p className="text-caption" id="country-subtitle" style={{ textTransform: "none", marginTop: 2 }}>
                País de origen: {state.originCountry} | Ingreso: {formatDatePretty(metrics.entryDate)} | Vencimiento: {formatDatePretty(metrics.expiryDate)}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="rule-pill"><strong>Ventana Legal:</strong> 15 a 5 días previos</span>
            <span className="rule-pill"><strong>Extensión:</strong> +90 días PTP</span>
            {preset.officialPortalUrl && (
              <a id="official-portal-link" href={preset.officialPortalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ display: "inline-flex", height: 30 }}>
                Portal Oficial ↗
              </a>
            )}
          </div>
        </section>

        <section id="smart-alert-container" style={{ marginBottom: "var(--spacing-24)" }}>
          {renderAlert(preset, metrics, state)}
        </section>

        <section className="metrics-row">
          <div className="card metric-card">
            <div className="stat-block">
              <span className="stat-label">Días Fuera de tu País</span>
              <div className="stat-value">
                <span id="stat-days-abroad">{metrics.daysAbroad}</span>
                <span className="stat-value-sub" id="stat-total-allowed">/ {metrics.totalPeriodDays} días autorizados</span>
              </div>
            </div>
            <div style={{ marginTop: "var(--spacing-16)" }}>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" id="stay-progress-fill" style={{ width: `${metrics.percentElapsed}%` }}></div>
              </div>
              <div className="stat-footer">
                <span id="stay-percent-text">{metrics.percentElapsed}% de estancia completada</span>
              </div>
            </div>
          </div>
          <div className="card metric-card">
            <div className="stat-block">
              <span className="stat-label">Días Restantes de Estancia Legal</span>
              <div className="stat-value text-ember" style={{ fontSize: 28, lineHeight: 1.2 }}>
                <span>{metrics.daysRemaining} días</span>
              </div>
            </div>
            <div className="stat-footer">
              <svg className="icon text-ember" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span id="stat-expiry-text">Límite actual: {formatDatePretty(metrics.expiryDate)}</span>
            </div>
          </div>
          <div className="card metric-card">
            <div className="stat-block">
              <span className="stat-label">Ventana de Prórroga PTP</span>
              <div className="stat-value" style={{ fontSize: 28, lineHeight: 1.2 }}>
                <span>15 a 5 Días</span>
                <span className="stat-value-sub">previos a vencer</span>
              </div>
            </div>
            <div className="stat-footer">
              <svg className="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <span>Margen de respuesta: 3-5 días hábiles</span>
            </div>
          </div>
        </section>

        <main className="dashboard-grid">
          <section className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <div className="card-header-inner">
                <h2 className="card-title">Calendario de Estancia y Conteo Diario</h2>
                <p className="text-caption" style={{ textTransform: "none" }}>
                  Haz clic en cualquier día para ver el recuento exacto, hitos migratorios o agregar recordatorios personales.
                </p>
              </div>
            </div>
            <div id="calendar-mount-point" ref={(el) => {
              elementsRef.current.calendarMount = el;
              if (el && !calendarRef.current) {
                calendarRef.current = new FuPaisCalendar(el, (dateStr) => openDayInspector(dateStr));
                calendarRef.current.setData(metrics, state.customEvents);
              } else if (calendarRef.current) {
                calendarRef.current.setData(metrics, state.customEvents);
              }
            }}>
              {/* Calendar rendered via calendar.js */}
            </div>
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
            <div className="card">
              <div className="card-header">
                <div className="card-header-inner">
                  <h2 className="card-title">Trámites y Obligaciones</h2>
                  <p className="text-caption" style={{ textTransform: "none" }}>Hitos oficiales según tu calidad migratoria</p>
                </div>
              </div>
              <div id="procedures-list-container" className="procedure-list" ref={(el) => {
                elementsRef.current.procedureList = el;
                renderProcedures(el, metrics, state, applyPreset, commit, showNotification, formatDatePretty);
              }}>
                {/* Rendered by renderProcedures */}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--color-mid-gray)", lineHeight: 1.35, padding: "8px 10px", backgroundColor: "var(--surface-sidebar)", borderRadius: 8 }}>
                ✦ <strong>Auto-extensión:</strong> Marcar la aprobación de la prórroga actualizará automáticamente tu fecha límite añadiendo los +90 días legales.
              </div>
            </div>
          </aside>
        </main>
      </section>
    );
  };

  // --- Vista Mapa (delegada al dock vanilla) ---
  const renderMapa = () => (
    <section className="fupais-view" id="view-mapa">
      <div className="map-view-container">
        <div id="dock-map-mount" ref={(el) => {
          elementsRef.current.dockMapMount = el;
        }} />
      </div>
    </section>
  );

  // --- Otras vistas (placeholders, reutilizan HTML estático del dock) ---
  const renderArchivos = () => <section className="fupais-view" id="view-archivos" />;
  const renderPerfil = () => <section className="fupais-view" id="view-perfil" />;
  const renderConfiguracion = () => <section className="fupais-view" id="view-configuracion" />;

  // --- Dock vanilla (se monta como clase imperativa) ---
  useEffect(() => {
    if (!elementsRef.current.dockMapMount || dockRef.current) return;
    (async () => {
      const dock = await FuPaisDock.create(appApi);
      dockRef.current = dock;
      window.fuPaisDock = dock;
    })();
  }, [elementsRef.current.dockMapMount, appApi]);

  // --- Modales ---
  const renderConfigModal = () => {
    // El HTML del modal está en index.html; React solo controla la clase .active via openConfigModal
    return null;
  };

  return (
    <div className="app-container">
      <header className="header-bar">
        <div className="brand-section">
          <div className="brand-logo" aria-label="Logo FuPais">Fu</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 className="brand-title">FuPais</h1>
              <span className="badge badge-outline">v2.0</span>
            </div>
            <p className="brand-subtitle">Gestión de estancia en el exterior, prórrogas y alertas legales oficiales</p>
          </div>
        </div>
        <div className="header-actions">
          {state && (
            <>
              <select id="preset-selector" className="select" style={{ maxWidth: 320, fontSize: 13 }} onChange={(e) => applyPreset(e.target.value)} value={state.presetId} title="Seleccionar perfil de normativa migratoria">
                {Object.values(MIGRATION_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>{p.destinationCountry} — {p.visaType}</option>
                ))}
              </select>
              <div id="header-status-badge" className="badge badge-solid">
                <span className="badge-dot"></span> Verificando...
              </div>
              <button id="btn-open-config" className="btn btn-outline btn-sm" onClick={openConfigModal}>
                Ajustar Fechas
              </button>
            </>
          )}
          {!state && <div>Cargando...</div>}
        </div>
      </header>

      {state ? renderInicio() : null}
      {!state ? null : null}

      {renderMapa()}
      {renderArchivos()}
      {renderPerfil()}
      {renderConfiguracion()}

      <div className="modal-overlay" id="config-modal">
        <div className="modal-card">
          <div className="modal-header">
            <h3 className="text-heading-sm" style={{ fontSize: 20 }}>Ajustar Fechas y Perfil de Viaje</h3>
            <button className="btn btn-outline btn-sm" onClick={() => {
              const m = document.getElementById("config-modal");
              if (m) m.classList.remove("active");
            }}>✕</button>
          </div>
          <form id="form-config-trip">
            {/* El contenido del formulario está en index.html; React controla la apertura */}
          </form>
        </div>
      </div>

      <div className="modal-overlay" id="day-modal">
        <div className="modal-card">
          <div className="modal-header">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="text-caption">Inspección de Fecha</span>
              <h3 className="text-heading-sm" id="day-modal-title" style={{ fontSize: 20 }}>Detalle del Día</h3>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => {
              const m = document.getElementById("day-modal");
              if (m) m.classList.remove("active");
            }}>✕</button>
          </div>
          <div id="day-modal-body">
            {/* Injected dynamically */}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => {
              const m = document.getElementById("day-modal");
              if (m) m.classList.remove("active");
            }}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
