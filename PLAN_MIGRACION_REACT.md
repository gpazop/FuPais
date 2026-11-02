# Plan de Migración a React — FuPais

**Rama:** `feat/migracion-react` (desde `main`, baseline vanilla congelado en `1d9d2b9`)
**Objetivo:** Migrar solo la capa UI (`ui/` + `components/`) a React, reutilizando `domain/`, `data/`, `state/`, `services/` intactos, conservando el CSS actual.
**Regla de oro:** No romper nada. Los 66 tests de `domain/`, `data/`, `state/`, `services/` siguen aplicando.

---

## Fase 0: Documentación Discovery (SIEMPRE PRIMERO)

Leer documentación oficial antes de escribir código:

1. **React 19** — hooks, `useRef`, `useEffect`, `useState`, `useCallback`, `ReactDOM.createRoot`.
2. **Vite + React** — `@vitejs/plugin-react`, configuración de `vite.config.js` para React.
3. **React Leaflet** — `MapContainer`, `Marker`, `Popup`, `Polygon`, `useMap`, `useMapEvents` (versión compatible con Leaflet 1.9.4 ya instalado).
4. **Vitest + React Testing Library** — para seguir pasando los 66 tests existentes y añadir tests de componentes React.
5. **Geist tipografía** — ya cargada en `index.html` vía Google Fonts, se conserva.

**Salida esperada de Fase 0:** Lista de APIs permitidas con referencias a docs, anti-patrones a evitar, y `vite.config.js` configurado para React.

---

## Fase 1: Setup de React en el proyecto

1. Instalar dependencias: `react`, `react-dom`, `@vitejs/plugin-react`, `react-leaflet`, `leaflet` (ya existe), `@testing-library/react`, `@testing-library/jest-dom`, `vitest` (ya existe).
2. Actualizar `vite.config.js`: añadir `@vitejs/plugin-react`.
3. Crear `index.html` minimal con `<div id="root"></div>` (mantener Leaflet CSS/JS y Geist fonts).
4. Crear `src/main.jsx` como entry point: `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`.
5. Verificar: `npm run dev` arranca y muestra pantalla vacía de React. `npm run build` pasa sin warnings.

---

## Fase 2: Verificar capas puras intactas (no se tocan)

Confirmar que estas capas son JS puro sin DOM y quedan 100% intactas:

- `src/domain/dashboard.js` — `buildDashboard({ profile, tasks, today })`
- `src/domain/dates.js` — `formatDateISO`, `formatDatePretty`, `parseDate`, `addDays`, `differenceInDays`
- `src/domain/windows.js` — ventanas operativas
- `src/data/presets.js` — `STAY_PRESETS`, `COUNTRIES_LIST`, `COUNTRY_RULES`, `getCountryRule`, `getStayTypeRuleKey`, `getPresetTasks`
- `src/data/migrationPresets.js` — `MIGRATION_PRESETS`, `PRESET_STAY_TYPES`
- `src/data/presetPresentation.js` — `PRESET_PRESENTATION`
- `src/data/presetCoords.js` — `PRESET_COORDS` (nuevo, del recorte)
- `src/state/store.js` — `STORAGE_KEY`, `defaultState`, `normalizeState`, `subscribe`, `notify`, `loadState`, `saveState`
- `src/services/geocoding.js` — puerto `geocoding.reverseGeocode`, `geocoding.searchPlace`, `setGeocodingAdapter`
- `src/services/adapters/apiGeocodingAdapter.js` — cliente puro del endpoint `/api/geocode`
- `src/services/adapters/publicGeocodingAdapter.js` — adapter público con `normalizeText`
- `src/services/storage.js` — `storage.get`, `storage.set`

**Verificación:** `npm test` → 66/66 pasan sin modificar nada de estas capas.

---

## Fase 3: Migrar `ui/app.js` → `src/ui/App.jsx` (controlador principal)

El `FuPaisApp` actual es una clase con:
- `constructor(state)` — init elements, syncPresetOptions, initCalendar, bindEvents, suscripción al store, `update()`
- `static async create()` — carga estado, crea app, crea dock
- `commit()` — `notify(this.state)`
- `update()` — `recalculate()`, `renderHeaderAndBanner()`, `renderMetrics()`, `renderProcedures()`, `calendar.setData()`, `dock.renderMapTelemetry()`, `persist()`
- `applyPreset(presetId)`, `showNotification(msg)`, `openConfigModal()`
- `getPreset()`, `recalculate()`

