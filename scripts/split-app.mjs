/**
 * Fase 1b — Split mecánico de src/ui/app.js en módulos:
 *   src/state/store.js   : STATE + storage keys + saveProfile/saveTasks (sin DOM)
 *   src/ui/elements.js   : mapa de referencias DOM
 *   src/ui/render.js     : updateUI + render* + modales de detalle de día
 *   src/ui/app.js        : init/loadState, dropdowns, loadPresetTasks (country), modales, iCal, bindEvents
 *
 * Los cuerpos se cortan VERBATIM por rangos de líneas del app.js original,
 * con aserciones de anclaje (falla ruidosamente si el archivo cambió).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const uiDir = join(root, 'src', 'ui');
const stateDir = join(root, 'src', 'state');
mkdirSync(stateDir, { recursive: true });

const original = readFileSync(join(uiDir, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const lines = original.split('\n');
const at = (n) => lines[n - 1] ?? '<EOF>';
const seg = (a, b) => lines.slice(a - 1, b).join('\n');

const expect = (n, needle) => {
  if (!at(n).includes(needle)) {
    throw new Error(`Anchor fail at line ${n}: expected "${needle}", got "${at(n)}"`);
  }
};

// ---- Anclas verificadas ----
expect(11, 'const STATE = {');
expect(25, 'STORAGE_KEY_PROFILE');
expect(26, 'STORAGE_KEY_TASKS');
expect(29, 'const elements = {');
expect(114, '};');
expect(118, 'function init() {');
expect(125, 'function loadState() {');
expect(160, 'function saveProfile() {');
expect(168, 'function populateDropdowns() {');
expect(196, 'function loadPresetTasks');
expect(226, 'function updateUI() {');
expect(238, 'function updateRuleNote() {');
expect(278, 'function renderProfileInfo() {');
expect(290, 'function calculateMetrics() {');
expect(380, 'function renderCalendar() {');
expect(476, 'function renderTasks');
expect(563, 'function toggleTaskComplete');
expect(572, 'function deleteTask');
expect(581, 'function openProfileModal');
expect(610, 'function closeTaskModal');
expect(614, 'function openDayDetailModal');
expect(686, 'function closeDayDetailModal');
expect(691, 'function exportToICal');
expect(749, 'function bindEvents');

// ---- Backup del original ----
writeFileSync(join(root, 'scripts', 'app.js.pre-split.bak'),
  readFileSync(join(uiDir, 'app.js'), 'utf8'));

// ---- elements.js ----
const elementsSrc = `/**
 * NomadStay — mapa único de referencias a elementos del DOM.
 * Extraído de app.js (Fase 1b) sin cambios de comportamiento.
 */

${seg(29, 114)}

export { elements };
`;

// ---- store.js ----
const storeSrc = `/**
 * NomadStay — estado de la aplicación y persistencia en localStorage.
 * Extraído de app.js (Fase 1b). No importa el DOM (utilizable en tests).
 */

${seg(10, 26)}

${seg(160, 166)}

export { STATE, STORAGE_KEY_PROFILE, STORAGE_KEY_TASKS, saveProfile, saveTasks };
`;

// ---- render.js ----
const renderSrc = `/**
 * NomadStay — capa de render: actualiza el DOM a partir de STATE.
 * Extraído de app.js (Fase 1b) sin cambios de comportamiento.
 */

import { STATE, saveTasks } from '../state/store.js';
import { elements } from './elements.js';
import { STAY_PRESETS, COUNTRIES_LIST, getCountryRule } from '../data/presets.js';
import { parseDate, formatDateISO, formatDateSpanish, getDaysDifference, addDaysToDate, getLastAllowedDate } from '../domain/dates.js';
import { escapeHtml, escapeIcsText, priorityLabel } from '../domain/format.js';

${seg(224, 289)}

${seg(290, 377)}

${seg(378, 473)}

${seg(474, 578)}

${seg(613, 688)}

export { updateUI, openDayDetailModal, closeDayDetailModal };
`;

// ---- app.js (reescrito) ----
let initAndLoadState = seg(117, 158);
const oldCall = 'loadPresetTasks(STATE.profile.stayType, false);';
const newCall = 'loadPresetTasks(STATE.profile.destination, STATE.profile.stayType, false);';
if (!initAndLoadState.includes(oldCall)) {
  throw new Error('loadState call to loadPresetTasks not found as expected.');
}
initAndLoadState = initAndLoadState.replace(oldCall, newCall);

const loadPresetTasksNew = `/**
 * Carga los trámites recomendados según PAÍS DE DESTINO + TIPO DE ESTANCIA.
 * Si no hay datos verificados para la combinación (getPresetTasks → null),
 * cae al preset genérico de STAY_PRESETS (comportamiento previo).
 */
function loadPresetTasks(countryCode, stayType, shouldConfirm = true) {
  if (shouldConfirm) {
    const confirmed = confirm('Cambiaste de tipo de estancia o país de destino. ¿Deseas cargar los trámites recomendados para el nuevo perfil?');
    if (!confirmed) return;
  }

  const presetTasks = getPresetTasks(countryCode, stayType)
    || (STAY_PRESETS[stayType] || STAY_PRESETS.student).tasks;
  const arrival = STATE.profile.arrivalDate || formatDateISO(new Date());

  const newTasks = presetTasks.map((item, index) => {
    // dayOffset es 1-based (día de estancia): el día de llegada es el Día 1,
    // por lo que el offset real desde la fecha de llegada es dayOffset - 1.
    const taskDate = addDaysToDate(arrival, item.dayOffset - 1);
    return {
      id: 'task_' + Date.now() + '_' + index,
      title: item.title,
      date: taskDate,
      category: item.category,
      priority: item.priority,
      description: item.description,
      completed: false
    };
  });

  STATE.tasks = newTasks;
  saveTasks();
  updateUI();
}`;

const appSrc = `/**
 * NomadStay — capa de aplicación: init, bindings, modales de perfil/tarea
 * y exportación a iCal. Refactor Fase 1b: el estado vive en src/state/store.js
 * y el render en src/ui/render.js.
 */

import { STAY_PRESETS, COUNTRIES_LIST, getPresetTasks } from '../data/presets.js';
import { parseDate, formatDateISO, formatDateSpanish, getDaysDifference, addDaysToDate, getLastAllowedDate } from '../domain/dates.js';
import { escapeHtml, escapeIcsText, priorityLabel } from '../domain/format.js';
import { STATE, STORAGE_KEY_PROFILE, STORAGE_KEY_TASKS, saveProfile, saveTasks } from '../state/store.js';
import { elements } from './elements.js';
import { updateUI, openDayDetailModal, closeDayDetailModal } from './render.js';

export { init };

${initAndLoadState}

${seg(167, 194)}

${loadPresetTasksNew}

${seg(579, 612)}

${seg(689, 746)}

${seg(747, 877)}
`;

writeFileSync(join(uiDir, 'elements.js'), elementsSrc);
writeFileSync(join(stateDir, 'store.js'), storeSrc);
writeFileSync(join(uiDir, 'render.js'), renderSrc);
writeFileSync(join(uiDir, 'app.js'), appSrc);

console.log('Split OK');
console.log('elements.js:', elementsSrc.split('\n').length, 'lines');
console.log('store.js:', storeSrc.split('\n').length, 'lines');
console.log('render.js:', renderSrc.split('\n').length, 'lines');
console.log('app.js:', appSrc.split('\n').length, 'lines');
