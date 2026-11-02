# AGENTS.md — FuPais

App web (Vite 8 + React 19) para controlar días de permanencia legal en el extranjero. Todo el estado vive en el navegador. El único backend es un proxy serverless de geocodificación (`api/geocode.js`), sin base de datos ni sesiones.

## Comandos

- `npm run dev` — Vite en http://localhost:5173
- `npm test` — vitest sobre `tests/` (119 pruebas). Es la verificación automática del repo y el gate de CI.
- `npm run build` — build a `dist/`
- `npm run preview` — sirve el build

No hay linter ni formatter. Sí hay CI: `.github/workflows/ci.yml` ejecuta `npm test` + `npm run build` en push a `main` y en cada pull request. No uses `npx vitest run --reporter=basic`: ese reporter no existe en vitest 5.

La app **no funciona abriendo `index.html` por `file://`**: necesita servidor HTTP (módulos ES y entrada absoluta `/src/main.jsx`).

## Arquitectura

Dirección de dependencias, sin excepciones:

```
domain → data → state → services → ui
```

### Capas puras (no se reescriben; cubiertas por 66 pruebas)

- `src/domain/` — cálculo puro sin DOM: `buildDashboard` (`dashboard.js`), fechas (`dates.js`), ventanas operativas (`windows.js`), reglas (`rules.js`), formato (`format.js`).
- `src/data/` — datos legales verificados: `presets.js` (`COUNTRY_RULES`, `COUNTRY_TASKS`), `migrationPresets.js` (registro derivado con filtro de publicación), `presetPresentation.js`, `presetCoords.js`.
- `src/state/store.js` — `loadState` / `saveState` (+ `subscribe`/`notify`, hoy solo usados por sus tests), `STORAGE_KEY = "fupais_state_v2"`.
- `src/services/storage.js` — puerto async (`get` / `set` / `remove`); **el único archivo que toca `window.localStorage` es `adapters/localStorageAdapter.js`**.
- `src/services/geocoding.js` — puerto async de geocodificación (`reverseGeocode`, `searchPlace`, `setGeocodingAdapter`).
- `src/services/adapters/apiGeocodingAdapter.js` — cliente de `/api/geocode`; es el adapter que se enchufa en `src/main.jsx`.
- `src/services/adapters/publicGeocodingAdapter.js` — el único módulo que habla con BigDataCloud/Nominatim. En producción corre en el servidor, no en el navegador.
- `api/geocode.js` — handler serverless `GET /api/geocode` con dos modos (`?lat&lng` → `{city,country}`, `?q` → `{lat,lng}`). `vite.config.js` monta el mismo handler en `dev` y `preview`, así que dev y prod comparten ruta.

### Capa UI (React 19, 100% declarativa — cero clases vanilla)

- `src/main.jsx` — único entry point (con fallback visual si falla el montaje).
- `src/ui/App.jsx` — controlador: estado del viaje, métricas, vistas, modales, dock y radar.
- `src/ui/hooks/` — `useDashboardMetrics` (memo sobre `buildDashboard`), `useToday` (tick de medianoche), `usePersistedState` (hydrate + persistencia automática por efecto), `useDockSettings`, `useDockAudio`, `useDockShortcuts`, `useAutoHide`, `useGeoTracking` (GPS y reverse geocode vía puerto), `useToasts`, `useVaultFiles`.
- `src/ui/domain/` — lógica pura de UI testeable: `monthGrid.js` (grilla del calendario), `vaultFiles.js` (fichas de la bóveda).
- `src/ui/components/` — shell (Header, PresetSelector, SmartAlert, MetricCard, ProceduresList, CountryCards, ConfigModal, DayModal), `Calendar.jsx`, `Toast.jsx`, vistas (`Vault.jsx`, `ProfileView.jsx`, `SettingsPanel.jsx`), `dock/` (Dock, DockBar, DockItem, Spotlight, Drawer) y `map/` (Map, mapIcons, GpsHud, MapSearch, MapLayerSwitcher).
- `src/components/dock/constants.js` — claves de storage y defaults del dock (ruta legacy conservada a propósito).

