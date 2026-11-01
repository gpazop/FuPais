// ========================================================
// FUPAIS — APP (React)
// Migración progresiva de ui/app.js (vanilla) → React.
// domain/, data/, state/, services/ permanecen intactos.
// Los componentes UI viven en src/ui/components/.
// ========================================================

import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadState,
  saveState,
  subscribe,
  notify
} from "../state/store.js";
import { MIGRATION_PRESETS } from "../data/migrationPresets.js";
import { buildDashboard } from "../domain/dashboard.js";
import {
  formatDateISO,
  formatDatePretty,
  parseDate,
  addDays,
  differenceInDays
} from "../domain/dates.js";
import { FuPaisDock } from "../components/dock.js";

// Componentes React
import Badge from "./components/Badge.jsx";
import Header from "./components/Header.jsx";
import SmartAlert from "./components/SmartAlert.jsx";
import MetricCard from "./components/MetricCard.jsx";
import CalendarWrapper from "./components/CalendarWrapper.jsx";
import ProceduresList from "./components/ProceduresList.jsx";
import CountryCards from "./components/CountryCards.jsx";
import Map from "./components/Map.jsx";
import ConfigModal from "./components/ConfigModal.jsx";
import DayModal from "./components/DayModal.jsx";
import DockWrapper from "./components/DockWrapper.jsx";

