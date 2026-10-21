/**
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

// Initialization
function init() {
  loadState();
  populateDropdowns();
  bindEvents();
  updateUI();
}

function loadState() {
  const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
  const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);

  if (savedProfile) {
    STATE.profile = JSON.parse(savedProfile);
    // Sanidad: datos viejos o corruptos no deben romper el conteo
    const savedDays = Number(STATE.profile.allowedDays);
    if (!Number.isFinite(savedDays) || savedDays < 1) {
      STATE.profile.allowedDays = 365;
    }
  } else {
    // Default initial profile for student arriving ~90 days ago
    const today = new Date();
    const defaultArrival = new Date(today);
    defaultArrival.setDate(today.getDate() - 95); // 95 days ago

    STATE.profile = {
      origin: 'CO',
      destination: 'ES',
      stayType: 'student',
      arrivalDate: formatDateISO(defaultArrival),
      allowedDays: 365
    };
    saveProfile();
  }

  if (savedTasks) {
    STATE.tasks = JSON.parse(savedTasks);
  } else {
    // Generate default tasks based on preset
    loadPresetTasks(STATE.profile.destination, STATE.profile.stayType, false);
  }
}


function populateDropdowns() {
  // Countries
  elements.selectOrigin.innerHTML = '';
  elements.selectDestination.innerHTML = '';

  COUNTRIES_LIST.forEach(country => {
    const optOrig = document.createElement('option');
    optOrig.value = country.code;
    optOrig.textContent = `${country.flag} ${country.name}`;
    elements.selectOrigin.appendChild(optOrig);

    const optDest = document.createElement('option');
    optDest.value = country.code;
    optDest.textContent = `${country.flag} ${country.name}`;
    elements.selectDestination.appendChild(optDest);
  });

  // Presets
  elements.selectStayPreset.innerHTML = '';
  Object.keys(STAY_PRESETS).forEach(key => {
    const preset = STAY_PRESETS[key];
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${preset.icon} ${preset.name}`;
    elements.selectStayPreset.appendChild(opt);
  });
}

/**
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
}


// Modal Handlers
function openProfileModal() {
  elements.selectOrigin.value = STATE.profile.origin;
  elements.selectDestination.value = STATE.profile.destination;
  elements.selectStayPreset.value = STATE.profile.stayType;
  elements.inputArrivalDate.value = STATE.profile.arrivalDate;
  elements.inputAllowedDays.value = STATE.profile.allowedDays;

  elements.profileModal.classList.add('active');
}

function closeProfileModal() {
  elements.profileModal.classList.remove('active');
}

function openNewTaskModal(defaultDate = null) {
  elements.inputTaskId.value = '';
  elements.taskForm.reset();
  elements.taskModalTitle.textContent = 'Nuevo Trámite o Hito Migratorio';

  if (defaultDate) {
    elements.inputTaskDate.value = defaultDate;
  } else {
    // Default to in 15 days
    elements.inputTaskDate.value = formatDateISO(new Date(Date.now() + 15 * 86400000));
  }

  elements.taskModal.classList.add('active');
}

function closeTaskModal() {
  elements.taskModal.classList.remove('active');
}


// Export to iCal (.ics) format
function exportToICal() {
  if (STATE.tasks.length === 0) {
    alert('No hay eventos o trámites para exportar.');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NomadStay//MigracionTracker//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NomadStay Trámites y Permanencia'
  ];

  // Add Limit Date event
  const limitDateStr = getLastAllowedDate(STATE.profile.arrivalDate, STATE.profile.allowedDays);
  const limitCleanDate = limitDateStr.replace(/-/g, '');
  icsContent.push(
    'BEGIN:VEVENT',
    `UID:limit_${Date.now()}@nomadstay.app`,
    `DTSTAMP:${formatDateISO(new Date()).replace(/-/g, '')}T120000Z`,
    `DTSTART;VALUE=DATE:${limitCleanDate}`,
    `SUMMARY:🚨 Vencimiento de Estancia / Límite Prórroga`,
    `DESCRIPTION:Fecha límite legal de estancia autorizada fuera de tu país de origen.`,
    'STATUS:CONFIRMED',
    'END:VEVENT'
  );

  // Add Tasks
  STATE.tasks.forEach(task => {
    const cleanDate = task.date.replace(/-/g, '');
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@nomadstay.app`,
      `DTSTAMP:${formatDateISO(new Date()).replace(/-/g, '')}T120000Z`,
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `SUMMARY:[${escapeIcsText(task.category || 'Trámite')}] ${escapeIcsText(task.title)}`,
      `DESCRIPTION:${escapeIcsText(task.description || '')}`,
      `STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NomadStay_Eventos_${formatDateISO(new Date())}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Event Bindings
function bindEvents() {
  // Navigation Modals
  elements.btnOpenProfileModal.addEventListener('click', openProfileModal);
  elements.btnCloseProfileModal.addEventListener('click', closeProfileModal);
  elements.btnCancelProfile.addEventListener('click', closeProfileModal);

  elements.btnOpenNewTaskModal.addEventListener('click', () => openNewTaskModal());
  elements.btnCloseTaskModal.addEventListener('click', closeTaskModal);
  elements.btnCancelTask.addEventListener('click', closeTaskModal);

  elements.btnCloseDayDetailModal.addEventListener('click', closeDayDetailModal);
  elements.btnCloseDayDetailBtn.addEventListener('click', closeDayDetailModal);
  elements.btnDayDetailAddEvent.addEventListener('click', () => {
    const targetDate = STATE.selectedDayForDetail;
    closeDayDetailModal();
    openNewTaskModal(targetDate);
  });

  // Calendar Month Navigation
  elements.btnCalPrev.addEventListener('click', () => {
    STATE.currentCalendarDate.setMonth(STATE.currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });

  elements.btnCalNext.addEventListener('click', () => {
    STATE.currentCalendarDate.setMonth(STATE.currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });

  elements.btnCalToday.addEventListener('click', () => {
    STATE.currentCalendarDate = new Date();
    renderCalendar();
  });

  // Profile Form Submit
  elements.profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validaciones: fecha de llegada obligatoria y días autorizados >= 1
    if (!elements.inputArrivalDate.value) {
      alert('Debes indicar tu fecha de llegada al país de destino.');
      return;
    }
    const parsedAllowedDays = Number(elements.inputAllowedDays.value);
    if (!Number.isFinite(parsedAllowedDays) || parsedAllowedDays < 1) {
      alert('Los días autorizados deben ser un número mayor o igual a 1.');
      return;
    }

    const oldStayType = STATE.profile.stayType;
    const oldDestination = STATE.profile.destination;
    const newStayType = elements.selectStayPreset.value;

    STATE.profile.origin = elements.selectOrigin.value;
    STATE.profile.destination = elements.selectDestination.value;
    STATE.profile.stayType = newStayType;
    STATE.profile.arrivalDate = elements.inputArrivalDate.value;
    STATE.profile.allowedDays = Math.floor(parsedAllowedDays);

    saveProfile();
    closeProfileModal();

    // Si cambió el país de destino o el tipo de estancia, ofrecer recargar trámites
    // (el mensaje unificado vive dentro de loadPresetTasks)
    if (oldStayType !== newStayType || oldDestination !== STATE.profile.destination) {
      loadPresetTasks(STATE.profile.destination, newStayType, true);
    }

    updateUI();
  });

  // Preset Select Auto-updates default days in modal
  elements.selectStayPreset.addEventListener('change', (e) => {
    const preset = STAY_PRESETS[e.target.value];
    if (preset) {
      elements.inputAllowedDays.value = preset.defaultDays;
    }
  });

  // Task Form Submit
  elements.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validaciones: título y fecha obligatorios
    if (!elements.inputTaskTitle.value.trim()) {
      alert('El trámite necesita un título.');
      return;
    }
    if (!elements.inputTaskDate.value) {
      alert('Debes indicar la fecha del trámite.');
      return;
    }

    const newTask = {
      id: elements.inputTaskId.value || 'task_' + Date.now(),
      title: elements.inputTaskTitle.value.trim(),
      date: elements.inputTaskDate.value,
      priority: elements.selectTaskPriority.value,
      category: elements.inputTaskCategory.value.trim() || 'General',
      description: elements.inputTaskDesc.value.trim(),
      completed: false
    };

    STATE.tasks.push(newTask);
    saveTasks();
    closeTaskModal();
    updateUI();
  });

  // Filter Chips Click
  elements.filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.activeFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  // Quick reload presets button
  elements.btnQuickAddPresetTasks.addEventListener('click', () => {
    loadPresetTasks(STATE.profile.destination, STATE.profile.stayType, true);
  });

  // Export to iCal
  elements.btnExportCalendar.addEventListener('click', exportToICal);
}

// Start app on DOMContentLoaded
