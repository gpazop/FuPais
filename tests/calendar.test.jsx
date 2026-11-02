// ========================================================
// FUPAIS — Tests del calendario declarativo y toasts (Sprint 4)
// Cubre: utilidad pura buildMonthGrid (grilla, conteo inclusivo,
// hoy, límite, ventana de prórroga, eventos), navegación RTL del
// calendario y el ciclo de vida de los toasts React.
// ========================================================

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, act } from "@testing-library/react";
import { buildDashboard } from "../src/domain/dashboard.js";
import { buildMonthGrid } from "../src/ui/domain/monthGrid.js";
import { formatDateISO } from "../src/domain/dates.js";
import Calendar from "../src/ui/components/Calendar.jsx";
import { useToasts } from "../src/ui/hooks/useToasts.js";

function buildTestMetrics({ entryDateStr, allowedDays, today }) {
  return buildDashboard({
    profile: { entryDateStr, allowedDays, countryCode: "CO", ruleKey: "tourist" },
    tasks: [],
    today
  });
}

const cellByDate = (grid, iso) => grid.cells.find((c) => c.dateISO === iso);

describe("buildMonthGrid (utilidad pura)", () => {
  it("construye la grilla de noviembre 2026 con relleno exacto (42 celdas)", () => {
    // 1 nov 2026 es domingo → 6 celdas mudas de octubre (26–31).
    // 30 días + 6 cola + 6 cabeza = 42.
    const metrics = buildTestMetrics({
      entryDateStr: "2026-10-15",
      allowedDays: 90,
      today: "2026-11-01"
    });
    const grid = buildMonthGrid({
      year: 2026,
      month: 10,
      metrics,
      customEvents: []
    });
    expect(grid.monthTitle).toBe("Noviembre 2026");
    expect(grid.cells).toHaveLength(42);
    expect(grid.cells[0].muted).toBe(true);
    expect(grid.cells[0].dayNum).toBe(26);
    expect(grid.cells[6].muted).toBe(false);
    expect(grid.cells[6].dateISO).toBe("2026-11-01");
    expect(grid.cells[41].muted).toBe(true);
    expect(grid.cells[41].dayNum).toBe(6);
  });

  it("aplica el conteo inclusivo: 15 oct = Día 1 → 1 nov = Día 18", () => {
    const metrics = buildTestMetrics({
      entryDateStr: "2026-10-15",
      allowedDays: 90,
      today: "2026-11-01"
    });
    const grid = buildMonthGrid({ year: 2026, month: 10, metrics });
    const first = cellByDate(grid, "2026-11-01");
    expect(first.counter.text).toBe("Día 18");
    expect(first.classes).toContain("day-today");
    expect(first.classes).toContain("day-abroad");
  });

  it("marca el vencimiento legal con LÍMITE + day-deadline", () => {
    // Entrada 1 sep + 90 días inclusivos → vencimiento 29 nov 2026.
    const metrics = buildTestMetrics({
      entryDateStr: "2026-09-01",
      allowedDays: 90,
      today: "2026-11-20"
    });
    const grid = buildMonthGrid({ year: 2026, month: 10, metrics });
    const deadline = cellByDate(grid, "2026-11-29");
    expect(deadline.counter).toEqual({ text: "LÍMITE", ember: true });
    expect(deadline.classes).toContain("day-deadline");

    // La ventana de prórroga se verifica contra las fechas DERIVADAS
    // por el dominio (robusto ante ajustes de windows.js).
    const windowStart = cellByDate(
      grid,
      formatDateISO(metrics.prorrogaWindowStartDate)
    );
    expect(windowStart.classes).toContain("day-prorroga-window");
  });

  it("adjunta trámites y eventos personales a su día", () => {
    const metrics = buildTestMetrics({
      entryDateStr: "2026-10-15",
      allowedDays: 90,
      today: "2026-11-01"
    });
    metrics.resolvedProcedures = [
      { title: "Trámite urgentísimo", targetDate: new Date(2026, 10, 5), urgent: true },
      { title: "Trámite normal", targetDate: new Date(2026, 10, 7), urgent: false }
    ];
    const grid = buildMonthGrid({
      year: 2026,
      month: 10,
      metrics,
      customEvents: [{ id: "ev-1", title: "Entrega de documentos", date: "2026-11-05" }]
    });
    const day5 = cellByDate(grid, "2026-11-05");
    expect(day5.procedures).toHaveLength(1);
    expect(day5.procedures[0].urgent).toBe(true);
    expect(day5.events).toEqual([
      { id: "ev-1", title: "Entrega de documentos", date: "2026-11-05" }
    ]);
    const day7 = cellByDate(grid, "2026-11-07");
    expect(day7.procedures[0].urgent).toBe(false);
  });
});

