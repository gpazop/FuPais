// ========================================================
// FUPAIS — useDockShortcuts (Sprint 2)
// Atajos globales del dock: Cmd/Ctrl+K (spotlight), +M (drawer),
// +D (ocultar dock) y +1..5 (pestañas). UN solo listener sobre
// document con cleanup garantizado — antes había un listener por
// cada instancia de FuPaisDock (fuga y acciones duplicadas).
// Los handlers se leen de un ref "latest" para no re-registrar el
// listener en cada render.
// ========================================================

import { useEffect, useRef } from "react";

const TAB_KEYS = {
  "1": "inicio",
  "2": "mapa",
  "3": "archivos",
  "4": "perfil",
  "5": "configuracion"
};

export function useDockShortcuts({
  onToggleSpotlight,
  onToggleDrawer,
  onToggleHide,
  onTab
}) {
  const handlersRef = useRef({});
  handlersRef.current = { onToggleSpotlight, onToggleDrawer, onToggleHide, onTab };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        handlersRef.current.onToggleSpotlight?.();
      } else if (key === "m") {
        e.preventDefault();
        handlersRef.current.onToggleDrawer?.();
      } else if (key === "d") {
        e.preventDefault();
        handlersRef.current.onToggleHide?.();
      } else if (TAB_KEYS[key]) {
        e.preventDefault();
        handlersRef.current.onTab?.(TAB_KEYS[key]);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

export default useDockShortcuts;
