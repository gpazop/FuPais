// ========================================================
// FUPAIS — useToday (Sprint 1)
// Fuente reactiva del "hoy" para el motor de cálculo.
// Devuelve la clave ISO local ('YYYY-MM-DD') del día actual y la
// invalida a medianoche (tick programado) y al reactivar la pestaña.
//
// ¿Por qué una clave string y no un Date?
// `buildDashboard` ya normaliza `today` a medianoche local; una clave
// inmutable es una dependencia de memoización estable (identidad
// predecible para useMemo) y evita recomputar dentro del mismo día.
// ========================================================

import { useEffect, useState } from "react";
import { formatDateISO } from "../../domain/dates.js";

export function useToday() {
  const [todayKey, setTodayKey] = useState(() => formatDateISO(new Date()));

  useEffect(() => {
    let timerId;

    const sync = () => {
      setTodayKey((prev) => {
        const next = formatDateISO(new Date());
        return prev === next ? prev : next;
      });
    };

    // Tick a medianoche local (+2s de colchón para no competir con el
    // cambio de día del sistema) y reprogramación encadenada.
    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        2
      );
      timerId = setTimeout(() => {
        sync();
        scheduleNextMidnight();
      }, nextMidnight - now);
    };

    // Pestañas dormidas: los timers se disparan tarde al despertar.
    // visibilitychange cubre el caso "abrí la app ayer, la reviso hoy".
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };

    scheduleNextMidnight();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return todayKey;
}

export default useToday;