**Estrategia:** Convertir a componente React funcional con hooks:
- `useState(state)` para el estado local (sincronizado con el store via `subscribe`)
- `useEffect` para suscribirse al store y llamar `commit()` en cambios
- `useRef` para `calendar`, `dock` (instancias de clases vanilla que se mantienen)
- Render condicional por vista (inicio, mapa, archivos, perfil, configuración)

**Qué se mantiene:** Las clases `FuPaisCalendar` y `FuPaisDock` se instancian desde React vía `useRef` y se llaman sus métodos imperativos (`calendar.setData`, `dock.renderMapTelemetry`, `dock.switchTab`, etc.).

**Verificación:** App renderiza, el contador de días se actualiza, el preset selector funciona, el dock responde a pestañas.

---

## Fase 4: Migrar componentes del dock (`src/components/dock/`)

La fachada `dock.js` (340 líneas) usa `applyMethods` para mezclar módulos:
- `SpotlightMethods` — búsqueda universal
- `DrawerMethods` — menú hamburguesa / centro de control
- `MapMethods` — mapa Leaflet (riesgo alto, ver Fase 5)
- `VaultMethods` — bóveda de archivos
- `SettingsMethods` — configuración

**Estrategia:** Crear componentes React que envuelvan cada módulo:
- `Dock.jsx` — componente principal que instancia `FuPaisDock` vía `useRef`, renderiza la barra flotante y delega eventos.
- `Spotlight.jsx`, `Drawer.jsx`, `Vault.jsx`, `Settings.jsx` — componentes que llaman a los métodos de los módulos vía `dockRef.current`.

**Qué se mantiene:** Los módulos `spotlight.js`, `drawer.js`, `vault.js`, `settings.js` se mantienen como clases vanilla; React solo los instancia y llama sus métodos.

**Verificación:** Dock responde a Cmd+K, Cmd+M, Cmd+D, pestañas 1-5; spotlight abre/cierra; drawer abre/cierra; vault renderiza archivos; settings cambian tema y posición.

---

## Fase 5: Migrar el mapa Leaflet (`dock/map.js`) — RIESGO ALTO

**Estrategia:** Usar `react-leaflet` con `useRef` + `useEffect`:
- `MapContainer` con centro y zoom iniciales
- `TileLayer` para capas (calles, satélite, terreno)
- `Marker` para ubicación del usuario (radar) y pines de país
- `Popup` para información de país
- `Polygon` o `Polyline` para rutas de vuelo
- `useMap` para acceso a la instancia de Leaflet (flyTo, setView, invalidateSize)
- `useMapEvents` para click en mapa, dragend del marcador

**Coordenadas:** Usar `PRESET_COORDS` y `MIGRATION_PRESETS` para pines dinámicos.
**Delegación:** Los clics en tarjetas de país llaman a `app.applyPreset(presetId)` vía callback.

**Verificación:** Mapa carga, se cambia de capa, flyTo a país al seleccionar tarjeta, pines aparecen, búsqueda de lugar funciona vía `/api/geocode`.

---

## Fase 6: Migrar el calendario (`calendar.js`) — RIESGO ALTO

`FuPaisCalendar` es una clase vanilla que renderiza un calendario mensual con eventos.

**Estrategia:** Mantener `FuPaisCalendar` como clase vanilla instanciada desde React vía `useRef`, llamando `calendar.setData(metrics, customEvents)` en cada `update()`. No reescribir el calendario en React aún (riesgo innecesario); envolverlo en un componente `Calendar.jsx` que cree la instancia y exponga `setData`.

**Verificación:** Calendario renderiza, clic en día abre inspector, eventos se muestran.

---

## Fase 7: Migrar modales y formularios

- `config-modal` — Ajustar Fechas y Perfil de Viaje (formulario con preset selector, entrada/salida, duración en días)
- `day-modal` — Detalle del día inspeccionado

**Estrategia:** Componentes React `ConfigModal.jsx`, `DayModal.jsx` con estado controlado para los inputs del formulario.

**Verificación:** Modal se abre/cierra, formulario envía, `applyPreset` y `commit` se llaman correctamente.

---

## Fase 8: index.html → punto de entrada React

Reemplazar `<script type="module" src="/src/main.js"></script>` por `<script type="module" src="/src/main.jsx"></script>` con `<div id="root"></div>`. Mantener todos los `<link>` de CSS y Leaflet.

---

