// ========================================================
// FUPAIS — useToasts (Sprint 4)
// Notificaciones declarativas: reemplaza el toast DOM imperativo de
// App (getElementById + innerHTML + remove). Los toasts son estado
// React con auto-descarte (4s por defecto) y cierre manual.
// Mejora honesta: los toasts se APILAN en vez de reemplazarse y el
// contenedor es aria-live="polite" para lectores de pantalla.
// ========================================================

import { useCallback, useEffect, useRef, useState } from "react";

export function useToasts({ duration = 4000 } = {}) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());

  // Limpieza de temporizadores pendientes al desmontar.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, kind = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, kind }]);
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      timersRef.current.add(timer);
    },
    [duration]
  );

  return { toasts, notify, dismiss };
}

export default useToasts;
