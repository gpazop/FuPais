// ========================================================
// FUPAIS — DockWrapper
// Renderiza el HTML del dock (DockLayout) y monta la
// lógica vanilla de FuPaisDock sobre los elementos creados.
// ========================================================

import { useEffect, useRef } from "react";
import { FuPaisDock } from "../../components/dock.js";
import DockLayout from "./DockLayout.jsx";

export default function DockWrapper({ appApi }) {
  const dockRef = useRef(null);

  useEffect(() => {
    if (!appApi || dockRef.current) return;

    (async () => {
      const dock = await FuPaisDock.create(appApi);
      dockRef.current = dock;
      window.fuPaisDock = dock;
    })();

    return () => {
      if (dockRef.current) {
        dockRef.current = null;
        window.fuPaisDock = undefined;
      }
    };
  }, [appApi]);

  return <DockLayout />;
}
