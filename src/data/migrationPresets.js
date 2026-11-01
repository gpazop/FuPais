/**
 * Registro DERIVADO de presets migratorios para la UI del shell.
 *
 * Este archivo NO contiene datos legales ni de presentación propios:
 * todo se compone cruzando:
 *
 *  - `presetPresentation.js` → textos y metadatos de UI (6 presets).
 *  - `presets.js` (COUNTRY_RULES) → regla legal verificada (única fuente de verdad).
 *  - `presets.js` (COUNTRY_TASKS) → trámites recomendados verificados.
 *  - `windows.js` → ventanas operativas (las consume `dashboard.js`, no van aquí).
 *
 * Regla de publicación: un preset solo entra al registro si su combinación
 * `(countryCode, stayType)` resuelve a una regla verificada en COUNTRY_RULES
 * Y a una lista de trámites en COUNTRY_TASKS. Con los datos actuales eso deja
 * fuera `espana_estudiante`, `schengen_turista` y `mexico_canje` (sin regla
 * ES / EU / MX verificada), mientras que los tres presets con datos
 * verificados (CO ×2 y PE turista) sí se publican. `presetPresentation.js`
 * puede listar los 6; este filtro es el que gobierna qué presets ve la UI.
 */

import { PRESET_PRESENTATION } from './presetPresentation.js';
import { getCountryRule, getStayTypeRuleKey, getPresetTasks } from './presets.js';

/**
 * Puente presetId → stayType de la app FuPais. La presentación es puramente
 * visual y no conoce los tipos de estancia de STAY_PRESETS; este es el único
 * lugar donde se traduce presetId → stayType.
 *
 * NOTA sobre colombia_intercambio (PIP-2 de intercambio): el estudiante sin
 * visa de estudios ingresa con el mismo Permiso de Ingreso y Permanencia (PIP)
 * que el turista, con matemática legalmente idéntica (90 días iniciales,
 * prorrogables por otros 90 hasta un tope de 180/año). Por eso usa la regla
 * CO.tourist: no es un atajo, es la regla realmente aplicable.
 *
 * Los TRÁMITES, en cambio, sí son específicos del intercambio (ven la regla
 * del mismo PIP pero con ventanas de radicación propias): PRESET_TASK_TYPES
 * los deriva a COUNTRY_TASKS.CO.intercambio en lugar del set de turismo.
 */
export const PRESET_STAY_TYPES = Object.freeze({
  colombia_intercambio: 'tourist_90',
  colombia_turista: 'tourist_90',
  peru_turista: 'tourist_90',
  schengen_turista: 'tourist_90',
  espana_estudiante: 'student',
  mexico_canje: 'student'
});

/**
 * Sobrescritura opcional del grupo de trámites por presetId. Lo que no esté
 * aquí resuelve por stayType (via STAY_TYPE_TO_TASK_KEYS en presets.js).
 */
const PRESET_TASK_TYPES = Object.freeze({
  colombia_intercambio: 'intercambio'
});

/** Un solo trámite por preset es la acción de prórroga (extiende los días). */
const EXTENSION_TASK_RE = /prórroga|renovaci/i;

export const MIGRATION_PRESETS = Object.fromEntries(
  Object.entries(PRESET_PRESENTATION)
    .map(([presetId, presentation]) => {
      const stayType = PRESET_STAY_TYPES[presetId];
      // Sin puente presetId→stayType declarado, el preset no es publicable.
      if (!stayType) return null;

      const { countryCode } = presentation;
      const rule = getCountryRule(countryCode, stayType);
      // La regla legal se resuelve por stayType; el grupo de trámites puede
      // sobrescribirse por presetId (intercambio comparte regla, no trámites).
      const taskType = PRESET_TASK_TYPES[presetId] ?? stayType;
      const tasks = getPresetTasks(countryCode, taskType);
      // El filtro de publicación: sin regla legal verificada y trámites
      // verificados, el preset se descarta aunque esté en la presentación.
      if (!rule || !tasks) return null;

      const ruleKey = getStayTypeRuleKey(stayType);

      return [
        presetId,
        {
          id: presetId,
          ...presentation,
          stayType,
          ruleKey,
          // totalAllowedDays y extendsDays salen de la regla legal, nunca de
          // la presentación. extendsDays = días que otorga exactamente una
          // prórroga (aquí coincide con la autorización inicial).
          // NOTA: esa igualdad está verificada para CO; para PE (turista)
          // la regla solo dice "prorrogable hasta 183 días en 365" sin fijar
          // lo que otorga la prórroga — revisar antes de afirmar "+90 días"
          // en la UI de ese preset.
          totalAllowedDays: rule.allowedDays,
          extendsDays: rule.allowedDays,
          legal: {
            title: rule.title,
            summary: rule.summary,
            source: rule.source,
            sourceUrl: rule.sourceUrl,
            verifiedAt: rule.verifiedAt
          },
          procedures: tasks.map((task, index) => {
            // El flag explícito en los datos gana sobre el heurístico por
            // título: "Apertura de Ventana de Prórroga…" contiene "prórroga"
            // pero NO es una acción de prórroga.
            const isExtensionAction =
              task.isExtensionAction ?? EXTENSION_TASK_RE.test(task.title);
            return {
              // Los ids NO deben cambiar: el estado persistente guarda el
              // progreso con estos ids (fupais_state_v2.completedProcedures).
              id: `${presetId}-p${index + 1}`,
              title: task.title,
              desc: task.description,
              category: task.category,
              priority: task.priority,
              dayOffset: task.dayOffset,
              isExtensionAction,
              extendsDays: isExtensionAction ? rule.allowedDays : null,
              officialUrl: isExtensionAction
                ? presentation.futFormUrl
                : presentation.officialPortalUrl
            };
          })
        }
      ];
    })
    .filter(Boolean)
);
