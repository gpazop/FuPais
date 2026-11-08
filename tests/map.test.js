// ========================================================
// FUPAIS — Tests de geotracking e íconos (Sprint 3)
// Cubre: reverse geocode vía puerto, zonas legales, GPS real (con
// permiso y sin soporte), búsqueda sin resultados y el contrato de
// identidad estable de los íconos Leaflet.
// ========================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGeoTracking } from "../src/ui/hooks/useGeoTracking.js";
import {
  setGeocodingAdapter,
  getGeocodingAdapter
} from "../src/services/geocoding.js";
import {
  getCountryPinIcon,
  radarIcon
} from "../src/ui/components/map/mapIcons.js";
import { MIGRATION_PRESETS } from "../src/data/migrationPresets.js";

const realAdapter = getGeocodingAdapter();

afterEach(() => {
  // jsdom no define navigator.geolocation por defecto; si un test lo
  // agregó con defineProperty configurable, esto lo elimina.
  delete globalThis.navigator?.geolocation;
  setGeocodingAdapter(realAdapter); // restaurar el adaptador global
  vi.restoreAllMocks();
});

function mockGeolocation(getCurrentPosition) {
  Object.defineProperty(globalThis.navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true
  });
}

describe("useGeoTracking", () => {
  it("identifica la posición inicial como referencia sin afirmar vigencia", () => {
    const { result } = renderHook(() => useGeoTracking({ destinationCountry: "Colombia" }));
    expect(result.current.meta.accuracy).toBe("Ubicación de referencia");
    expect(result.current.legalZone).toBe("País de destino (Colombia)");
  });

  it.each([null, { city: "Ciudad nueva", country: "" }])(
    "descarta el país anterior si la nueva respuesta es %j",
    async (location) => {
      setGeocodingAdapter({
        reverseGeocode: vi.fn().mockResolvedValue(location),
        searchPlace: vi.fn()
      });
      const { result } = renderHook(() => useGeoTracking({ destinationCountry: "Colombia" }));
      await act(() => result.current.setManualPosition(1, 2));
      expect(result.current.meta.city).toBe(location?.city || "");
      expect(result.current.meta.country).toBe("");
      expect(result.current.legalZone).toBe("País sin identificar");
      expect(result.current.resolving).toBe(false);
    }
  );

  it("ignora una geocodificación inversa anterior que termina después de la última selección", async () => {
    let finishOld;
    setGeocodingAdapter({
      reverseGeocode: vi.fn()
        .mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
        .mockResolvedValueOnce({ city: "Lima", country: "Perú" }),
      searchPlace: vi.fn()
    });
    const onNotify = vi.fn();
    const { result } = renderHook(() => useGeoTracking({ onNotify }));
    let oldRequest;
    act(() => { oldRequest = result.current.setManualPosition(1, 2); });
    expect(result.current.resolving).toBe(true);
    expect(result.current.meta.city).toBe("");
    await act(() => result.current.setManualPosition(3, 4));
    await act(async () => {
      finishOld({ city: "Bogotá", country: "Colombia" });
      await oldRequest;
    });
    expect(result.current.position).toEqual({ lat: 3, lng: 4 });
    expect(result.current.meta.city).toBe("Lima");
    expect(onNotify).toHaveBeenCalledTimes(1);
  });

  it("ignora una respuesta GPS tardía después de fijar una posición manual", async () => {
    let finishGps;
    mockGeolocation((success) => { finishGps = success; });
    setGeocodingAdapter({
      reverseGeocode: vi.fn().mockResolvedValue(null),
      searchPlace: vi.fn()
    });
    const { result } = renderHook(() => useGeoTracking());
    let gpsRequest;
    act(() => { gpsRequest = result.current.locate(); });
    await act(() => result.current.setManualPosition(3, 4));
    await act(async () => {
      finishGps({ coords: { latitude: 1, longitude: 2, accuracy: 8 } });
      expect(await gpsRequest).toBeNull();
    });
    expect(result.current.position).toEqual({ lat: 3, lng: 4 });
    expect(result.current.locating).toBe(false);
  });

  it("posición manual → reverse geocode vía el puerto y zona legal de origen", async () => {
    setGeocodingAdapter({
      reverseGeocode: vi.fn().mockResolvedValue({ city: "Lima", country: "Perú" }),
      searchPlace: vi.fn()
    });
    const { result } = renderHook(() =>
      useGeoTracking({
        destinationCountry: "Colombia",
        originCountry: "Perú",
        onNotify: vi.fn()
      })
    );
    await act(async () => {
      await result.current.setManualPosition(-12.0464, -77.0428);
    });
    expect(result.current.position).toEqual({ lat: -12.0464, lng: -77.0428 });
    expect(result.current.meta.city).toBe("Lima");
    expect(result.current.legalZone).toContain("País de Origen (Perú)");
  });

  it("posición en país extranjero → zona legal de extranjería + notificación", async () => {
    setGeocodingAdapter({
      reverseGeocode: vi.fn().mockResolvedValue({ city: "Madrid", country: "España" }),
      searchPlace: vi.fn()
    });
    const onNotify = vi.fn();
    const { result } = renderHook(() =>
      useGeoTracking({
        destinationCountry: "Colombia",
        originCountry: "Perú",
        onNotify
      })
    );
    await act(async () => {
      await result.current.setManualPosition(40.4168, -3.7038);
    });
    expect(result.current.legalZone).toContain("Territorio Extranjero (España)");
    expect(onNotify).toHaveBeenCalledWith(
      expect.stringContaining("📍 Posición fijada en: Madrid, España")
    );
  });

  it("locate() con GPS disponible actualiza posición, precisión y deja de 'locating'", async () => {
    setGeocodingAdapter({
      reverseGeocode: vi.fn().mockResolvedValue({ city: "Bogotá", country: "Colombia" }),
      searchPlace: vi.fn()
    });
    mockGeolocation(
      vi.fn((success) => {
        success({ coords: { latitude: 4.711, longitude: -74.0721, accuracy: 8 } });
      })
    );
    const { result } = renderHook(() => useGeoTracking({ onNotify: vi.fn() }));
    let coords;
    await act(async () => {
      coords = await result.current.locate();
    });
    expect(coords).toEqual({ lat: 4.711, lng: -74.0721 });
    expect(result.current.position).toEqual({ lat: 4.711, lng: -74.0721 });
    expect(result.current.meta.accuracy).toContain("±8m");
    expect(result.current.locating).toBe(false);
  });

  it("locate() sin soporte de geolocalización notifica y resuelve null", async () => {
    const onNotify = vi.fn();
    const { result } = renderHook(() => useGeoTracking({ onNotify }));
    let coords = "pending";
    await act(async () => {
      coords = await result.current.locate();
    });
    expect(coords).toBeNull();
    expect(onNotify).toHaveBeenCalledWith(
      expect.stringContaining("no soportada"), "warning"
    );
    expect(result.current.locating).toBe(false);
  });

  it("findPlace() sin resultados notifica y NO cambia la posición", async () => {
    setGeocodingAdapter({
      reverseGeocode: vi.fn(),
      searchPlace: vi.fn().mockResolvedValue(null)
    });
    const onNotify = vi.fn();
    const { result } = renderHook(() => useGeoTracking({ onNotify }));
    const before = result.current.position;
    let place = "pending";
    await act(async () => {
      place = await result.current.findPlace("Atlántida");
    });
    expect(place).toBeNull();
    expect(onNotify).toHaveBeenCalledWith(
      expect.stringContaining('No se encontró el lugar "Atlántida"'), "warning"
    );
    expect(result.current.position).toEqual(before);
  });

  it("findPlace() con resultado fija la posición manual (listo para flyRequest)", async () => {
    setGeocodingAdapter({
      reverseGeocode: vi.fn().mockResolvedValue({ city: "Cusco", country: "Perú" }),
      searchPlace: vi.fn().mockResolvedValue({ lat: -13.532, lng: -71.9675 })
    });
    const { result } = renderHook(() =>
      useGeoTracking({ destinationCountry: "Colombia", originCountry: "Perú", onNotify: vi.fn() })
    );
    let place = null;
    await act(async () => {
      place = await result.current.findPlace("Cusco");
    });
    expect(place).toEqual({ lat: -13.532, lng: -71.9675 });
    expect(result.current.position).toEqual({ lat: -13.532, lng: -71.9675 });
    expect(result.current.meta.city).toBe("Cusco");
  });
});

describe("mapIcons", () => {
  it("el radar es un singleton y los pines cachean identidad por presetId", () => {
    const peru = MIGRATION_PRESETS.peru_turista;
    const colombia = MIGRATION_PRESETS.colombia_intercambio;
    expect(getCountryPinIcon(peru)).toBe(getCountryPinIcon(peru));
    expect(getCountryPinIcon(colombia)).toBe(getCountryPinIcon(colombia));
    expect(getCountryPinIcon(peru)).not.toBe(getCountryPinIcon(colombia));
    expect(radarIcon).toBeTruthy();
  });
});
