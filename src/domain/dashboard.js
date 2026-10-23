/**
 * Productor de métricas para la UI (puente entre los datos de FuPais y el
 * shell heredado de DISEÑO-PRUEBA-1).
 *
 * Reemplaza al `calculateStayMetrics` de la maqueta: la autoridad legal sigue
 * siendo `src/data/presets.js` (COUNTRY_RULES vía los presets derivados de
 * `migrationPresets.js`); este módulo solo deriva métricas y fechas. Las
 * ventanas operativas vienen de `windows.js` (no son legales, solo UI).
 *
 * Contrato de entrada:
 *
 *   buildDashboard({
 *     profile: { entryDateStr, allowedDays, countryCode, ruleKey },
 *     tasks:   procedimientos del registro (migrationPresets / COUNTRY_TASKS),
 *     today:   Date | 'YYYY-MM-DD' (opcional, por defecto hoy)
 *   })
 *
 * El perfil de estado vive en `{ entryDateStr, allowedDays }`; la fecha de
 * vencimiento se DERIVA con conteo inclusivo (día de llegada = Día 1) vía
 * `getLastAllowedDate`, nunca se guarda. `countryCode` y `ruleKey` solos se
 * usan para leer la ventana operativa: si faltan, `getProcessingWindow` cae
 * al default sin romper el cálculo.
 */

import { parseDate, addDays, differenceInDays, formatDatePretty, getLastAllowedDate } from './dates.js';
import { getProcessingWindow } from './windows.js';

