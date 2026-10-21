/**
 * NomadStay — estado de la aplicación y persistencia en localStorage.
 * Extraído de app.js (Fase 1b). No importa el DOM (utilizable en tests).
 */

// Application State
const STATE = {
  profile: {
    origin: 'CO',
    destination: 'ES',
    stayType: 'student',
    arrivalDate: '', // YYYY-MM-DD
    allowedDays: 365
  },
  tasks: [],
  currentCalendarDate: new Date(),
  selectedDayForDetail: null,
  activeFilter: 'all'
};

const STORAGE_KEY_PROFILE = 'nomadstay_profile';
const STORAGE_KEY_TASKS = 'nomadstay_tasks';

function saveProfile() {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(STATE.profile));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(STATE.tasks));
}

export { STATE, STORAGE_KEY_PROFILE, STORAGE_KEY_TASKS, saveProfile, saveTasks };
