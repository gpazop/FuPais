// ========================================================
// FUPAIS — DockWrapper
// Envoltorio React para FuPaisDock (fachada de 340 líneas,
// clase vanilla intacta). Se monta sobre #fupais-dock
// existente en index.html y expone la API de la app.
// ========================================================

import { useEffect, useRef } from "react";
import { FuPaisDock } from "../../components/dock.js";

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

  return null;
}
