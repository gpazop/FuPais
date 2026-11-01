import { describe, it, expect, afterEach, vi } from 'vitest';
import handler from '../api/geocode.js';
import { apiGeocodingAdapter } from '../src/services/adapters/apiGeocodingAdapter.js';

// --------------------------------------------------------
// Harness mínimo de req/res: el handler es un Node handler
// puro, así que no hace falta levantar HTTP de verdad.
// --------------------------------------------------------
const createRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    headersSent: false,
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      res.body = chunk ?? '';
      res.headersSent = true;
    }
  };
  return res;
};

const invoke = async (url, method = 'GET') => {
  const res = createRes();
  await handler({ url, method }, res);
  return { res, json: res.body ? JSON.parse(res.body) : null };
};

const okJson = (payload) => ({ ok: true, status: 200, json: async () => payload });

const stubFetch = (impl) => vi.stubGlobal('fetch', vi.fn(impl));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/geocode?lat&lng', () => {
  it('devuelve ciudad y país desde el upstream', async () => {
    stubFetch(async () => okJson({ city: 'Bogotá', countryName: 'Colombia' }));

    const { res, json } = await invoke('/api/geocode?lat=4.6&lng=-74.08');

    expect(res.statusCode).toBe(200);
    expect(json).toEqual({ city: 'Bogotá', country: 'Colombia' });
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
  });

  it('cachea en el edge durante un día', async () => {
    stubFetch(async () => okJson({ city: 'Lima', countryName: 'Perú' }));

    const { res } = await invoke('/api/geocode?lat=-12.05&lng=-77.04');

    expect(res.headers['cache-control']).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    );
  });

  it('envía Accept y User-Agent al upstream (Nominatim lo exige)', async () => {
    const fetchMock = vi.fn(async () => okJson({ city: 'Madrid', countryName: 'España' }));
    vi.stubGlobal('fetch', fetchMock);

    await invoke('/api/geocode?lat=40.4&lng=-3.7');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toMatchObject({
      Accept: 'application/json',
      'User-Agent': 'FuPais/1.0 (+https://github.com/gpazop/FuPais)'
    });
  });

  it('responde 404 cuando el upstream no devuelve nada usable', async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));

    const { res, json } = await invoke('/api/geocode?lat=4.6&lng=-74.08');

    expect(res.statusCode).toBe(404);
    expect(json).toEqual({ error: 'not_found' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('responde 502 si el upstream lanza', async () => {
    stubFetch(async () => {
      throw new Error('network down');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { res, json } = await invoke('/api/geocode?lat=4.6&lng=-74.08');

    expect(res.statusCode).toBe(502);
    expect(json).toEqual({ error: 'upstream_unavailable' });
  });
});

describe('GET /api/geocode?q', () => {
  it('devuelve coordenadas desde el upstream', async () => {
    stubFetch(async () => okJson([{ lat: '4.60971', lon: '-74.08175' }]));

    const { res, json } = await invoke('/api/geocode?q=Bogota');

    expect(res.statusCode).toBe(200);
    expect(json).toEqual({ lat: 4.60971, lng: -74.08175 });
  });

  it('responde 404 si la búsqueda no tiene resultados', async () => {
    stubFetch(async () => okJson([]));

    const { res, json } = await invoke('/api/geocode?q=xyzxyzxyz');

    expect(res.statusCode).toBe(404);
    expect(json).toEqual({ error: 'not_found' });
  });
});

describe('validación de parámetros', () => {
  const invalid = [
    ['sin parámetros', '/api/geocode'],
    ['lat y lng junto a q', '/api/geocode?lat=4.6&lng=-74&q=Bogota'],
    ['solo lat', '/api/geocode?lat=4.6'],
    ['lat no numérico', '/api/geocode?lat=abc&lng=-74'],
    ['lat fuera de rango', '/api/geocode?lat=91&lng=0'],
    ['lng fuera de rango', '/api/geocode?lat=0&lng=-181'],
    ['q vacío', '/api/geocode?q=%20%20'],
    ['q demasiado largo', `/api/geocode?q=${'a'.repeat(161)}`]
  ];

  invalid.forEach(([label, url]) => {
    it(`responde 400 con ${label}`, async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const { res, json } = await invoke(url);

      expect(res.statusCode).toBe(400);
      expect(json.error).toBe('invalid_params');
      expect(typeof json.message).toBe('string');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

describe('métodos no soportados', () => {
  it('responde 405 con Allow: GET y no llama al upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, json } = await invoke('/api/geocode?lat=4.6&lng=-74', 'POST');

    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe('GET');
    expect(json).toEqual({ error: 'method_not_allowed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('apiGeocodingAdapter', () => {
  it('mapea 404 a null en reverseGeocode', async () => {
    stubFetch(async () => ({ ok: false, status: 404 }));

    await expect(apiGeocodingAdapter.reverseGeocode(4.6, -74)).resolves.toBeNull();
  });

  it('lanza en reverseGeocode si la API falla', async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));

    await expect(apiGeocodingAdapter.reverseGeocode(4.6, -74)).rejects.toThrow('500');
  });

  it('devuelve null si el payload de reverseGeocode no tiene forma válida', async () => {
    stubFetch(async () => okJson({ city: '   ' }));

    await expect(apiGeocodingAdapter.reverseGeocode(4.6, -74)).resolves.toBeNull();
  });

  it('mapea 404 a null en searchPlace', async () => {
    stubFetch(async () => ({ ok: false, status: 404 }));

    await expect(apiGeocodingAdapter.searchPlace('Bogota')).resolves.toBeNull();
  });

  it('llama al proxy con el query string esperado', async () => {
    const fetchMock = vi.fn(async () => okJson({ lat: 4.6, lng: -74.08 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiGeocodingAdapter.searchPlace('Bogotá');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/geocode?q=Bogot%C3%A1');
  });
});