### Convenciones UI (obligatorias)

- Cero `getElementById` / `innerHTML` / `createElement` en `ui/`. Los títulos de trámites y eventos son texto React (nunca HTML crudo — era vector XSS del diseño anterior).
- Estado del viaje: `usePersistedState` hidrata y persiste por efecto. **Nunca persistir dentro de handlers** (closure stale: se guardaría el estado anterior).
- Métricas: `useDashboardMetrics` memoiza `buildDashboard` sobre entradas primitivas + identidad de `tasks` + `todayKey`. No recomputar por render ni derivar con `useEffect` + `setState`.
- Callbacks que pasan a componentes memoizados (`Map`, `Dock`): identidad estable (setState funcional o refs "latest").
- Mapa (react-leaflet v5): instancia por `useMap`/`useMapEvents` (**NO** `onCreate` — no existe), markers con `eventHandlers` (**NO** `onClick`), `Popup` con estilos objeto, íconos cacheados en `mapIcons.js`, `center`/`zoom` solo como valores iniciales. Los vuelos (`flyTo`) viven en `MapController`; App nunca toca Leaflet.
- El CSS no se importa desde JS: `index.html` carga `css/base`, `css/components` y `css/layout` por `<link>`, y Leaflet 1.9.4 desde CDN. Antes de añadir estilos, reutiliza las clases existentes (ya hay diseño para dock, spotlight, drawer, bóveda, perfil, settings y telemetría). `css/styles.css` y `js/` son residuos del diseño anterior; no los edites.

## Reglas de dominio que no se rompen

- **El vencimiento nunca se guarda**: siempre se deriva de `{ entryDateStr, allowedDays }`. La llegada es el **Día 1**, así que vence en `addDays(entryDate, allowedDays - 1)`. Por eso 90 días autorizados se muestran como "/ 89 días".
- El registro público expone solo tres presets: `colombia_intercambio`, `colombia_turista`, `peru_turista`.
- No inventes datos legales. Un claim no verificado contra la fuente oficial va a la cola de revisión; no se reescribe ni se "mejora".
- Las claves de storage (`fupais_state_v2`, `fupais_dock_preferences_v1`, `fupais_vault_files_v1`) **no se renombran**: hay datos de usuarios guardados.
- `index.html` NO contiene scripts inline ni APIs globales (`window.fuPais*`): toda la lógica es React. No reintroduzcas puentes imperativos.

## Fronteras de la UI

- `src/ui/` **nunca** llama `localStorage` ni `fetch` directamente. El estado va por `state/store.js`; la persistencia por el puerto `services/storage.js`; la geocodificación por el puerto `services/geocoding.js`.
- Los únicos `fetch` del repo están en `src/services/adapters/` (upstream real y proxy propio). No añadas más.

## Pruebas

- `tests/*.test.{js,jsx}` — los archivos con JSX usan extensión `.jsx`.
- RTL (`@testing-library/react`) para componentes y `renderHook` para hooks; la geocodificación se stuba inyectando un adapter con `setGeocodingAdapter`.
- `vite.config.js` usa `pool: "vmThreads"` para reutilizar jsdom entre archivos.
- Regla histórica: las 66 pruebas de las capas puras no se modifican; las pruebas nuevas SUMAN (hoy 53 de hooks, dock, mapa, calendario, bóveda y vistas).

## Flujo de trabajo

- Rama de trabajo: `feat/nuevo-diseno`. Nunca big-bang a `main`; el merge va por PR (CI ejecuta `npm test` + `npm run build`).
- **Antes de commitear o pushear, muestra al usuario exactamente qué archivos y diffs entran y espera su confirmación explícita.** No commitees por iniciativa propia.
- Al cerrar un cambio: `npm test` en verde y `npm run build` limpio.

## Grafo del código

`graphify-out/` (ignorado por git) contiene el grafo del proyecto. Para preguntas sobre el código: `graphify query "<pregunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<concepto>"`. Tras modificar código: `graphify update .`
