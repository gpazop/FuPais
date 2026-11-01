# 🌍 FuPais — Control de Días Fuera del País & Alertas Migratorias

> Aplicación web moderna diseñada para estudiantes, turistas, trabajadores y nómadas digitales que necesitan controlar sus días de permanencia en el extranjero, calcular plazos legales, evitar multas por estancia irregular y no olvidar trámites críticos como prórrogas de visa o empadronamientos.

**Estado:** Producción — desplegado en [Vercel](https://fupais.vercel.app/)

---

## 🏗️ Arquitectura

FuPais sigue una arquitectura en capas donde **domain/**, **data/**, **state/** y **services/** son JavaScript puro sin dependencias del DOM, y **ui/** es la capa de presentación (migración progresiva a React).

```
src/
├── main.jsx                    # Punto de entrada React (try-catch para diagnóstico)
├── domain/
│   ├── dashboard.js            # buildDashboard(): motor de cálculo de estancia
│   ├── dates.js                # Utilidades de fechas (parseDate, addDays, differenceInDays, formatDatePretty)
│   └── windows.js              # Ventanas operativas de trámites
├── data/
│   ├── presets.js              # COUNTRY_RULES: única fuente de verdad legal (CO, PE verificados)
│   ├── migrationPresets.js     # MIGRATION_PRESETS: registro derivado (filtro de publicación)
│   ├── presetPresentation.js   # PRESET_PRESENTATION: textos y metadatos de UI
│   └── presetCoords.js         # PRESET_COORDS: coordenadas por preset publicado
├── state/
│   └── store.js                # STORAGE_KEY="fupais_state_v2", subscribe/notify, defaultState
├── services/
│   ├── geocoding.js            # Puerto de geocodificación (reverseGeocode, searchPlace)
│   ├── storage.js              # Puerto de persistencia (localStorage)
│   └── adapters/
│       ├── apiGeocodingAdapter.js    # Cliente del endpoint /api/geocode
│       ├── publicGeocodingAdapter.js # Adapter público con normalización de textos
│       └── localStorageAdapter.js    # Adapter de localStorage
├── ui/
│   ├── App.jsx                 # Orquestador de componentes (estado React + store)
│   ├── main.jsx                # Entry point React
│   └── components/
│       ├── Badge.jsx             # Componente base con variantes semánticas
│       ├── Header.jsx            # Barra superior con preset selector
│       ├── SmartAlert.jsx        # Alerta migratoria contextual (5 estados)
│       ├── MetricCard.jsx        # Tarjetas de métrica con barra de progreso
│       ├── CalendarWrapper.jsx   # Envoltorio React para FuPaisCalendar (vanilla)
│       ├── ProceduresList.jsx    # Lista de trámites con auto-extensión de prórroga
│       ├── CountryCards.jsx      # Catálogo de países data-driven (MIGRATION_PRESETS)
│       ├── Map.jsx               # Mapa Leaflet v5 con pines y rutas de vuelo
│       ├── ConfigModal.jsx       # Modal "Ajustar Fechas y Perfil de Viaje" (React controlado)
│       ├── DayModal.jsx          # Modal "Detalle del Día Inspeccionado" (React controlado)
│       ├── DockWrapper.jsx       # Envoltorio React para FuPaisDock (vanilla)
│       └── DockLayout.jsx        # HTML del dock, spotlight y drawer en JSX
├── components/dock/            # Clases vanilla del dock (Spotlight, Drawer, Map, Vault, Settings)
├── api/
│   └── geocode.js              # Handler serverless GET /api/geocode (Vercel)
├── vite.config.js              # Vite + plugin React + montaje de API geocoding
└── vitest.setup.js             # Configuración de pruebas
```

### Capas clave

| Capa | Descripción |
|------|-------------|
| `domain/` | Lógica de negocio pura: `buildDashboard()`, cálculos de fechas, ventanas de trámites |
| `data/` | Datos de reglas migratorias (COUNTRY_RULES), registro de presets publicados, coordenadas |
| `state/` | Store único con `subscribe`/`notify`, persistencia en `fupais_state_v2` |
| `services/` | Puertos y adapters: geocodificación (endpoint `/api/geocode`), almacenamiento |
| `ui/` | Componentes React que consumen el store y las capas puras |

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
- Click en pin para activar preset y volar el mapa al destino

### Bóveda de Documentos
- Zona de carga y arrastre para pasaportes, sellos de entrada, cartas universitarias, formularios FUT
- Filtros por categoría (Pasaportes, Visas, Prórrogas, Académicos)

### Configuración
- Ajustar fecha de llegada y duración autorizada (días)
- Selector de país de destino con reglas legales verificadas
- Personalización del dock (posición, tema, auto-ocultar, sonidos)

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

FuPais utiliza **Vitest** como framework de pruebas. Las capas puras (`domain/`, `data/`, `state/`, `services/`) están cubiertas por 66 pruebas:

```bash
npm test            # Ejecuta todas las pruebas (66/66)
npm run build       # Build de producción
npm run dev         # Servidor de desarrollo (localhost:5173)
```

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
- ✅ **Fase 3**: Dock modular (clases con `applyMethods`) y puerto de geocodificación
- ✅ **Fase 4**: Endpoint serverless `/api/geocode` (Vercel) + recorte data-driven de pines/tarjetas
- ✅ **Fase 5**: Migración progresiva a React (UI en `ui/` + `components/`, capas puras intactas)
- 🔄 **En curso**: README y documentación de GitHub
- ⏳ **Pendiente**: Guía de renombrado Vercel a FuPais (ejecución manual por el usuario)
- ⏳ **Pendiente**: Limpieza diferida (favicon 404, semilla `defaultState()`, mejora de Escape-en-modal)

---

## 📄 Licencia

ISC

---

*FuPais — Gestión de estancia en el exterior, prórrogas y alertas legales oficiales*