export function buildDashboard({ profile, tasks, today = new Date() }) {
  const entryDate = parseDate(profile.entryDateStr);

  // `today` puede llegar como Date o 'YYYY-MM-DD'; se normaliza a medianoche
  // local (patrón del calculator de la maqueta) para que las comparaciones de
  // fechas no dependan de la hora del día.
  const todayDate =
    typeof today === 'string'
      ? parseDate(today)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // La fecha de vencimiento se deriva, nunca se lee del perfil.
  const expiryDate = parseDate(
    getLastAllowedDate(profile.entryDateStr, profile.allowedDays)
  );

  // Días que lleva fuera de su país.
  const daysAbroad = Math.max(0, differenceInDays(todayDate, entryDate));

  // Días restantes para el vencimiento legal (negativo si ya venció).
  const daysRemaining = differenceInDays(expiryDate, todayDate);

  // Total de días del período completo concedido.
  const totalPeriodDays = Math.max(1, differenceInDays(expiryDate, entryDate));

  // Porcentaje transcurrido.
  const percentElapsed = Math.min(
    100,
    Math.max(0, Math.round((daysAbroad / totalPeriodDays) * 100))
  );

  // Ventana específica del país y tipo de estancia (NO legal; ver windows.js).
  // `ruleKey` es la clave real dentro de COUNTRY_RULES ('tourist'/'student'),
  // que es justo lo que PROCESSING_WINDOWS indexa.
  const window = getProcessingWindow(profile.countryCode, profile.ruleKey);
  const windowStartBeforeExpiry = window.windowStartBeforeExpiry;
  const safeDeadlineBeforeExpiry = window.safeDeadlineBeforeExpiry;
  const postGraceDays = window.postGraceDays;

  // Fechas clave
  const prorrogaWindowStartDate = addDays(expiryDate, -windowStartBeforeExpiry);
  const safeDeadlineDate = addDays(expiryDate, -safeDeadlineBeforeExpiry);
  const prorrogaWindowEndDate = addDays(expiryDate, postGraceDays);

  const isBeforeWindow = todayDate < prorrogaWindowStartDate;
  const isInsideOptimalWindow = todayDate >= prorrogaWindowStartDate && todayDate <= safeDeadlineDate;
  const isInsideRiskWindow = todayDate > safeDeadlineDate && todayDate <= expiryDate;
  const isPostExpiryInGrace = todayDate > expiryDate && todayDate <= prorrogaWindowEndDate;
  const isExpired = todayDate > prorrogaWindowEndDate;

  // Estado de urgencia y badge para la UI (etiquetas exactas del shell).
  let statusBadge = {
    label: 'Estancia Regular',
    type: 'badge-soft',
    urgent: false,
    detailMessage: `Faltan ${differenceInDays(prorrogaWindowStartDate, todayDate)} días para la apertura del trámite de prórroga.`
  };

  if (isExpired) {
    statusBadge = {
      label: 'Estancia Vencida',
      type: 'badge-ember',
      urgent: true,
      detailMessage: `Período legal excedido por ${Math.abs(daysRemaining)} días. Requiere regularización o salvoconducto.`
    };
  } else if (isPostExpiryInGrace) {
    statusBadge = {
      label: 'Plazo de Gracia Extemporáneo',
      type: 'badge-ember',
      urgent: true,
      detailMessage: 'En período extraordinario con posible recargo o sanción.'
    };
  } else if (isInsideRiskWindow) {
    statusBadge = {
      label: '¡Riesgo Alto por Tiempos de Respuesta!',
      type: 'badge-ember',
      urgent: true,
      detailMessage: `Faltan solo ${daysRemaining} días. El trámite demora entre 3 y 5 días hábiles en responder. Radica hoy mismo.`
    };
  } else if (isInsideOptimalWindow) {
    statusBadge = {
      label: 'Ventana de Prórroga Abierta',
      type: 'badge-solid',
      urgent: true,
      detailMessage: `Momento óptimo para radicar. Faltan ${daysRemaining} días para vencer y ${differenceInDays(safeDeadlineDate, todayDate)} días para el límite seguro.`
    };
  } else if (isBeforeWindow) {
    statusBadge = {
      label: 'Estancia en Curso',
      type: 'badge-soft',
      urgent: false,
      detailMessage: `El sistema de migraciones habilita la prórroga ${windowStartBeforeExpiry} días antes del vencimiento (${formatDatePretty(prorrogaWindowStartDate)}).`
    };
  }

  // Resolver fechas exactas para los trámites. `dayOffset` es 1-based
  // (convención de presets.js: día de llegada = día 1), así que
  // targetDate = entrada + (dayOffset - 1). Los campos `daysFromEntry` /
  // `daysBeforeExpiry` / `isExpiration` se mantienen por compatibilidad con
  // futuros presets provenientes de la maqueta.
  const resolvedProcedures = (tasks || []).map((proc) => {
    let targetDate = null;
    if (proc.dayOffset !== undefined) {
      targetDate = addDays(entryDate, Number(proc.dayOffset) - 1);
    } else if (proc.daysFromEntry !== undefined) {
      targetDate = addDays(entryDate, proc.daysFromEntry);
    } else if (proc.daysBeforeExpiry !== undefined) {
      targetDate = addDays(expiryDate, -proc.daysBeforeExpiry);
    } else if (proc.isExpiration) {
      targetDate = new Date(expiryDate);
    }

    const daysUntilProc = targetDate ? differenceInDays(targetDate, todayDate) : null;
    const isPast = daysUntilProc !== null && daysUntilProc < 0;
    const done = proc.done === true;

    // Urgencia igual para todos los trámites: pendiente y a 5 días o menos
    // (los negativos también cuentan, ya pasó pero sigue pendiente).
    const urgent = !done && daysUntilProc !== null && daysUntilProc <= 5;

    return {
      ...proc,
      targetDate,
      daysUntilProc,
      isPast,
      done,
      urgent
    };
  });

  return {
    entryDate,
    expiryDate,
    today: todayDate,
    daysAbroad,
    daysRemaining,
    totalPeriodDays,
    percentElapsed,
    windowStartBeforeExpiry,
    safeDeadlineBeforeExpiry,
    prorrogaWindowStartDate,
    safeDeadlineDate,
    prorrogaWindowEndDate,
    isBeforeWindow,
    isInsideOptimalWindow,
    isInsideRiskWindow,
    isPostExpiryInGrace,
    isExpired,
    statusBadge,
    resolvedProcedures
  };
}
