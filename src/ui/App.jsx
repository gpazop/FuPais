// ========================================================
// FUPAIS — APP (React)
// Migración progresiva de ui/app.js (vanilla) → React.
// domain/, data/, state/, services/ permanecen intactos.
// Los componentes UI viven en src/ui/components/.
// ========================================================

import { useState, useRef, useCallback, useMemo } from "react";
import { MIGRATION_PRESETS } from "../data/migrationPresets.js";
import {
  formatDateISO,
  formatDatePretty,
  parseDate,
  addDays
} from "../domain/dates.js";
import useToday from "./hooks/useToday.js";
import useDashboardMetrics from "./hooks/useDashboardMetrics.js";
import usePersistedState from "./hooks/usePersistedState.js";

// Componentes React
import Badge from "./components/Badge.jsx";
import Header from "./components/Header.jsx";
import SmartAlert from "./components/SmartAlert.jsx";
import MetricCard from "./components/MetricCard.jsx";
import Calendar from "./components/Calendar.jsx";
import Toasts from "./components/Toast.jsx";
import useToasts from "./hooks/useToasts.js";
import Vault from "./components/Vault.jsx";
import ProfileView from "./components/ProfileView.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import useVaultFiles from "./hooks/useVaultFiles.js";
import useDockAudio from "./hooks/useDockAudio.js";
import ProceduresList from "./components/ProceduresList.jsx";
import CountryCards from "./components/CountryCards.jsx";
import Map from "./components/map/Map.jsx";
import GpsHud from "./components/map/GpsHud.jsx";
import MapSearch from "./components/map/MapSearch.jsx";
import MapLayerSwitcher from "./components/map/MapLayerSwitcher.jsx";
import useGeoTracking from "./hooks/useGeoTracking.js";
import ConfigModal from "./components/ConfigModal.jsx";
import DayModal from "./components/DayModal.jsx";
import Dock from "./components/dock/Dock.jsx";
import useDockSettings from "./hooks/useDockSettings.js";

