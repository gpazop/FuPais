// ========================================================
// FUPAIS — Smoke test integral de <App />
//
// ¿Por qué existe este archivo?
// El 2026-11-02 la app quedó en blanco en producción con la suite en
// verde (119/119): un `ReferenceError` por un identificador inexistente
// en el array de dependencias de un useCallback de App.jsx. Ni el build
// de Vite ni las pruebas por componente detectan esa clase de fallo,
// porque nadie montaba el controlador completo.
//
// Estas pruebas son el gate que faltaba: si <App /> no puede renderizar
// con el estado por defecto, con un estado persistido parcial o con
// localStorage corrupto, CI falla antes del deploy.
//
// El mapa real (Leaflet + react-leaflet) necesita layout de navegador y
// ya tiene cobertura propia en tests/map.test.js y en la verificación
// E2E; aquí se sustituye por un stub para aislar el árbol de React.
// ========================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../src/ui/components/map/Map.jsx", () => ({
  default: () => <div id="real-google-map" data-testid="map-stub" />
}));

import App from "../src/ui/App.jsx";
import AppErrorBoundary from "../src/ui/components/AppErrorBoundary.jsx";
import DayModal from "../src/ui/components/DayModal.jsx";
import { STORAGE_KEY } from "../src/state/store.js";
import { buildDashboard } from "../src/domain/dashboard.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("<App /> (smoke integral)", () => {
  it("monta el controlador completo y renderiza la vista inicio", async () => {
    render(<App />);

    // El estado hidrata de forma asíncrona: se espera al primer render útil.
    expect(await screen.findByText("Días Fuera de tu País")).toBeTruthy();

    // Las 5 vistas del dock existen en el DOM (se muestran por CSS).
    for (const id of [
      "view-inicio",
      "view-mapa",
      "view-archivos",
      "view-perfil",
      "view-configuracion"
    ]) {
      expect(document.getElementById(id)).toBeTruthy();
    }
    expect(document.getElementById("view-inicio").className).toContain("active");
    expect(document.getElementById("real-google-map")).toBeTruthy();
    expect(document.getElementById("fupais-dock")).toBeTruthy();
  });

  it("no se queda en blanco con un estado persistido parcial (sin completedProcedures/customEvents)", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        presetId: "colombia_intercambio",
        entryDateStr: "2026-08-15",
        allowedDays: 90
      })
    );

    render(<App />);

    expect(await screen.findByText("Días Fuera de tu País")).toBeTruthy();
    expect(document.getElementById("view-inicio")).toBeTruthy();
  });

  it("no se queda en blanco con localStorage corrupto (JSON inválido)", async () => {
    localStorage.setItem(STORAGE_KEY, "{esto-no-es-json");

    render(<App />);

    // El puerto de storage descarta el JSON inválido y loadState() usa el
    // estado por defecto: la app debe arrancar igualmente.
    expect(await screen.findByText("Días Fuera de tu País")).toBeTruthy();
  });

  it("sanea una fecha de entrada no ISO (causa de RangeError en render)", async () => {
    // 'Intl.DateTimeFormat' lanza RangeError con una fecha inválida y el
    // fallback visual nunca lo habría mostrado como error recuperable.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        presetId: "colombia_intercambio",
        entryDateStr: "15/10/2026",
        allowedDays: 90,
        originCountry: "Perú",
        destinationCountry: "Colombia",
        visaType: "Estudiante de Intercambio (PIP-2)",
        completedProcedures: {},
        customEvents: []
      })
    );

    render(<App />);

    expect(await screen.findByText("Días Fuera de tu País")).toBeTruthy();
    expect(document.getElementById("view-inicio")).toBeTruthy();
  });
});

describe("<AppErrorBoundary />", () => {
  it("muestra un fallback visible en vez de una pantalla en blanco", () => {
    // React registra el error por consola; se silencia para no ensuciar la
    // salida de CI (el boundary ya hace su propio console.error).
    vi.spyOn(console, "error").mockImplementation(() => {});

    function Bomb() {
      throw new Error("fallo de render simulado");
    }

    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain("algo salió mal");
    expect(alert.textContent).toContain("fallo de render simulado");
    expect(screen.getByText("Recargar la aplicación")).toBeTruthy();
  });
});

describe("<DayModal /> (regresión: orden de hooks)", () => {
  // Regresión del bug detectado en verificación: el componente se renderizaba
  // cerrado (1 hook) y al abrirse ejecutaba un useEffect extra (2 hooks) porque
  // el early return estaba antes del efecto. React lanzaba #310 y el modal
  // nunca aparecía al pulsar un día del calendario.
  const metrics = buildDashboard({
    profile: {
      entryDateStr: "2026-08-15",
      allowedDays: 90,
      countryCode: "CO",
      ruleKey: "tourist"
    },
    tasks: [],
    today: "2026-11-01"
  });

  const props = {
    onClose: vi.fn(),
    dateStr: "2026-11-05",
    selectedDate: new Date(2026, 10, 5),
    metrics,
    customEvents: [],
    onAddEvent: vi.fn(),
    onDeleteEvent: vi.fn()
  };

  it("abre el detalle del día después de haberse renderizado cerrado", () => {
    const { rerender } = render(<DayModal open={false} {...props} />);
    expect(document.getElementById("day-modal")).toBeNull();

    expect(() => rerender(<DayModal open={true} {...props} />)).not.toThrow();

    expect(document.getElementById("day-modal")).toBeTruthy();
    expect(screen.getByText(/fuera de tu país/)).toBeTruthy();
  });
});
