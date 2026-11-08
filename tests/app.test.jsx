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
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";

vi.mock("../src/ui/components/map/Map.jsx", () => ({
  default: () => <div id="real-google-map" data-testid="map-stub" />
}));

import App from "../src/ui/App.jsx";
import AppErrorBoundary from "../src/ui/components/AppErrorBoundary.jsx";
import DayModal from "../src/ui/components/DayModal.jsx";
import { defaultState, STORAGE_KEY } from "../src/state/store.js";
import { buildDashboard } from "../src/domain/dashboard.js";
import { DOCK_STORAGE_KEY } from "../src/components/dock/constants.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("<App /> (smoke integral)", () => {
  it("conecta Buscar, Más y el acceso al calendario desde otra vista", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<App />);
    await screen.findByText("Días Fuera de tu País");

    const search = screen.getByLabelText("Buscar países, trámites o fechas");
    search.focus();
    fireEvent.click(search);
    const spotlight = screen.getByRole("dialog", { name: "Spotlight" });
    fireEvent.keyDown(within(spotlight).getByRole("textbox"), { key: "Escape" });
    expect(document.activeElement).toBe(search);

    const more = screen.getByLabelText("Más");
    fireEvent.click(more);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    const drawer = screen.getByRole("dialog", { name: "Centro de Control" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Bóveda" }));
    expect(document.getElementById("view-archivos").classList.contains("active")).toBe(true);
    expect(more.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(screen.getByLabelText("Calendario"));
    expect(document.getElementById("view-inicio").classList.contains("active")).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("calendario"));
  }, 10000);

  it("persiste el tema elegido y lo aplica al volver a montar la aplicación", async () => {
    const { unmount } = render(<App />);
    await screen.findByText("Días Fuera de tu País");
    fireEvent.click(screen.getByRole("button", { name: "Oscuro" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DOCK_STORAGE_KEY)).theme).toBe("dark");
    });
    unmount();
    render(<App />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    fireEvent.click(screen.getByRole("button", { name: "Claro" }));
    expect(document.documentElement.dataset.theme).toBe("light");
  });

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
    expect(screen.queryByTestId("map-stub")).toBeNull();
    expect(document.getElementById("fupais-dock")).toBeTruthy();
  });

  it("monta el mapa al abrir su vista y conserva la instancia al volver", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<App />);
    await screen.findByText("Días Fuera de tu País");
    expect(screen.queryByTestId("map-stub")).toBeNull();

    const mapButton = screen.getByLabelText("Mapa y Seguimiento");
    fireEvent.click(mapButton);
    const map = await screen.findByTestId("map-stub");
    fireEvent.click(screen.getByLabelText("Resumen"));
    expect(screen.getByTestId("map-stub")).toBe(map);
    fireEvent.click(mapButton);
    expect(screen.getByTestId("map-stub")).toBe(map);
  }, 10000);

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

  it("mantiene el foco en el detalle, permite guardar con teclado y devuelve el foco al cerrar", () => {
    const onAddEvent = vi.fn();
    const onClose = vi.fn(() => rerender(content(false)));
    const content = (open) => (
      <>
        <button>Fecha seleccionada</button>
        <DayModal {...props} open={open} onClose={onClose} onAddEvent={onAddEvent} />
      </>
    );
    const { rerender } = render(content(false));
    const trigger = screen.getByRole("button", { name: "Fecha seleccionada" });
    trigger.focus();
    rerender(content(true));
    const dialog = screen.getByRole("dialog");
    const buttons = within(dialog).getAllByRole("button");
    const first = buttons[0];
    const last = buttons.at(-1);
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    const input = within(dialog).getByRole("textbox", { name: /Agregar recordatorio/ });
    fireEvent.change(input, { target: { value: "Entregar documentos" } });
    fireEvent.submit(input.form);
    expect(onAddEvent).toHaveBeenCalledWith("Entregar documentos", props.dateStr);
    fireEvent.keyDown(first, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("viaje y perfil confirmados", () => {
  function openTrip() {
    fireEvent.click(screen.getByRole("button", { name: "Ajustar fechas y perfil de viaje" }));
    return within(screen.getByRole("dialog"));
  }

  it("descarta al cancelar, cerrar o pulsar Escape, incluso tras cambiar el preset", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()));
    render(<App />);
    await screen.findByText("Días Fuera de tu País");
    const original = localStorage.getItem(STORAGE_KEY);

    for (const exit of ["Cancelar", "Cerrar", "Escape"]) {
      const dialog = openTrip();
      fireEvent.change(dialog.getByLabelText("Normativa de país de destino"), { target: { value: "peru_turista" } });
      fireEvent.change(dialog.getByLabelText("Duración autorizada (días)"), { target: { value: "45" } });
      expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
      expect(document.querySelector("#country-title").textContent).toContain("Colombia");
      if (exit === "Escape") {
        fireEvent.keyDown(dialog.getByLabelText("Fecha de ingreso"), { key: exit });
      } else {
        fireEvent.click(dialog.getByRole("button", { name: exit }));
      }
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
    }
  });

  it("valida, guarda un destino manual y recarga el viaje sin una ventana legal heredada", async () => {
    const { unmount } = render(<App />);
    await screen.findByText("Días Fuera de tu País");
    const dialog = openTrip();
    const duration = dialog.getByLabelText("Duración autorizada (días)");
    fireEvent.change(dialog.getByLabelText("País de destino"), { target: { value: "Japón" } });
    fireEvent.change(dialog.getByLabelText("Fecha de ingreso"), { target: { value: "2026-10-01" } });
    fireEvent.change(duration, { target: { value: "0" } });
    fireEvent.submit(duration.form);
    expect(dialog.getByRole("alert").textContent).toContain("duración");
    fireEvent.change(duration, { target: { value: "60" } });
    fireEvent.submit(duration.form);
    expect(screen.queryByRole("dialog")).toBeNull();

    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toMatchObject({
      presetId: null, destinationCountry: "Japón", allowedDays: 60, entryDateStr: "2026-10-01"
    }));
    expect(document.querySelector("#calendario").textContent).toContain("Fin del periodo indicado");
    expect(document.querySelector("#calendario .day-prorroga-window")).toBeNull();
    unmount();
    render(<App />);
    await screen.findByText(/Normativa automática no disponible/);
    expect(openTrip().getByLabelText("Duración autorizada (días)").value).toBe("60");
  });

  it("vuelve a Inicio desde el mapa mediante la marca", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<App />);
    await screen.findByText("Días Fuera de tu País");
    fireEvent.click(screen.getByLabelText("Mapa y Seguimiento"));
    expect(document.getElementById("view-mapa").classList.contains("active")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "FuPais, ir a Inicio" }));
    expect(document.getElementById("view-inicio").classList.contains("active")).toBe(true);
  });

  it("guarda solo los campos personales confirmados y los recupera al recargar", async () => {
    const { unmount } = render(<App />);
    await screen.findByText("Días Fuera de tu País");
    const profile = within(document.getElementById("view-perfil"));
    fireEvent.click(profile.getByRole("button", { name: "Editar perfil" }));
    fireEvent.change(profile.getByLabelText("Nombre", { exact: true }), { target: { value: " Ana " } });
    fireEvent.change(profile.getByLabelText("Nacionalidad"), { target: { value: "Perú" } });
    fireEvent.click(profile.getByRole("button", { name: "Guardar perfil" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).personalProfile).toEqual({
      firstName: "Ana", nationality: "Perú"
    }));
    unmount();
    render(<App />);
    expect(await screen.findByText("Ana")).toBeTruthy();
    expect(screen.queryByLabelText(/número de pasaporte/i)).toBeNull();
  });
});

it("anuncia un trámite completado y mantiene el aviso al navegar y cambiar de tema", async () => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(<App />);
  await screen.findByText("Días Fuera de tu País");
  fireEvent.click(screen.getByRole("button", { name: "Claro" }));
  const checkbox = document.querySelector("#tramites input:checked");
  expect(checkbox).toBeTruthy();
  fireEvent.click(checkbox);
  fireEvent.click(checkbox);
  const notice = document.querySelector('.toast-notice[data-kind="success"]');
  expect(notice.textContent).toContain("Trámite marcado como realizado");
  fireEvent.click(screen.getByLabelText("Mapa y Seguimiento"));
  fireEvent.click(screen.getByRole("button", { name: "Oscuro" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.querySelector(".toast-notice")).toBe(notice);
  fireEvent.click(within(notice).getByRole("button", { name: "Cerrar notificación" }));
  expect(document.querySelector(".toast-notice")).toBeNull();
});
