// ========================================================
// FUPAIS — Tests RTL de las vistas nuevas (Archivos/Perfil/Settings)
// ========================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SettingsPanel from "../src/ui/components/SettingsPanel.jsx";
import ProfileView from "../src/ui/components/ProfileView.jsx";
import Vault from "../src/ui/components/Vault.jsx";
import { buildDashboard } from "../src/domain/dashboard.js";
import { initialSampleFiles } from "../src/components/dock/constants.js";

afterEach(cleanup);

describe("<SettingsPanel />", () => {
  const settings = {
    activeTab: "inicio",
    position: "bottom",
    magnify: true,
    autoHide: false,
    isHidden: false,
    theme: "light",
    soundEnabled: true
  };

  it("emite parches de posición y tema desde los segmented controls", () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={settings} onChange={onChange} />);
    fireEvent.click(screen.getByText("Izquierda"));
    expect(onChange).toHaveBeenCalledWith({ position: "left" });
    fireEvent.click(screen.getByText("Oscuro"));
    expect(onChange).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("emite parches booleanos desde los switches iOS", () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={settings} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Auto-ocultar dock"));
    expect(onChange).toHaveBeenCalledWith({ autoHide: true });
    fireEvent.click(screen.getByLabelText("Efecto de ampliación"));
    expect(onChange).toHaveBeenCalledWith({ magnify: false });
  });

  it("marca como activos los valores vigentes (aria-pressed)", () => {
    render(
      <SettingsPanel
        settings={{ ...settings, position: "top", theme: "dark" }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Arriba").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Abajo").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Oscuro").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("<ProfileView />", () => {
  const metrics = buildDashboard({
    profile: { entryDateStr: "2026-10-15", allowedDays: 90, countryCode: "CO", ruleKey: "tourist" },
    tasks: [
      { id: "p1", title: "A", targetDate: new Date(2026, 9, 20) },
      { id: "p2", title: "B", targetDate: new Date(2026, 10, 3) }
    ],
    today: "2026-11-01"
  });
  metrics.resolvedProcedures = [
    { done: true, targetDate: new Date(2026, 9, 20) },
    { done: false, targetDate: new Date(2026, 10, 3) },
    { done: true, targetDate: new Date(2026, 10, 10) }
  ];
  const state = {
    destinationCountry: "Colombia",
    originCountry: "Perú",
    visaType: "Estudiante de Intercambio (PIP-2)",
    allowedDays: 90
  };
  const preset = { countryCode: "CO", flag: "🇨🇴", destinationCountry: "Colombia", visaType: "PIP-2" };

  it("renderiza el pasaporte con destino, visa y sello de estado", () => {
    render(
      <ProfileView state={state} metrics={metrics} preset={preset} onOpenConfig={vi.fn()} />
    );
    expect(screen.getAllByText(/Colombia/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Estudiante de Intercambio/)).toBeTruthy();
    expect(screen.getByText(/Vigente|Atención/)).toBeTruthy();
  });

  it("muestra el resumen de estancia y el conteo de trámites", () => {
    render(
      <ProfileView state={state} metrics={metrics} preset={preset} onOpenConfig={vi.fn()} />
    );
    expect(screen.getByText("17 / 90")).toBeTruthy();
    expect(screen.getByText("2 de 3")).toBeTruthy();
    expect(screen.getByText(/Vencimiento legal/)).toBeTruthy();
  });

  it("el botón de ajustar fechas delega en onOpenConfig", () => {
    const onOpenConfig = vi.fn();
    render(
      <ProfileView state={state} metrics={metrics} preset={preset} onOpenConfig={onOpenConfig} />
    );
    fireEvent.click(screen.getByText("Ajustar fechas del viaje"));
    expect(onOpenConfig).toHaveBeenCalledTimes(1);
  });

  it("no explota sin estado (guard)", () => {
    const { container } = render(
      <ProfileView state={null} metrics={null} preset={null} onOpenConfig={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("<Vault />", () => {
  it("renderiza las fichas y el dropzone", () => {
    render(<Vault files={initialSampleFiles} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
    expect(screen.getByText(/Arrastra tus documentos aquí/)).toBeTruthy();
    expect(screen.getByText(/Pasaporte_Ordinario_Peruano\.pdf/)).toBeTruthy();
    expect(screen.getByText(/Formulario_FUT_Prorroga_Borrador\.pdf/)).toBeTruthy();
  });

  it("filtra por categoría con el segmented control", () => {
    render(<Vault files={initialSampleFiles} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
    expect(screen.getAllByText(/_Peruano\.pdf|_ElDorado\.jpg|SantoTomas\.pdf|Borrador\.pdf/).length).toBe(4);
    fireEvent.click(screen.getByText("Visas y Sellos"));
    expect(screen.getByText(/Sello_Ingreso_PIP2_ElDorado\.jpg/)).toBeTruthy();
    expect(screen.queryByText(/Pasaporte_Ordinario_Peruano\.pdf/)).toBeNull();
    fireEvent.click(screen.getByText("Todos"));
    expect(screen.getByText(/Pasaporte_Ordinario_Peruano\.pdf/)).toBeTruthy();
  });

  it("dispara onRemoveFile con el id de la ficha", () => {
    const onRemoveFile = vi.fn();
    render(<Vault files={initialSampleFiles} onAddFiles={vi.fn()} onRemoveFile={onRemoveFile} />);
    fireEvent.click(screen.getByLabelText(`Eliminar ${initialSampleFiles[0].name}`));
    expect(onRemoveFile).toHaveBeenCalledWith(initialSampleFiles[0].id);
  });

  it("el input de archivo oculto dispara onAddFiles (vía change)", () => {
    const onAddFiles = vi.fn();
    const { container } = render(
      <Vault files={[]} onAddFiles={onAddFiles} onRemoveFile={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]');
    const file = new File(["contenido"], "Pasaporte_Nuevo.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);
    expect(onAddFiles).toHaveBeenCalledTimes(1);
    expect(onAddFiles.mock.calls[0][0][0].name).toBe("Pasaporte_Nuevo.pdf");
  });

  it("muestra el estado vacío cuando el filtro no tiene resultados", () => {
    render(<Vault files={[]} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
    expect(
      screen.getByText(/No hay documentos en esta categoría/)
    ).toBeTruthy();
  });
});
