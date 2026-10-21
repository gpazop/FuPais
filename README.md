# 🌍 NomadStay — Control de Días Fuera del País & Alertas Migratorias

> Aplicación web moderna diseñada para estudiantes, turistas, trabajadores y nómadas digitales que necesitan controlar sus días de permanencia en el extranjero, calcular plazos legales, evitar multas por estancia irregular y no olvidar trámites críticos como prórrogas de visa o empadronamientos.

---

## 🏗️ Arquitectura (Fase 1b)

Módulos ES con Vite + Vitest, separación de responsabilidades sin ciclos de imports:

```
src/
├── main.js                 # Bootstrap (aplica tema, registra UI, arranca render)
├── state/store.js          # Estado global (STATE) — sin dependencias del DOM
├── ui/
│   ├── elements.js         # Referencias a elementos del DOM (ULL)
│   ├── render.js           # Render del dashboard, calendario y alertas (updateUI)
│   └── app.js              # Inicialización, eventos y flujo de presets
├── data/presets.js         # Reglas migratorias + trámites por país (getPresetTasks)
└── (reglas de estancia por país: motor calendar-year para CO/PE verificados)
```

- **Reglas de permanencia**: motor *calendar-year* con datos verificados para 🇨🇴 Colombia (Resolución 5477 de 2022) y 🇵🇪 Perú (Topes 183/365 días) — panel informativo con fuente oficial.
- **Trámites migratorios por país**: `getPresetTasks(countryCode, stayTypeId)` carga trámites verificados por país y tipo de estancia; cae en fallback a los presets genéricos cuando no hay datos del país.
- **Tests**: `npx vitest run` cubre el motor de reglas (`tests/rules.test.js`) y los presets por país (`tests/presets.test.js`).

---

## ✨ Características de la Fase 1 (Frontend & Diseño Interactivo)

1. **Dashboard de Permanencia & Conteo de Días**:

   - **Días Fuera del País**: Contador automático y continuo desde tu fecha de llegada.
   - **Días Restantes de Estancia Legal**: Cuenta regresiva en tiempo real respecto al límite de tu visado o regla de exención.
   - **Barra de Progreso Visual**: Porcentaje de estancia consumida con cambio dinámico de color (Verde = Seguro, Ámbar = Ventana de prórroga, Rojo = Vencimiento inminente).
   - **Semáforo de Estatus Migratorio**: Indicador con badges animados para advertirte a tiempo.
2. **Calendario Migratorio Inteligente**:

   - Vista de cuadrícula mensual interactiva con navegación hacia adelante/atrás y botón "Hoy".
   - Detección visual del período de estancia, fecha oficial de entrada y fecha límite legal de salida/prórroga.
   - Marcadores de colores por severidad de trámites (Crítico, Alta prioridad, Trámite local).
   - Haz clic en cualquier día para inspeccionar detalles o programar un evento/cita migratoria en esa fecha.
3. **Centro de Trámites & Alertas Críticas**:

   - Lista organizada con filtros: **Todos**, **Pendientes**, **Urgentes**, **Completados**.
   - Checkboxes interactivos para marcar trámites cumplidos con actualización instantánea de métricas.
   - Botón para agregar trámites personalizados (título, fecha, categoría, requisitos y prioridad).
   - Presets inteligentes que cargan automáticamente los trámites habituales según tu condición:
     - 🎓 **Estudiante**: Empadronamiento el día 14, huellas TIE el día 30, y ventana de prórroga que abre 60 días naturales antes del vencimiento (día 305 de una estancia de 365).
     - ✈️ **Turista (90 días Schengen)**: Alerta a los 45 días, alerta crítica a los 75 días, salida obligatoria el día 90.
     - 💻 **Nómada Digital**: Control de 183 días de residencia fiscal, acreditación de ingresos.
     - 💼 **Trabajo**: Seguridad social, apertura de cuenta, renovación laboral.
4. **Exportación a Calendario Personal (iCal / Google Calendar)**:

   - Botón directo para descargar un archivo `.ics` con todos tus trámites y fechas límites para sincronizarlos en Google Calendar, iPhone o Outlook.
5. **Persistencia de Datos**:

   - Funciona sin configuración mediante `localStorage` en el navegador del usuario.

---

## 🗄️ Próxima Fase (Fase 3): Backend con Base de Datos Gratuita

Para cuando pasemos al Backend y queramos que los datos se guarden en la nube con cuentas de usuario (login con Google / Email):

| Proveedor de Base de Datos       | Nivel Gratuito (Free Tier)                                                                  | Ventajas para Vercel                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Supabase** (Recomendado) | 500 MB Postgres, 50,000 usuarios activos mensuales, autenticación y API REST instantánea. | Excelente integración con JavaScript/Vercel, interfaz visual intuitiva y soporte para notificaciones por correo. |
| **Neon**                   | 0.5 GB Postgres Serverless con ramificaciones (branching).                                  | Integración directa oficial con el Marketplace de Vercel.                                                        |
| **Firebase Firestore**     | 1 GB de almacenamiento, 50,000 lecturas/día.                                               | Muy simple para desarrollo ágil sin configurar esquemas relacionales.                                            |

### Hoja de ruta para la Fase 3 (Backend):

> ✅ La Fase 2 ya está lista: datos migratorios verificados para Colombia y Perú con panel de reglas oficiales.

1. Crear proyecto gratuito en **Supabase** (recomendado).
2. Diseñar las tablas relacionales:
   - `users` (id, email, país de origen, país de destino)
   - `stays` (id, user_id, arrival_date, allowed_days, stay_type)
   - `tasks` (id, stay_id, title, date, priority, category, completed, notes)
3. Crear endpoints API serverless en `/api` dentro de Vercel para sincronización automática multidispositivo y recordatorios por email/Push Notifications.
