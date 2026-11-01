# AGENTS.md — FuPais

App web (Vite + JS vanilla, sin framework) para controlar días de permanencia legal en el extranjero. Todo el estado vive en el navegador. El único backend es un proxy serverless de geocodificación (`api/geocode.js`), sin base de datos ni sesiones.

## Comandos

- `npm run dev` — Vite en http://localhost:5173
- `npm test` — vitest sobre `tests/` (66 tests). Es la única verificación automática del repo.
- `npm run build` — build a `dist/`
- `npm run preview` — sirve el build

No hay linter, formatter ni CI configurados. No uses `npx vitest run --reporter=basic`: ese reporter no existe en vitest 5.

La app **no funciona abriendo `index.html` por `file://`**: necesita servidor HTTP (módulos ES y entrada absoluta `/src/main.js`).

## Arquitectura

Dirección de dependencias, sin excepciones:

```
domain → data → state → services → ui
```

- `src/domain/` — cálculo puro sin DOM: `buildDashboard`, reglas de ventana (`rules.js`), fechas (`dates.js`), formato (`format.js`).
- `src/data/` — datos legales verificados (`presets.js`: `COUNTRY_RULES`, `COUNTRY_TASKS`) y `migrationPresets.js`.
- `src/state/store.js` — única capa de estado: `loadState` / `saveState` / `subscribe` / `notify`, `STORAGE_KEY = "fupais_state_v2"`.
- `src/services/storage.js` — puerto async (`get` / `set` / `remove`, `setStorageAdapter`).
- `src/services/adapters/localStorageAdapter.js` — **el único archivo que toca `window.localStorage`**.
- `src/services/geocoding.js` — puerto async de geocodificación (`reverseGeocode`, `searchPlace`, `setGeocodingAdapter`).
- `src/services/adapters/apiGeocodingAdapter.js` — cliente de `/api/geocode`; es el adapter que se enchufa en `src/main.js`.
- `src/services/adapters/publicGeocodingAdapter.js` — el único módulo que habla con BigDataCloud/Nominatim. En producción corre en el servidor, no en el navegador.
- `src/ui/app.js` — orquestador: posee el objeto de estado y llama `commit()` tras cada mutación.
- `src/components/` — `dock.js` (fachada del dock estilo iOS) con sus módulos en `src/components/dock/` (`map`, `drawer`, `spotlight`, `vault`, `settings`, `constants`), y `calendar.js`.
- `api/geocode.js` — handler serverless `GET /api/geocode` con dos modos (`?lat&lng` → `{city,country}`, `?q` → `{lat,lng}`). `vite.config.js` monta el mismo handler en `dev` y `preview`, así que dev y prod comparten ruta.

El CSS no se importa desde JS: `index.html` carga `css/base`, `css/components` y `css/layout` por `<link>`, y Leaflet 1.9.4 desde CDN. `css/styles.css` y `js/` son residuos del diseño anterior; no los edites.

## Reglas de dominio que no se rompen

- **El vencimiento nunca se guarda**: siempre se deriva de `{ entryDateStr, allowedDays }`. La llegada es el **Día 1**, así que vence en `addDays(entryDate, allowedDays - 1)`. Por eso 90 días se muestran como `/ 89 días autorizados` en `#stat-total-allowed`.
- El registro público expone solo tres presets: `colombia_intercambio`, `colombia_turista`, `peru_turista`.
- No inventes datos legales. Un claim no verificado contra la fuente oficial va a la cola de revisión; no se reescribe ni se "mejora".
- Las claves de storage (`fupais_state_v2`, `fupais_dock_preferences_v1`, `fupais_vault_files_v1`) **no se renombran**: hay datos de usuarios guardados.

## Fronteras de la UI

- `src/ui/` y `src/components/` **nunca** llaman `localStorage` ni `fetch` directamente. El estado va por `store.js`; la persistencia por el puerto `services/storage.js`; la geocodificación por el puerto `services/geocoding.js`.
- Los únicos `fetch` del repo están en `src/services/adapters/publicGeocodingAdapter.js` (upstream real) y `src/services/adapters/apiGeocodingAdapter.js` (proxy propio). No añadas más.
- `index.html` invoca inline `window.fuPaisDock.switchTab` / `openSpotlight` / `closeDrawer` y `window.fuPaisApp.openConfigModal()`, y los popups del mapa usan `window.fuPaisApp.applyPreset(...)`. Esa API pública debe sobrevivir a cualquier división de `dock.js`.

## Flujo de trabajo

- Rama de trabajo: `feat/nuevo-diseno`. Nunca big-bang a `main`; el merge va por PR.
- **Antes de commitear o pushear, muestra al usuario exactamente qué archivos y diffs entran y espera su confirmación explícita.** No commitees por iniciativa propia.
- Al cerrar un cambio: `npm test` en verde y `npm run build` limpio.

## Grafo del código

`graphify-out/` (ignorado por git) contiene el grafo del proyecto. Para preguntas sobre el código: `graphify query "<pregunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<concepto>"`. Tras modificar código: `graphify update .`
