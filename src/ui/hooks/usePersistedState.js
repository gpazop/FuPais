// ========================================================
// FUPAIS — usePersistedState (Sprint 1)
// Dueño del ciclo de vida del estado persistente de FuPais:
//   - Hydrate: loadState() del store (puerto services/storage.js).
//   - Persistencia automática: cada estado COMMITTED y distinto del
//     último guardado se persiste UNA vez, DESPUÉS del render
//     (useEffect), eliminando el patrón obsoleto
//     handler→setState→commit() que persistía el estado anterior
//     por closure stale (el último cambio se perdía al recargar).
//
// La API del store (subscribe/notify) permanece intacta para tests;
// App simplemente deja de usarla como canal de re-render.
// ========================================================

import { useEffect, useRef, useState } from "react";
import { loadState, saveState } from "../../state/store.js";

export function usePersistedState() {
  const [state, setState] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  // Última versión ya persistida: evita re-guardar el mismo objeto
  // (p. ej. el write-back redundante justo después del hydrate).
  const lastSavedRef = useRef(null);

  // Boot: cargar el estado persistido (o el default del store).
  useEffect(() => {
    let alive = true;
    (async () => {
      const persisted = await loadState();
      if (!alive) return;
      lastSavedRef.current = persisted;
      setState(persisted);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Persistencia: fire-and-forget; el puerto maneja fallos internamente.
  useEffect(() => {
    if (!state || lastSavedRef.current === state) return;
    lastSavedRef.current = state;
    saveState(state);
  }, [state]);

  return { state, setState, hydrated };
}

export default usePersistedState;