export default function App() {
  // --- Estado persistente: hydrate + guardado automático (usePersistedState) ---
  // Elimina el patrón handler→setState→commit() que persistía el estado
  // ANTERIOR por closure stale (el último cambio se perdía al recargar):
  // ahora cada estado committed se persiste una sola vez, DESPUÉS del
  // render, vía useEffect.
  const { state, setState } = usePersistedState();

  // --- "Hoy" reactivo: clave ISO local, invalidada a medianoche ---
  const todayKey = useToday();

  // --- UI state ---
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [inspectedDateStr, setInspectedDateStr] = useState(null);
  const [inspectedDate, setInspectedDate] = useState(null);

  // --- Overlays controladas del dock (spotlight Cmd+K / drawer Cmd+M) ---
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- Preferencias del dock: hidratadas de la clave legacy (Sprint 2) ---
  const { settings: dockSettings, updateSettings: updateDockSettings } =
    useDockSettings();
  const activeTab = dockSettings.activeTab || "inicio";

  // --- Bóveda de documentos (vista Archivos) + sonidos de UI ---
  // Reutiliza useDockAudio respetando el ajuste soundEnabled del dock.
  const vault = useVaultFiles();
  const playUiSound = useDockAudio(dockSettings.soundEnabled);

  // --- getPreset (puro → identidad estable) ---
  const getPreset = useCallback((presetId) => {
    return MIGRATION_PRESETS[presetId] || MIGRATION_PRESETS.colombia_intercambio;
  }, []);

  // --- Preset activo: memo por presetId (no por el objeto state completo) ---
  const preset = useMemo(
    () => (state?.presetId ? getPreset(state.presetId) : null),
    [state?.presetId, getPreset]
  );

  // --- Trámites del preset con su estado done (identidad estable) ---
  const tasks = useMemo(() => {
    if (!preset || !state) return [];
    return preset.procedures.map((proc) => ({
      ...proc,
      done: state.completedProcedures?.[proc.id] === true
    }));
  }, [preset, state?.completedProcedures]);

  // --- Métricas: motor puro `buildDashboard` conectado por memoización ---
  // Recomputa SOLO si cambia una entrada primitiva del perfil, la
  // identidad de `tasks` o el día (todayKey). Una mutación que no toca
  // el perfil (p. ej. un evento personalizado) reutiliza el objeto
  // `metrics` previo → consumidores memoizados hacen early-return.
  const metrics = useDashboardMetrics({
    entryDateStr: state?.entryDateStr,
    allowedDays: state?.allowedDays,
    countryCode: preset?.countryCode,
    ruleKey: preset?.ruleKey,
    tasks,
    todayKey
  });

  // --- Refs "latest" para guards de callbacks estables ---
  // Sustituye al appApi de Sprint 1 (ya no hay consumidores vanilla):
  // permite que openDayInspector / handleProcedureToggle mantengan
  // identidad estable leyendo el estado committed sin closures obsoletas.
  const latestRef = useRef({});
  latestRef.current = { state, metrics };

  // (commit eliminado en Sprint 1: la persistencia es automática en
  // usePersistedState. Sprint 2 retiró el appApi vanilla junto con
  // FuPaisDock; los consumidores actuales usan callbacks directos.)

  // --- Notificaciones (toasts React, Sprint 4) ---
  // Reemplaza el toast DOM imperativo (getElementById + innerHTML):
  // ahora es estado declarativo con auto-descarte y cierre manual.
  const { toasts, notify, dismiss } = useToasts();

  // --- Radar migratorio: capa activa, vuelos imperativos y tracking (Sprint 3) ---
  const [mapLayer, setMapLayer] = useState("streets");
  const [flyRequest, setFlyRequest] = useState(null);

  const geo = useGeoTracking({
    destinationCountry: state?.destinationCountry,
    originCountry: state?.originCountry,
    onNotify: notify
  });

  // --- applyPreset (setState funcional → identidad estable) ---
  const applyPreset = useCallback((presetId) => {
    const presetData = MIGRATION_PRESETS[presetId];
    if (!presetData) return;
    setState((prev) => {
      if (!prev) return prev;
      const today = new Date();
      const entryDate = addDays(today, -(presetData.defaultStayDays ?? 0));
      return {
        ...prev,
        presetId,
        destinationCountry: presetData.destinationCountry,
        visaType: presetData.visaType,
        originCountry: presetData.originCountry ?? prev.originCountry,
        entryDateStr: formatDateISO(entryDate),
        allowedDays: presetData.totalAllowedDays,
        completedProcedures: {}
      };
    });
  }, [setState]);

  // --- openConfigModal ---
  const openConfigModal = useCallback(() => {
    setConfigModalOpen(true);
  }, []);

  // --- closeConfigModal ---
  const closeConfigModal = useCallback(() => {
    setConfigModalOpen(false);
  }, []);

  // --- openDayInspector (estable: guarda vía latestRef, sin closures de estado) ---
  const openDayInspector = useCallback((dateStr) => {
    if (!latestRef.current.state || !latestRef.current.metrics) return;
    const selectedDate = parseDate(dateStr);
    setInspectedDateStr(dateStr);
    setInspectedDate(selectedDate);
    setDayModalOpen(true);
  }, []);

  // --- closeDayModal ---
  const closeDayModal = useCallback(() => {
    setDayModalOpen(false);
  }, []);

  // --- handleAddEvent (persistencia automática vía usePersistedState) ---
  const handleAddEvent = useCallback((title, dateStr) => {
    setState((prev) => ({
      ...prev,
      customEvents: [
        ...(prev.customEvents ?? []),
        { id: "ev-" + Date.now(), title, date: dateStr }
      ]
    }));
  }, [setState]);

  // --- handleDeleteEvent (persistencia automática vía usePersistedState) ---
  const handleDeleteEvent = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      customEvents: (prev.customEvents ?? []).filter((ev) => ev.id !== id)
    }));
  }, [setState]);

  // --- handleProcedureToggle (desde ProceduresList) ---
  // Estable: mutaciones funcionales + notificación calculada sobre el
  // estado committed vía latestRef (mismas fórmulas del original).
  const handleProcedureToggle = useCallback(
    (id, isChecked, proc) => {
      setState((prev) => ({
        ...prev,
        completedProcedures: { ...prev.completedProcedures, [id]: isChecked }
      }));
      if (proc && proc.isExtensionAction && proc.extendsDays) {
        const committed = latestRef.current.state;
        if (isChecked) {
          const newAllowed = (committed?.allowedDays ?? 0) + proc.extendsDays;
          setState((prev) => ({
            ...prev,
            allowedDays: prev.allowedDays + proc.extendsDays
          }));
          const newExpiry = addDays(
            parseDate(committed?.entryDateStr),
            newAllowed - 1
          );
          notify(
            `¡Prórroga Registrada! Tu estancia legal se ha extendido +${proc.extendsDays} días (hasta el ${formatDatePretty(newExpiry)}).`
          );
        } else {
          setState((prev) => ({
            ...prev,
            allowedDays: prev.allowedDays - proc.extendsDays
          }));
          notify(`Se revirtió la extensión de ${proc.extendsDays} días.`);
        }
      }
    },
    [latestRef, setState, notify]
  );

  // --- Cambio de pestaña: estado + persistencia + scroll ---
  // (antes: dock.switchTab manipulaba el DOM; ahora es estado derivado)
  const handleTabChange = useCallback(
    (tabId) => {
      updateDockSettings({ activeTab: tabId });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateDockSettings]
  );

  // --- Visibilidad del dock (persistida en la clave legacy) ---
  const handleHiddenChange = useCallback(
    (hidden) => {
      updateDockSettings({ isHidden: hidden });
    },
    [updateDockSettings]
  );

  // --- Radar: GPS en vivo y búsqueda de lugares (Sprint 3) ---
  // El vuelo (flyTo) se expresa como "flyRequest" y lo ejecuta el
  // MapController DENTRO del contexto del mapa — App no toca Leaflet.
  const handleLocateGps = useCallback(async () => {
    const coords = await geo.locate();
    if (coords) {
      setFlyRequest({
        lat: coords.lat,
        lng: coords.lng,
        zoom: 13,
        key: Date.now()
      });
    }
  }, [geo]);

  const handleMapSearch = useCallback(
    async (query) => {
      const place = await geo.findPlace(query);
      if (place) {
        setFlyRequest({
          lat: place.lat,
          lng: place.lng,
          zoom: 12,
          key: Date.now()
        });
      }
    },
    [geo]
  );

  // --- Bóveda: alta/baja de fichas (con sonido estilo vanilla) ---
  const handleVaultAdd = useCallback(
    (fileList) => {
      const count = vault.addFiles(fileList);
      if (count > 0) {
        playUiSound(1200, "triangle", 0.08);
        notify(
          `¡${count} archivo(s) guardado(s) exitosamente en tu bóveda migratoria!`
        );
      }
    },
    [vault, playUiSound, notify]
  );

  const handleVaultRemove = useCallback(
    (id) => {
      vault.removeFile(id);
      playUiSound(700, "sawtooth", 0.04);
    },
    [vault, playUiSound]
  );

  // Clase de cada vista derivada del estado (antes: classList del dock)
  const viewClass = (id) =>
    activeTab === id ? "fupais-view active" : "fupais-view";

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
          {metrics ? (
            <section className={viewClass("inicio")} id="view-inicio">
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
                {/* Valores derivados de la normativa activa (windows.js +
                    COUNTRY_RULES): antes eran texto fijo, así que cualquier
                    preset mostraba la ventana y la extensión de Colombia. */}
                <span className="rule-pill">
                  <strong>Ventana Legal:</strong> {metrics.windowStartBeforeExpiry} a{" "}
                  {metrics.safeDeadlineBeforeExpiry} días previos
                </span>
                {preset?.extendsDays ? (
                  <span className="rule-pill">
                    <strong>Extensión:</strong> +{preset.extendsDays} días
                  </span>
                ) : null}
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
              <Calendar
                metrics={metrics}
                customEvents={state.customEvents ?? []}
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
          ) : null}

          <section className={viewClass("mapa")} id="view-mapa">
            <div className="map-view-container">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 className="text-heading-sm">Radar Migratorio & Países Disponibles</h2>
                  <p className="text-caption" style={{ textTransform: "none", marginTop: 2 }}>
                    Rastreo satelital GPS en tiempo real de tu ubicación actual y exploración de países con normativas migratorias activas.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  id="btn-gps-locate"
                  className="btn btn-primary btn-sm"
                  onClick={handleLocateGps}
                  disabled={geo.locating}
                >
                  {geo.locating ? "Localizando..." : "Ubicar mi GPS Actual"}
                </button>
                  <Badge variant="solid" style={{ backgroundColor: "#0ea5e9", color: "#fff" }}>
                    Live Tracker
                  </Badge>
                </div>
              </div>
              {/* Mapa + barra flotante (búsqueda y capas) sobre contenedor relativo */}
              <div style={{ position: "relative" }}>
                <Map
                  presetId={state?.presetId || null}
                  active={activeTab === "mapa"}
                  layerKey={mapLayer}
                  position={geo.position}
                  flyRequest={flyRequest}
                  onApplyPreset={applyPreset}
                  onPickLocation={geo.setManualPosition}
                />
                <div className="map-floating-bar">
                  <MapSearch onSearch={handleMapSearch} />
                  <MapLayerSwitcher value={mapLayer} onChange={setMapLayer} />
                </div>
              </div>

              <GpsHud
                position={geo.position}
                meta={geo.meta}
                legalZone={geo.legalZone}
                locating={geo.locating}
              />

              <CountryCards
                onSelectPreset={applyPreset}
                activePresetId={state?.presetId}
              />
            </div>
          </section>

          <section className={viewClass("archivos")} id="view-archivos">
            <Vault
              files={vault.files}
              onAddFiles={handleVaultAdd}
              onRemoveFile={handleVaultRemove}
            />
          </section>
          <section className={viewClass("perfil")} id="view-perfil">
            <ProfileView
              state={state}
              metrics={metrics}
              preset={preset}
              onOpenConfig={openConfigModal}
            />
          </section>
          <section
            className={viewClass("configuracion")}
            id="view-configuracion"
          >
            <SettingsPanel settings={dockSettings} onChange={updateDockSettings} />
          </section>
        </>
      ) : null}

      {/* Dock declarativo 100% controlado (Sprint 2) */}
      <Dock
        activeTab={activeTab}
        onTabChange={handleTabChange}
        position={dockSettings.position}
        theme={dockSettings.theme}
        magnify={dockSettings.magnify}
        autoHide={dockSettings.autoHide}
        soundEnabled={dockSettings.soundEnabled}
        filesCount={vault.files.length}
        isHidden={dockSettings.isHidden}
        onHiddenChange={handleHiddenChange}
        spotlightOpen={spotlightOpen}
        onSpotlightChange={setSpotlightOpen}
        drawerOpen={drawerOpen}
        onDrawerChange={setDrawerOpen}
        onApplyPreset={applyPreset}
        onOpenConfig={openConfigModal}
        activeDestination={
          preset
            ? `${preset.flag} ${preset.destinationCountry} — ${preset.visaType}`
            : undefined
        }
      />

      {/* Notificaciones (toasts declarativos, Sprint 4) */}
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Modal: Configurar viaje y fechas */}
      <ConfigModal
        open={configModalOpen}
        onClose={closeConfigModal}
        onSubmit={(data) => {
          setState((prev) => ({ ...prev, ...data }));
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
