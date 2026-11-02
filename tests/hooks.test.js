// ========================================================
// FUPAIS — Tests de hooks de reactividad (Sprint 1)
// Valida el contrato de memoización de useDashboardMetrics y la
// clave ISO de useToday. La capa domain sigue intacta: estos tests
// SUMAN, nunca sustituyen a los 66 originales.
// ========================================================

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardMetrics } from "../src/ui/hooks/useDashboardMetrics.js";
import { useToday } from "../src/ui/hooks/useToday.js";
import { formatDateISO } from "../src/domain/dates.js";

const baseArgs = {
  entryDateStr: "2026-08-15",
  allowedDays: 90,
  countryCode: "CO",
  ruleKey: "student",
  tasks: [],
  todayKey: "2026-11-01"
};

describe("useDashboardMetrics", () => {
  it("devuelve null sin fecha de entrada (boot sin hidratar)", () => {
    const { result } = renderHook(() =>
      useDashboardMetrics({ ...baseArgs, entryDateStr: undefined })
    );
    expect(result.current).toBeNull();
  });

  it("calcula métricas con conteo inclusivo desde entradas primitivas", () => {
    // Entrada 2026-08-15, hoy 2026-11-01 → 78 días fuera.
    // Vencimiento = entrada + 89 días = 2026-11-12 → 11 días restantes.
    // (Ambas diferencias se calculan con Date.UTC → independientes de TZ.)
    const { result } = renderHook(() => useDashboardMetrics(baseArgs));
    const m = result.current;
    expect(m).not.toBeNull();
    expect(m.daysAbroad).toBe(78);
    expect(m.daysRemaining).toBe(11);
    expect(m.totalPeriodDays).toBe(89);
    expect(typeof m.statusBadge.label).toBe("string");
  });

  it("reutiliza la identidad del memo con las mismas entradas", () => {
    const { result, rerender } = renderHook(
      (props) => useDashboardMetrics(props),
      { initialProps: baseArgs }
    );
    const first = result.current;
    rerender({ ...baseArgs });
    expect(result.current).toBe(first);
  });

  it("recomputa cuando cambia allowedDays (prórroga)", () => {
    const { result, rerender } = renderHook(
      (props) => useDashboardMetrics(props),
      { initialProps: baseArgs }
    );
    const first = result.current;
    rerender({ ...baseArgs, allowedDays: 120 });
    expect(result.current).not.toBe(first);
    // Entrada + 119 días = 2026-12-12 → 41 días restantes desde 2026-11-01.
    expect(result.current.daysRemaining).toBe(41);
  });

  it("recomputa cuando cambia el día (todayKey)", () => {
    const { result, rerender } = renderHook(
      (props) => useDashboardMetrics(props),
      { initialProps: baseArgs }
    );
    const first = result.current;
    rerender({ ...baseArgs, todayKey: "2026-11-02" });
    expect(result.current).not.toBe(first);
    expect(result.current.daysAbroad).toBe(79);
    expect(result.current.daysRemaining).toBe(10);
  });
});

describe("useToday", () => {
  it("devuelve la clave ISO local de hoy", () => {
    const { result } = renderHook(() => useToday());
    expect(result.current).toBe(formatDateISO(new Date()));
  });
});