describe("<Calendar /> (RTL)", () => {
  const metrics = buildTestMetrics({
    entryDateStr: "2026-10-15",
    allowedDays: 90,
    today: "2026-11-01"
  });

  afterEach(cleanup);

  it("renderiza el mes activo y navega prev/next/Hoy", () => {
    render(<Calendar metrics={metrics} customEvents={[]} onDateSelect={vi.fn()} />);
    expect(screen.getByText("Noviembre 2026")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Mes siguiente"));
    expect(screen.getByText("Diciembre 2026")).toBeTruthy();
    fireEvent.click(screen.getByText("Hoy"));
    expect(screen.getByText("Noviembre 2026")).toBeTruthy();
  });

  it("dispara onDateSelect con el ISO del día clicado (y no en celdas mudas)", () => {
    const onDateSelect = vi.fn();
    const { container } = render(
      <Calendar metrics={metrics} customEvents={[]} onDateSelect={onDateSelect} />
    );
    fireEvent.click(container.querySelector('[data-date="2026-11-05"]'));
    expect(onDateSelect).toHaveBeenCalledWith("2026-11-05");
    onDateSelect.mockClear();
    fireEvent.click(container.querySelector(".cal-day.day-muted"));
    expect(onDateSelect).not.toHaveBeenCalled();
  });

  it("renderiza la píldora del evento personal", () => {
    render(
      <Calendar
        metrics={metrics}
        customEvents={[{ id: "ev-1", title: "Entrega de documentos", date: "2026-11-05" }]}
        onDateSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/Entrega de documentos/)).toBeTruthy();
  });

  it("NO resetea la vista al recomputar métricas (fix del salto vanilla)", () => {
    const { rerender } = render(
      <Calendar metrics={metrics} customEvents={[]} onDateSelect={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle("Mes siguiente"));
    expect(screen.getByText("Diciembre 2026")).toBeTruthy();
    // Las métricas cambian de identidad (mismo mes de hoy) → la vista persiste.
    const newMetrics = buildTestMetrics({
      entryDateStr: "2026-10-15",
      allowedDays: 91,
      today: "2026-11-01"
    });
    rerender(<Calendar metrics={newMetrics} customEvents={[]} onDateSelect={vi.fn()} />);
    expect(screen.getByText("Diciembre 2026")).toBeTruthy();
  });
});

describe("useToasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("notifica, apila y auto-descarta tras la duración", () => {
    const { result } = renderHook(() => useToasts({ duration: 4000 }));
    act(() => result.current.notify("Primera"));
    act(() => result.current.notify("Segunda"));
    expect(result.current.toasts).toHaveLength(2);

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.toasts).toHaveLength(0);
  });

  it("dismiss elimina un toast específico antes del timeout", () => {
    const { result } = renderHook(() => useToasts({ duration: 4000 }));
    act(() => result.current.notify("A"));
    act(() => result.current.notify("B"));
    const idA = result.current.toasts[0].id;
    act(() => result.current.dismiss(idA));
    expect(result.current.toasts.map((t) => t.message)).toEqual(["B"]);
  });
});
