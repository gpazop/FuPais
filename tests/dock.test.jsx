// ========================================================
// FUPAIS — Smoke tests del dock declarativo (Sprint 2)
// Cubre los criterios de aceptación: tabs por estado, atajos una
// sola vez, chrome de ajustes, spotlight funcional y persistencia
// de preferencias con la clave legacy.
// ========================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  renderHook,
  act
} from "@testing-library/react";
import Dock from "../src/ui/components/dock/Dock.jsx";
import { useDockSettings } from "../src/ui/hooks/useDockSettings.js";
import {
  DOCK_STORAGE_KEY,
  defaultDockSettings
} from "../src/components/dock/constants.js";
import { storage } from "../src/services/storage.js";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  document.body.className = "";
  window.localStorage.clear();
});

describe("<Dock /> declarativo", () => {
  it("renderiza los ítems con sus aria-labels (paridad de marcado)", () => {
    render(<Dock activeTab="inicio" onTabChange={vi.fn()} />);
    expect(screen.getByLabelText("Inicio")).toBeTruthy();
    expect(screen.getByLabelText("Mapa y Seguimiento")).toBeTruthy();
    expect(screen.getByLabelText("Búsqueda")).toBeTruthy();
    expect(screen.getByLabelText("Configuración")).toBeTruthy();
    expect(screen.getByLabelText("Ocultar")).toBeTruthy();
  });

  it("deriva la pestaña activa del estado y dispara onTabChange al clic", () => {
    const onTabChange = vi.fn();
    render(<Dock activeTab="inicio" onTabChange={onTabChange} />);
    expect(screen.getByLabelText("Inicio").className).toContain("active");
    expect(screen.getByLabelText("Inicio").className).not.toContain("neighbor-1");

    fireEvent.click(screen.getByLabelText("Mapa y Seguimiento"));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith("mapa");
  });

  it("aplica el efecto de vecindad (neighbor-1) según el hover", () => {
    render(<Dock activeTab="inicio" magnify onTabChange={vi.fn()} />);
    const mapa = screen.getByLabelText("Mapa y Seguimiento");
    fireEvent.mouseEnter(mapa);
    // Vecinos inmediatos de 'mapa' en el índice de ítems: inicio y búsqueda.
    expect(screen.getByLabelText("Inicio").className).toContain("neighbor-1");
    expect(screen.getByLabelText("Búsqueda").className).toContain("neighbor-1");
    expect(mapa.className).not.toContain("neighbor-1");
    fireEvent.mouseLeave(mapa);
    expect(screen.getByLabelText("Inicio").className).not.toContain("neighbor-1");
  });

  it("Cmd/Ctrl+K y Cmd/Ctrl+D disparan UNA sola vez por pulsación", () => {
    const onSpotlightChange = vi.fn();
    const onHiddenChange = vi.fn();
    render(
      <Dock
        activeTab="inicio"
        spotlightOpen={false}
        onSpotlightChange={onSpotlightChange}
        isHidden={false}
        onHiddenChange={onHiddenChange}
      />
    );
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(onSpotlightChange).toHaveBeenCalledTimes(2);
    expect(onSpotlightChange).toHaveBeenNthCalledWith(1, true);
    expect(onSpotlightChange).toHaveBeenNthCalledWith(2, true);

    fireEvent.keyDown(document, { key: "d", metaKey: true });
    expect(onHiddenChange).toHaveBeenCalledWith(true);
  });

  it("Cmd/Ctrl+3 navega a la pestaña archivos", () => {
    const onTabChange = vi.fn();
    render(<Dock activeTab="inicio" onTabChange={onTabChange} />);
    fireEvent.keyDown(document, { key: "3", ctrlKey: true });
    expect(onTabChange).toHaveBeenCalledWith("archivos");
  });

  it("aplica el chrome de ajustes: data-theme y dock-pos-* en el documento", () => {
    render(<Dock activeTab="inicio" position="left" theme="dark" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.body.className).toContain("dock-pos-left");
  });

  it("el peek handle refleja el estado oculto de forma declarativa", () => {
    const { rerender } = render(
      <Dock activeTab="inicio" isHidden={false} onHiddenChange={vi.fn()} />
    );
    const peek = screen.getByTitle("Clic para mostrar la Barra");
    expect(peek.style.opacity).toBe("0.4");
    rerender(<Dock activeTab="inicio" isHidden onHiddenChange={vi.fn()} />);
    expect(peek.style.opacity).toBe("1");
  });

  it("el spotlight filtrado ejecuta la acción del resultado (Enter)", () => {
    const onApplyPreset = vi.fn();
    render(
      <Dock
        activeTab="inicio"
        spotlightOpen
        onSpotlightChange={vi.fn()}
        onApplyPreset={onApplyPreset}
        onTabChange={vi.fn()}
      />
    );
    const input = screen.getByPlaceholderText(/Buscar países/);
    fireEvent.change(input, { target: { value: "perú" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onApplyPreset).toHaveBeenCalledTimes(1);
  });

  it("el drawer se cierra con backdrop y botón, y muestra el destino activo", () => {
    const onDrawerChange = vi.fn();
    render(
      <Dock
        activeTab="inicio"
        drawerOpen
        onDrawerChange={onDrawerChange}
        activeDestination="🇵🇪 Perú — Turismo"
      />
    );
    expect(screen.getByText("🇵🇪 Perú — Turismo")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Cerrar menú"));
    expect(onDrawerChange).toHaveBeenCalledWith(false);
  });
});

describe("useDockSettings", () => {
  it("hidrata defaults y persiste cambios en la clave legacy", async () => {
    const { result } = renderHook(() => useDockSettings());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.settings).toEqual(defaultDockSettings);

    act(() => result.current.updateSettings({ position: "top" }));
    await waitFor(() => expect(result.current.settings.position).toBe("top"));

    const persisted = await storage.get(DOCK_STORAGE_KEY);
    expect(persisted.position).toBe("top");
  });
});
