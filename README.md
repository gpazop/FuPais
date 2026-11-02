# 🌍 FuPais — Control de Días Fuera del País & Alertas Migratorias

> Aplicación web moderna diseñada para estudiantes, turistas, trabajadores y nómadas digitales que necesitan controlar sus días de permanencia en el extranjero, calcular plazos legales, evitar multas por estancia irregular y no olvidar trámites críticos como prórrogas de visa o empadronamientos.

**Estado:** Producción — desplegado en [Vercel](https://fupais.vercel.app/)

---

## 🏗️ Arquitectura

FuPais es **React 19 + Vite 8 al 100%**: `domain/`, `data/`, `state/` y `services/` son JavaScript puro sin dependencias del DOM (protegidos por 66 pruebas), y `ui/` es la capa declarativa — componentes y hooks, sin una sola clase vanilla.

```
src/
├── main.jsx                      # Punto de entrada React (fallback visual si falla el montaje)
├── domain/                       # PURA — cálculo y reglas legales
│   ├── dashboard.js              #   buildDashboard(): motor de cálculo de estancia
│   ├── dates.js                  #   parseDate, addDays, differenceInDays, getLastAllowedDate…
│   ├── windows.js / rules.js / format.js
├── data/                         # PURA — registro legal verificado
│   ├── presets.js                #   COUNTRY_RULES / COUNTRY_TASKS: única fuente de verdad
│   ├── migrationPresets.js       #   MIGRATION_PRESETS: registro derivado (filtro de publicación)
│   └── presetPresentation.js / presetCoords.js
├── state/store.js                # loadState/saveState (STORAGE_KEY="fupais_state_v2")
├── services/                     # Puertos async + adapters (storage, geocoding)
├── api/geocode.js                # Handler serverless GET /api/geocode (Vercel)
├── ui/
│   ├── App.jsx                   # Controlador React (hooks, sin clases)
│   ├── domain/                   # Lógica pura de UI testeable: monthGrid.js, vaultFiles.js
│   ├── hooks/                    # 10 hooks: métricas, persistencia, "hoy", dock, mapa, toasts, bóveda
│   └── components/
│       ├── Header / PresetSelector / SmartAlert / MetricCard / Badge / ProceduresList / CountryCards
│       ├── Calendar.jsx          # Calendario declarativo (grilla pura en ui/domain/monthGrid.js)
│       ├── ConfigModal.jsx / DayModal.jsx / Toast.jsx
│       ├── Vault.jsx / ProfileView.jsx / SettingsPanel.jsx   # vistas Archivos / Perfil / Configuración
│       ├── dock/                 # Dock, DockBar, DockItem, Spotlight, Drawer (100% controlado)
│       └── map/                  # Map (react-leaflet v5), mapIcons, GpsHud, MapSearch, MapLayerSwitcher
├── components/dock/constants.js  # Claves legacy de storage + defaults del dock
└── vite.config.js / vitest.setup.js
```

### Capas clave

| Capa | Descripción |
|------|-------------|
| `domain/` | Lógica de negocio pura: `buildDashboard()`, cálculos de fechas, ventanas de trámites |
| `data/` | Datos de reglas migratorias (COUNTRY_RULES), registro de presets publicados, coordenadas |
| `state/` | `loadState`/`saveState` sobre el puerto de storage (`fupais_state_v2`) |
| `services/` | Puertos y adapters: geocodificación (`/api/geocode`), almacenamiento |
| `ui/` | React 19: componentes declarativos + 10 hooks (métricas, persistencia, dock, mapa, toasts, bóveda) |

### Reglas de publicación (data-driven)

Un preset solo se publica si su combinación `(countryCode, stayType)` resuelve a una regla verificada en `COUNTRY_RULES` **y** a una lista de trámites verificados. Actualmente se publican:

- 🇨🇴 **Colombia — Estudiante Intercambio (PIP-2)** (`colombia_intercambio`)
- 🇨🇴 **Colombia — Turista (PIP-5 / PTP)** (`colombia_turista`)
- 🇵🇪 **Perú — Turista** (`peru_turista`)

Añadir un país nuevo es solo añadir datos al registro (`presets.js` + `presetPresentation.js` + `presetCoords.js`): nunca se toca la UI ni hay listas hardcodeadas.

---

## ✨ Características

### Dashboard de Permanencia
- **Días Fuera del País**: Contador automático desde la fecha de llegada (conteo inclusivo: llegada = Día 1)
- **Días Restantes de Estancia Legal**: Cuenta regresiva respecto al límite legal
- **Barra de Progreso**: Porcentaje de estancia consumida con cambio de color (Verde = Seguro, Ámbar = Ventana de prórroga, Rojo = Vencido)
- **Smart Alert**: Alertas contextuales (Ventana Óptima, Zona de Riesgo, Estancia Vencida, Al Día) con enlaces a portales oficiales

### Calendario Migratorio
- Vista mensual interactiva con navegación y botón "Hoy"
- Detección de período de estancia, fecha de entrada y fecha límite legal
- Clic en cualquier día para inspeccionar detalles y agregar eventos personales

### Trámites y Obligaciones
- Lista de trámites con estado (pendiente/completado/urgente)
- Auto-extensión de estancia al marcar prórroga aprobada
- Enlaces a portales oficiales de cada país

### Mapa Migratorio (Leaflet v5)
- Pines de países publicados (data-driven desde `MIGRATION_PRESETS`)
- Rutas de vuelo entre países publicados (Lima → Bogotá)
- Popup con tipo de visa, límite legal y resumen normativo
- Clic en pin / tarjeta / selector de país → **un solo `flyTo` animado** sin remontar el mapa
- GPS en vivo y posición manual (clic o arrastre) con reverse geocode vía `/api/geocode`
- HUD de telemetría: coordenadas, ciudad, precisión y zona legal derivada
- Capas Calles / Satélite / Terreno y buscador de lugares

### Dock estilo macOS & Spotlight
- Barra flotante con magnificación de vecinos, auto-ocultar y señal *peek*
- **Spotlight (Cmd+K)**: búsqueda universal de vistas, países y trámites con navegación por teclado (↑ ↓ Enter Esc)
- **Centro de Control (Cmd+M)**: contactos de emergencia y accesos rápidos
- Atajos `Cmd/Ctrl + K · M · D · 1…5` y sonidos de interfaz opcionales (con toggle)

### Bóveda de Documentos
- Zona de carga y arrastre para pasaportes, sellos de entrada, cartas universitarias y formularios FUT
- Filtros por categoría (Pasaportes, Visas, Prórrogas, Académicos, Otros)
- Se guarda la **ficha** (nombre, tamaño, fecha, categoría) — nunca el contenido del archivo
- El badge del dock refleja el número real de documentos almacenados

### Configuración
- Vista de Configuración con panel estilo iOS: posición del dock, tema claro/oscuro, magnificación, auto-ocultar y sonidos — persistencia automática
- Modal "Ajustar Fechas y Perfil de Viaje": fecha de llegada, duración autorizada y datos del viaje
- Selector de país de destino con reglas legales verificadas

---

## 🚀 Despliegue

FuPais está desplegado en **Vercel** con detección automática de Vite. El endpoint serverless `/api/geocode` está montado tanto en desarrollo (`vite dev`) como en producción (Vercel).

### Despliegue manual
```bash
npm install
npm run build       # Build de producción
npm run preview     # Preview local del build
```

### Variables de entorno
No se requieren variables de entorno para el despliegue básico. El endpoint `/api/geocode` se monta automáticamente mediante el plugin de Vite.

---

## 🧪 Pruebas

FuPais utiliza **Vitest** + **React Testing Library**. Las capas puras (`domain/`, `data/`, `state/`, `services/`) conservan sus **66 pruebas originales intactas**; la capa React suma 53 (hooks, dock, mapa, calendario, bóveda y vistas) para un total de **119**:

```bash
npm test            # Ejecuta todas las pruebas (119/119)
npm run build       # Build de producción
npm run dev         # Servidor de desarrollo (localhost:5173)
```

**Integración continua**: `.github/workflows/ci.yml` ejecuta `npm test` + `npm run build` en cada push a `main` y en cada pull request.

---

## 📋 Reglas de Permanencia Verificadas

| País | Tipo de Estancia | Días Iniciales | Prórroga | Fuente |
|------|-----------------|----------------|----------|--------|
| 🇨🇴 Colombia | Estudiante Intercambio (PIP-2) | 90 | +90 (PTP) | Resolución 5477/2022 |
| 🇨🇴 Colombia | Turista (PIP-5 / PTP) | 90 | +90 (PTP) | Migración Colombia |
| 🇵🇪 Perú | Turista | 90 | Hasta 183/365 | Superintendencia de Migraciones |

> **Nota:** El vencimiento SIEMPRE se deriva de `{entryDateStr, allowedDays}` (llegada = Día 1, canónico `/89`). Nunca se guarda en estado.

---

## 🛣️ Hoja de Ruta

- ✅ **Fase 1**: Frontend vanilla con diseño "papel frostado" y tema Geist
- ✅ **Fase 2**: Capa de estado unificada (`state/store.js`) con `subscribe`/`notify`
- ✅ **Fase 3**: Dock modular y puerto de geocodificación
- ✅ **Fase 4**: Endpoint serverless `/api/geocode` (Vercel) + recorte data-driven de pines/tarjetas
- ✅ **Fase 5**: Migración progresiva a React (capas puras intactas)
- ✅ **Auditoría estratégica (4 sprints)**: núcleo reactivo → dock declarativo → mapa reactivo → calendario + cierre de deuda. UI 100% React, 0 deuda técnica, hallazgos H1–H8 resueltos
- ✅ **Post-sprint**: vistas Archivos / Perfil / Configuración implementadas + CI (GitHub Actions)
- ⏳ **Pendiente**: Guía de renombrado Vercel a FuPais (ejecución manual por el usuario)
- ⏳ **Pendiente**: Limpieza diferida (semilla `defaultState()`, mejora de Escape-en-modal)
- ⏳ **Futuro**: contenido real de la bóveda (requiere storage de objetos)

---

## 📄 Licencia

ISC

---

*FuPais — Gestión de estancia en el exterior, prórrogas y alertas legales oficiales*
