/**
 * Ventanas operativas de trámite migratorio.
 *
 * IMPORTANTE: estos valores NO son reglas legales. Los días autorizados, el
 * tope por ventana y la periodicidad viven en `src/data/presets.js`
 * (COUNTRY_RULES), que es la única fuente de verdad legal.
 *
 * Aquí solo se modela *cuándo* conviene radicar un trámite según la operación
 * del país de destino:
 *
 * - `windowStartBeforeExpiry`: días antes del vencimiento en que el sistema de
 *   migraciones habilita la prórroga.
 * - `safeDeadlineBeforeExpiry`: días antes del vencimiento a partir de los
 *   cuales ya se considera riesgo alto por tiempos de respuesta.
 * - `postGraceDays`: días posteriores al vencimiento con plazo extraordinario.
 *
 * Cambiar estos números NO cambia la legalidad de la estancia, solo la UI.
 */

/** Valores por defecto cuando el país/tipo de estancia no tiene ventana propia. */
export const DEFAULT_PROCESSING_WINDOW = Object.freeze({
  windowStartBeforeExpiry: 15,
  safeDeadlineBeforeExpiry: 5,
  postGraceDays: 0
});

const PROCESSING_WINDOWS = {
  CO: {
    // Migración Colombia: la prórroga del PIP se radica con máximo 15 días de
    // anticipación y mínimo 5 días hábiles antes del vencimiento.
    tourist: { windowStartBeforeExpiry: 15, safeDeadlineBeforeExpiry: 5, postGraceDays: 0 },
    student: { windowStartBeforeExpiry: 15, safeDeadlineBeforeExpiry: 5, postGraceDays: 0 }
  },
  PE: {
    // Sin datos operativos verificados todavía: se usa el default.
  },
  // Los países siguientes aún NO tienen regla legal verificada en COUNTRY_RULES,
  // así que su preset no se publica. La ventana queda definida para que el
  // preset funcione el día que se verifique la regla, sin tocar la UI.
  ES: {
    student: { windowStartBeforeExpiry: 60, safeDeadlineBeforeExpiry: 15, postGraceDays: 90 }
  },
  EU: {
    tourist: { windowStartBeforeExpiry: 15, safeDeadlineBeforeExpiry: 5, postGraceDays: 0 }
  },
  MX: {
    student: { windowStartBeforeExpiry: 30, safeDeadlineBeforeExpiry: 5, postGraceDays: 0 }
  }
};

/**
 * Devuelve la ventana de trámite para (país, tipo de estancia).
 * Nunca devuelve `null`: cae al default para no romper el cálculo mientras
 * se verifican nuevos países.
 *
 * @param {string} countryCode  Código ISO de 2 letras (ej. 'CO').
 * @param {string} stayType     Clave de COUNTRY_RULES (ej. 'tourist').
 */
export function getProcessingWindow(countryCode, stayType) {
  const byCountry = PROCESSING_WINDOWS[countryCode];
  const window = byCountry && byCountry[stayType];
  return { ...DEFAULT_PROCESSING_WINDOW, ...window };
}