export default function App() {
  // --- Estado local (refleja this.state del vanilla) ---
  const [state, setState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [inspectedDateStr, setInspectedDateStr] = useState(null);
  const [inspectedDate, setInspectedDate] = useState(null);

  // --- Refs para instancias imperativas vanilla ---
  const dockRef = useRef(null);
  const calendarRef = useRef(null);

  // --- store subscription ---
  useEffect(() => {
    const unsubscribe = subscribe(() => {
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

  // --- showNotification (toast DOM) ---
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

  // --- applyPreset ---
  const applyPreset = useCallback((presetId) => {
    const preset = MIGRATION_PRESETS[presetId];
    if (!preset || !state) return;
    const today = new Date();
    const entryDate = addDays(today, -(preset.defaultStayDays ?? 0));
    setState({
      ...state,
      presetId,
      destinationCountry: preset.destinationCountry,
      visaType: preset.visaType,
      originCountry: preset.originCountry ?? state.originCountry,
      entryDateStr: formatDateISO(entryDate),
      allowedDays: preset.totalAllowedDays,
      completedProcedures: {}
    });
  }, [state]);

  // --- openConfigModal ---
  const openConfigModal = useCallback(() => {
    setConfigModalOpen(true);
  }, []);

  // --- openDayInspector ---
  const openDayInspector = useCallback((dateStr) => {
    if (!state || !metrics) return;
    const selectedDate = parseDate(dateStr);
    setInspectedDateStr(dateStr);
    setInspectedDate(selectedDate);
    setDayModalOpen(true);
  }, [state, metrics]);

  // --- closeDayModal ---
  const closeDayModal = useCallback(() => {
    setDayModalOpen(false);
  }, []);

  // --- handleAddEvent ---
  const handleAddEvent = useCallback((title, dateStr) => {
    setState((prev) => ({
      ...prev,
      customEvents: [
        ...prev.customEvents,
        { id: "ev-" + Date.now(), title, date: dateStr }
      ]
    }));
    commit();
  }, [commit]);

  // --- handleDeleteEvent ---
  const handleDeleteEvent = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      customEvents: prev.customEvents.filter((ev) => ev.id !== id)
    }));
    commit();
  }, [commit]);

  // --- handleProcedureToggle (desde ProceduresList) ---
  const handleProcedureToggle = useCallback(
    (id, isChecked, proc) => {
      setState((prev) => ({
        ...prev,
        completedProcedures: { ...prev.completedProcedures, [id]: isChecked }
      }));
      if (proc && proc.isExtensionAction && proc.extendsDays) {
        if (isChecked) {
          setState((prev) => ({
            ...prev,
            allowedDays: prev.allowedDays + proc.extendsDays
          }));
          const newExpiry = addDays(
            parseDate(state.entryDateStr),
            state.allowedDays + proc.extendsDays - 1
          );
          showNotification(
            `¡Prórroga Registrada! Tu estancia legal se ha extendido +${proc.extendsDays} días (hasta el ${formatDatePretty(newExpiry)}).`
          );
        } else {
          setState((prev) => ({
            ...prev,
            allowedDays: prev.allowedDays - proc.extendsDays
          }));
          showNotification(`Se revirtió la extensión de ${proc.extendsDays} días.`);
        }
      }
      commit();
    },
    [state, commit, showNotification]
  );

  // --- API expuesta al dock y al HTML estático ---
  const appApi = {
    state,
    metrics,
    applyPreset,
    showNotification,
    openConfigModal,
    commit,
    getPreset,
    renderMetricsAndAlerts: () => {
      // No-op: React renderiza de forma declarativa
    }
  };

  // --- Montar Dock vanilla sobre #fupais-dock existente ---
  useEffect(() => {
    if (!appApi || dockRef.current) return;
    (async () => {
      const dock = await FuPaisDock.create(appApi);
      dockRef.current = dock;
      window.fuPaisDock = dock;
      window.fuPaisApp = appApi;
    })();
    return () => {
      dockRef.current = null;
      window.fuPaisDock = undefined;
      window.fuPaisApp = undefined;
    };
  }, [appApi]);

  const preset = state ? getPreset() : null;

  return (
    <div className="app-container">
      <Header
        presetId={state?.presetId ?? "colombia_intercambio"}
        onPresetChange={applyPreset}
        onOpenConfig={openConfigModal}
        statusBadge={metrics?.statusBadge ?? { label: "Verificando...", type: "badge-solid" }}
      />

      {state ? (
        <>
          <section className="fupais-view active" id="view-inicio">
            <section className="country-strip">
              <div className="country-details">
                <div
                  className="badge badge-solid"
                  id="country-flag-badge"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {preset?.countryCode || "CO"}
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
                {preset?.officialPortalUrl && (
                  <a
                    id="official-portal-link"
                    href={preset.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ display: "inline-flex", height: 30 }}
                  >
                    Portal Oficial ↗
                  </a>
                )}
              </div>
            </section>

            <SmartAlert preset={preset} metrics={metrics} />

            <section className="metrics-row">
              <MetricCard
                label="Días Fuera de tu País"
                value={metrics.daysAbroad}
                sub={`/ ${metrics.totalPeriodDays} días autorizados`}
              />
              <MetricCard
                label="Días Restantes de Estancia Legal"
                value={metrics.daysRemaining}
                sub="días"
                variant={metrics.isInsideOptimalWindow || metrics.isInsideRiskWindow || metrics.isExpired ? "warning" : "default"}
                progress
                progressPercent={metrics.percentElapsed}
                footerLabel={`${metrics.percentElapsed}% de estancia completada`}
              />
              <MetricCard
                label="Ventana de Prórroga PTP"
                value="15 a 5 Días"
                sub="previos a vencer"
              />
            </section>

            <main className="dashboard-grid">
              <CalendarWrapper
                metrics={metrics}
                customEvents={state.customEvents}
                onDateSelect={openDayInspector}
              />

              <aside style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-header-inner">
                      <h2 className="card-title">Trámites y Obligaciones</h2>
                      <p className="text-caption" style={{ textTransform: "none" }}>
                        Hitos oficiales según tu calidad migratoria
                      </p>
                    </div>
                  </div>
                  <ProceduresList
                    procedures={metrics.resolvedProcedures}
                    onToggleProcedure={handleProcedureToggle}
                    formatDatePretty={formatDatePretty}
                  />
                </div>
              </aside>
            </main>
          </section>

          <section className="fupais-view" id="view-mapa">
            <div className="map-view-container">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 className="text-heading-sm">Radar Migratorio & Países Disponibles</h2>
                  <p className="text-caption" style={{ textTransform: "none", marginTop: 2 }}>
                    Rastreo satelital GPS en tiempo real de tu ubicación actual y exploración de países con normativas migratorias activas.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button id="btn-gps-locate" className="btn btn-primary btn-sm">
                    Ubicar mi GPS Actual
                  </button>
                  <Badge variant="solid" style={{ backgroundColor: "#0ea5e9", color: "#fff" }}>
                    Live Tracker
                  </Badge>
                </div>
              </div>
              <Map appApi={appApi} />
              <CountryCards onSelectPreset={applyPreset} />
            </div>
          </section>

          <section className="fupais-view" id="view-archivos" />
          <section className="fupais-view" id="view-perfil" />
          <section className="fupais-view" id="view-configuracion" />
        </>
      ) : null}

      <DockWrapper appApi={appApi} />

      {/* Modal: Configurar viaje y fechas */}
      <ConfigModal
        open={configModalOpen}
        onClose={closeConfigModal}
        onSubmit={(data) => {
          setState((prev) => ({ ...prev, ...data }));
          commit();
        }}
        presetId={state?.presetId}
        onPresetChange={applyPreset}
        entryDateStr={state?.entryDateStr}
        onEntryDateChange={(val) =>
          setState((prev) => ({ ...prev, entryDateStr: val }))
        }
        originCountry={state?.originCountry}
        onOriginCountryChange={(val) =>
          setState((prev) => ({ ...prev, originCountry: val }))
        }
        destinationCountry={state?.destinationCountry}
        onDestinationCountryChange={(val) =>
          setState((prev) => ({ ...prev, destinationCountry: val }))
        }
        visaType={state?.visaType}
        onVisaTypeChange={(val) =>
          setState((prev) => ({ ...prev, visaType: val }))
        }
        allowedDays={state?.allowedDays}
        onAllowedDaysChange={(val) =>
          setState((prev) => ({ ...prev, allowedDays: val }))
        }
      />

      {/* Modal: Detalle del día inspeccionado */}
      <DayModal
        open={dayModalOpen}
        onClose={closeDayModal}
        dateStr={inspectedDateStr}
        selectedDate={inspectedDate}
        metrics={metrics}
        customEvents={state?.customEvents ?? []}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
}
