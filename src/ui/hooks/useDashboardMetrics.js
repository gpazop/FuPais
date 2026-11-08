// ========================================================
// FUPAIS — useDashboardMetrics (Sprint 1)
// Conexión reactiva entre el estado de la app y el motor puro
// `buildDashboard()` (domain/dashboard.js, INTACTO).
//
// Contrato de memoización: solo recomputa cuando cambia ALGUNA de
// las entradas primitivas del perfil, la identidad de `tasks` o el
// día (todayKey). Una mutación que no toque el perfil (p. ej. agregar
// un evento personalizado) reutiliza el objeto `metrics` previo, así
// que los consumidores memoizados (calendario, listas) hacen
// early-return sin re-trabajo.
//
// Reemplaza el patrón obsoleto `useEffect(recalculate) → setMetrics`
// que producía un doble render y una identidad nueva de `metrics`
// en cada ciclo (forzando re-render completo del calendario vanilla).
// ========================================================

import { useMemo } from "react";
import { buildDashboard } from "../../domain/dashboard.js";

export function useDashboardMetrics({
  entryDateStr,
  allowedDays,
  manual = false,
  countryCode,
  ruleKey,
  tasks,
  todayKey
}) {
  return useMemo(() => {
    if (!entryDateStr) return null;
    const metrics = buildDashboard({
      profile: { entryDateStr, allowedDays, countryCode, ruleKey },
      tasks,
      today: todayKey
    });
    if (!manual) return metrics;
    return {
      ...metrics,
      manual: true,
      prorrogaWindowStartDate: null,
      safeDeadlineDate: null,
      isInsideOptimalWindow: false,
      isInsideRiskWindow: false,
      isExpired: false,
      statusBadge: { label: "Estancia manual", type: "badge-soft" }
    };
  }, [entryDateStr, allowedDays, manual, countryCode, ruleKey, tasks, todayKey]);
}

export default useDashboardMetrics;
