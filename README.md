# 🌍 NomadStay — Control de Días Fuera del País & Alertas Migratorias

> Aplicación web moderna diseñada para estudiantes, turistas, trabajadores y nómadas digitales que necesitan controlar sus días de permanencia en el extranjero, calcular plazos legales, evitar multas por estancia irregular y no olvidar trámites críticos como prórrogas de visa o empadronamientos.

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
     - 🎓 **Estudiante**: Empadronamiento a los 15 días, huellas TIE a los 30 días, inicio de ventana de prórroga para Colombia 15 días antes con un máximo de 5 días antes del vencimiento.
     - ✈️ **Turista (90 días Schengen)**: Alerta a los 45 días, alerta crítica a los 75 días, salida obligatoria el día 90.
     - 💻 **Nómada Digital**: Control de 183 días de residencia fiscal, acreditación de ingresos.
     - 💼 **Trabajo**: Seguridad social, apertura de cuenta, renovación laboral.
4. **Exportación a Calendario Personal (iCal / Google Calendar)**:

   - Botón directo para descargar un archivo `.ics` con todos tus trámites y fechas límites para sincronizarlos en Google Calendar, iPhone o Outlook.
5. **Persistencia de Datos**:

   - Funciona sin configuración mediante `localStorage` en el navegador del usuario.

---

## 🚀 Despliegue en Vercel (Paso a Paso)

Esta aplicación no requiere ningún build complejo ni dependencias pesadas, lo que la hace ultra rápida y 100% compatible con Vercel.

### Opción A: Despliegue desde GitHub (Recomendado)

1. Sube este proyecto a tu repositorio de GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - NomadStay Web App"
   git branch -M main
   git remote add origin <URL_DE_TU_REPOSITORIO>
   git push -u origin main
   ```
2. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..." > "Project"**.
4. Selecciona el repositorio recién creado y presiona **"Deploy"**.
5. ¡Listo! Vercel te dará una URL pública tipo `https://tu-proyecto.vercel.app` en menos de 30 segundos.

### Opción B: Despliegue directo mediante Vercel CLI

```bash
npm i -g vercel
vercel
```

---

## 🗄️ Próxima Fase: Recomendación de Base de Datos Gratuita

Para cuando pasemos al Backend y queramos que los datos se guarden en la nube con cuentas de usuario (login con Google / Email):

| Proveedor de Base de Datos       | Nivel Gratuito (Free Tier)                                                                  | Ventajas para Vercel                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Supabase** (Recomendado) | 500 MB Postgres, 50,000 usuarios activos mensuales, autenticación y API REST instantánea. | Excelente integración con JavaScript/Vercel, interfaz visual intuitiva y soporte para notificaciones por correo. |
| **Neon**                   | 0.5 GB Postgres Serverless con ramificaciones (branching).                                  | Integración directa oficial con el Marketplace de Vercel.                                                        |
| **Firebase Firestore**     | 1 GB de almacenamiento, 50,000 lecturas/día.                                               | Muy simple para desarrollo ágil sin configurar esquemas relacionales.                                            |

### Hoja de ruta para la Fase 2 (Backend):

1. Crear proyecto gratuito en **Supabase** o **Neon**.
2. Diseñar las tablas relacionales:
   - `users` (id, email, país de origen, país de destino)
   - `stays` (id, user_id, arrival_date, allowed_days, stay_type)
   - `tasks` (id, stay_id, title, date, priority, category, completed, notes)
3. Crear endpoints API serverless en `/api` dentro de Vercel para sincronización automática multidispositivo y recordatorios por email/Push Notifications.