## Fase 9: Verificación final

1. `npm test` → 66/66 pasan (capa pura intacta).
2. `npm run build` → sin warnings, build exitoso.
3. Humo manual: app carga, navegación por pestañas, mapa con pines, preset selector, modales, calendario.

---

## Anti-patrones a evitar

- ❌ No reescribir `domain/`, `data/`, `state/`, `services/` (son JS puro, quedan intactos).
- ❌ No inventar APIs de Leaflet que no existan en react-leaflet.
- ❌ No usar `localStorage` ni `fetch` directamente en componentes React; todo pasa por puertos/adapters.
- ❌ No hacer big-bang a `main`; trabajar en `feat/migracion-react` con previews de Vercel.
- ❌ No cambiar claves de storage (`fupais_state_v2`, etc.).

---

## Entregable al finalizar cada fase

Commit en `feat/migracion-react` con mensaje descriptivo, previo a pasar a la siguiente fase.

---

## ✅ ESTADO FINAL — Migración completada (post auditoría estratégica, 4 sprints)

**Todas las fases 0–9 están COMPLETADAS.** La capa UI es 100% React (sin una sola
clase vanilla); `domain/`, `data/`, `state/`, `services/` permanecen intactos desde
el baseline. Suite: **99/99 pruebas en verde** (66 originales de la capa pura + 33
nuevas de hooks, dock, mapa y calendario).

### Sprints ejecutados

| Sprint | Contenido | Resultado clave |
|--------|-----------|-----------------|
| **1 — Núcleo Reactivo** | `useDashboardMetrics` (memo sobre `buildDashboard`), `usePersistedState` (persistencia automática), `useToday`, `appApi` estable | Corregidos: doble montaje del dock, recreación por render, persistencia stale, doble render por interacción |
| **2 — Dock Declarativo** | `Dock`/`DockBar`/`DockItem`/`Spotlight`/`Drawer` + hooks `useDockSettings`/`useDockAudio`/`useDockShortcuts`/`useAutoHide` | Eliminados `FuPaisDock`, `applyMethods` y 4 mixins; claves legacy intactas; navegación ↑↓ real en Spotlight; XSS latente del query eliminado |
| **3 — Mapa Reactivo** | `Map` v5 correcto (`useMapEvents`, `eventHandlers`, Popup objeto) + `MapController` (flyTo por preset / flyRequest / invalidateSize) + `useGeoTracking` + HUD/buscador/capas | Eliminado `MapMethods`; un solo `flyTo` por cambio de preset; mapa sin remontar; íconos con identidad estable |
| **4 — Calendario + Cierre** | `Calendar` declarativo + `monthGrid` (pura) + `Toasts` React (`useToasts`) | Eliminados `FuPaisCalendar`, `CalendarWrapper`, `ui/app.js`, `main.js`, `countryCards.js`; cero `getElementById`/`innerHTML` en `ui/` |

### Arquitectura final

```
src/
  main.jsx                 ← único punto de entrada (React 19)
  ui/App.jsx               ← controlador (hooks, sin clases)
  ui/domain/monthGrid.js   ← lógica pura de la grilla mensual
  ui/hooks/                ← 10 hooks (estado, dock, mapa, toasts)
  ui/components/           ← shell + Calendar + Toast
  ui/components/dock/      ← dock declarativo (+ constants.js)
  ui/components/map/       ← familia del mapa (react-leaflet v5)
  domain/ | data/ | state/ | services/   ← INTACTOS (66 tests)
```

### Backlog conocido (features nuevas, no deuda técnica)

- ~~Vistas placeholder `archivos` / `perfil` / `configuración`~~ → **IMPLEMENTADAS**
  (post-sprint): `Vault` (dropzone + filtros + grilla, clave legacy
  `fupais_vault_files_v1`), `ProfileView` (pasaporte con MRZ + resumen de
  estancia) y `SettingsPanel` (posición/tema/switches iOS sobre
  `useDockSettings` — persistencia automática). El badge del dock ahora
  refleja el número real de fichas.
- ~~Optimización opcional de Vitest~~ → **APLICADA**: `pool: 'vmThreads'`.
- **CI**: `.github/workflows/ci.yml` — gate `npm test && npm run build` en
  push a `main` y en cada pull request (Node 22, cache npm).
- Corrección de bug heredado en la heurística de la bóveda: el token `id`
  se evalúa con límites de palabra (antes `universidad` clasificaba como
  pasaporte).


