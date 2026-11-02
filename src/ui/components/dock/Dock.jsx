// ========================================================
// FUPAIS — Dock (Sprint 2)
// Componente 100% controlado que reemplaza a FuPaisDock (clase
// vanilla + applyMethods) y a DockWrapper/DockLayout. Composición:
// DockBar + peek handle + Spotlight + Drawer. Los ajustes llegan por
// props desde App (useDockSettings, clave legacy intacta); los
// side-effects globales del chrome (data-theme, dock-pos-* en body)
// son efectos declarativos del propio dock.
//
// Paridad de sonidos con el original: ítem 950·sine, tab 850·sine,
// spotlight 1050·triangle, drawer 1000·triangle, peek 1100·triangle.
// ========================================================

import { useCallback, useEffect } from "react";
import DockBar from "./DockBar.jsx";
import Spotlight from "./Spotlight.jsx";
import Drawer from "./Drawer.jsx";
import useDockAudio from "../../hooks/useDockAudio.js";
import useDockShortcuts from "../../hooks/useDockShortcuts.js";
import useAutoHide from "../../hooks/useAutoHide.js";

function Dock({
  // Navegación (controlada por App)
  activeTab,
  onTabChange,
  // Ajustes hidratados de fupais_dock_preferences_v1
  position = "bottom",
  theme = "light",
  magnify = true,
  autoHide = false,
  soundEnabled = true,
  isHidden = false,
  onHiddenChange,
  // Overlays controladas
  spotlightOpen = false,
  onSpotlightChange,
  drawerOpen = false,
  onDrawerChange,
  // Acciones de app expuestas por los overlays
  onApplyPreset,
  onOpenConfig,
  // Datos derivados
  activeDestination,
  filesCount = 4
}) {
  const play = useDockAudio(soundEnabled);

  // --- Chrome global de ajustes (antes: applySettingsToUI) ---
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  useEffect(() => {
    document.body.classList.remove(
      "dock-pos-bottom",
      "dock-pos-left",
      "dock-pos-top"
    );
    document.body.classList.add(`dock-pos-${position}`);
  }, [position]);

  // --- Acciones (misma semántica que los métodos vanilla) ---
  const handleTabChange = useCallback(
    (tabId) => {
      play(850, "sine", 0.04);
      onTabChange?.(tabId);
    },
    [play, onTabChange]
  );

  const toggleSpotlight = useCallback(() => {
    if (spotlightOpen) {
      onSpotlightChange?.(false);
    } else {
      play(1050, "triangle", 0.05);
      onSpotlightChange?.(true);
    }
  }, [spotlightOpen, onSpotlightChange, play]);

  const toggleDrawer = useCallback(() => {
    if (drawerOpen) {
      onDrawerChange?.(false);
    } else {
      play(1000, "triangle", 0.05);
      onDrawerChange?.(true);
    }
  }, [drawerOpen, onDrawerChange, play]);

  const toggleHide = useCallback(() => {
    onHiddenChange?.(!isHidden);
  }, [isHidden, onHiddenChange]);

  const showDock = useCallback(() => {
    if (isHidden) onHiddenChange?.(false);
  }, [isHidden, onHiddenChange]);

  // --- Auto-hide (mouseleave → 1200ms → ocultar; enter cancela) ---
  const { scheduleHide, cancelHide } = useAutoHide({
    enabled: autoHide,
    onHide: () => onHiddenChange?.(true)
  });

  // --- Atajos globales: UN listener para toda la app ---
  useDockShortcuts({
    onToggleSpotlight: toggleSpotlight,
    onToggleDrawer: toggleDrawer,
    onToggleHide: toggleHide,
    onTab: handleTabChange
  });

  return (
    <>
      {/* FLOATING / DOCK NAVIGATION BAR */}
      <nav
        className={`dock-wrapper dock-${position}${magnify ? " magnify-enabled" : ""}${isHidden ? " dock-hidden" : ""}`}
        id="fupais-dock"
        aria-label="Barra de Navegación"
        onMouseLeave={scheduleHide}
        onMouseEnter={cancelHide}
      >
        <DockBar
          activeTab={activeTab}
          magnify={magnify}
          filesCount={filesCount}
          play={play}
          onTabChange={handleTabChange}
          onOpenSpotlight={toggleSpotlight}
          onOpenDrawer={toggleDrawer}
          onToggleHide={toggleHide}
        />
      </nav>

      {/* SEÑAL FLOTANTE / PEEK HANDLE */}
      <div
        className={`dock-peek-handle handle-${position}`}
        id="dock-peek-trigger"
        title="Clic para mostrar la Barra"
        style={{ opacity: isHidden ? 1 : 0.4 }}
        onClick={() => {
          play(1100, "triangle", 0.06);
          showDock();
        }}
        onMouseEnter={() => {
          if (autoHide) showDock();
        }}
      >
        <span className="handle-live-dot"></span>
        <span className="handle-pill-line"></span>
        <span className="handle-text-tip">Abrir</span>
      </div>

      {/* SPOTLIGHT SEARCH (Cmd+K) */}
      <Spotlight
        open={spotlightOpen}
        onClose={() => onSpotlightChange?.(false)}
        onTab={handleTabChange}
        onApplyPreset={onApplyPreset}
        onOpenConfig={onOpenConfig}
      />

      {/* SLIDE-OVER DRAWER (Cmd+M) */}
      <Drawer
        open={drawerOpen}
        onClose={() => onDrawerChange?.(false)}
        activeDestination={activeDestination}
        onOpenMap={() => {
          onDrawerChange?.(false);
          handleTabChange("mapa");
        }}
        onOpenSpotlight={() => {
          onDrawerChange?.(false);
          toggleSpotlight();
        }}
      />
    </>
  );
}

export default Dock;
