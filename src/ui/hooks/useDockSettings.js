// ========================================================
// FUPAIS — useDockSettings (Sprint 2)
// Dueño del estado de preferencias del dock, hidratado del puerto
// storage con la clave legacy intacta (fupais_dock_preferences_v1).
// Reemplaza la mutación interna de FuPaisDock (this.settings +
// saveSettings): ahora es estado React controlado + persistencia
// automática por efecto. Los consumidores (App) derivan de él.
// ========================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "../../services/storage.js";
import {
  DOCK_STORAGE_KEY,
  defaultDockSettings
} from "../../components/dock/constants.js";

export function useDockSettings() {
  const [settings, setSettings] = useState(defaultDockSettings);
  const [hydrated, setHydrated] = useState(false);
  // Última versión ya persistida: evita el write-back redundante
  // justo después del hydrate.
  const lastSavedRef = useRef(null);

  // Boot: hydrate con merge tolerante (prefs de versiones anteriores
  // pueden no traer campos nuevos; los defaults los completan).
  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await storage.get(DOCK_STORAGE_KEY);
      if (!alive) return;
      const merged = { ...defaultDockSettings, ...(stored || {}) };
      lastSavedRef.current = merged;
      setSettings(merged);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Persistencia: cada cambio committed y distinto del último guardado.
  useEffect(() => {
    if (!hydrated || lastSavedRef.current === settings) return;
    lastSavedRef.current = settings;
    storage.set(DOCK_STORAGE_KEY, settings);
  }, [settings, hydrated]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings, hydrated };
}

export default useDockSettings;
