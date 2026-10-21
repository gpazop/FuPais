/**
 * NomadStay - Stay & Visa Tracker Application Logic
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

// DOM Elements
const elements = {
  // Navigation
  btnOpenProfileModal: document.getElementById('btnOpenProfileModal'),
  btnExportCalendar: document.getElementById('btnExportCalendar'),
  btnOpenNewTaskModal: document.getElementById('btnOpenNewTaskModal'),

  // Status Banner
  routeBadge: document.getElementById('routeBadge'),
  flagOrigin: document.getElementById('flagOrigin'),
  countryOriginName: document.getElementById('countryOriginName'),
  flagDestination: document.getElementById('flagDestination'),
  countryDestinationName: document.getElementById('countryDestinationName'),
  stayTypeBadge: document.getElementById('stayTypeBadge'),
  statusPill: document.getElementById('statusPill'),
  statusPillText: document.getElementById('statusPillText'),
  progressDaysElapsed: document.getElementById('progressDaysElapsed'),
  progressDaysTotal: document.getElementById('progressDaysTotal'),
  progressPercentage: document.getElementById('progressPercentage'),
  progressBarFill: document.getElementById('progressBarFill'),

  // Metrics
  metricDaysElapsed: document.getElementById('metricDaysElapsed'),
  metricArrivalDate: document.getElementById('metricArrivalDate'),
  metricDaysRemaining: document.getElementById('metricDaysRemaining'),
  metricLimitDate: document.getElementById('metricLimitDate'),
  iconWrapRemaining: document.getElementById('iconWrapRemaining'),
  metricNextTaskDays: document.getElementById('metricNextTaskDays'),
  metricNextTaskTitle: document.getElementById('metricNextTaskTitle'),
  metricTasksProgress: document.getElementById('metricTasksProgress'),

  // Calendar
  calMonthTitle: document.getElementById('calMonthTitle'),
  btnCalPrev: document.getElementById('btnCalPrev'),
  btnCalNext: document.getElementById('btnCalNext'),
  btnCalToday: document.getElementById('btnCalToday'),
  calendarDaysGrid: document.getElementById('calendarDaysGrid'),

  // Tasks
  tasksListContainer: document.getElementById('tasksListContainer'),
  btnQuickAddPresetTasks: document.getElementById('btnQuickAddPresetTasks'),
  filterChips: document.querySelectorAll('.filter-chip'),
  countAll: document.getElementById('countAll'),
  countPending: document.getElementById('countPending'),
  countUrgent: document.getElementById('countUrgent'),
  countCompleted: document.getElementById('countCompleted'),

  // Profile Modal
  profileModal: document.getElementById('profileModal'),
  btnCloseProfileModal: document.getElementById('btnCloseProfileModal'),
  btnCancelProfile: document.getElementById('btnCancelProfile'),
  profileForm: document.getElementById('profileForm'),
  selectOrigin: document.getElementById('selectOrigin'),
  selectDestination: document.getElementById('selectDestination'),
  selectStayPreset: document.getElementById('selectStayPreset'),
  inputArrivalDate: document.getElementById('inputArrivalDate'),
  inputAllowedDays: document.getElementById('inputAllowedDays'),

  // Task Modal
  taskModal: document.getElementById('taskModal'),
  taskModalTitle: document.getElementById('taskModalTitle'),
  btnCloseTaskModal: document.getElementById('btnCloseTaskModal'),
  btnCancelTask: document.getElementById('btnCancelTask'),
  taskForm: document.getElementById('taskForm'),
  inputTaskId: document.getElementById('inputTaskId'),
  inputTaskTitle: document.getElementById('inputTaskTitle'),
  inputTaskDate: document.getElementById('inputTaskDate'),
  selectTaskPriority: document.getElementById('selectTaskPriority'),
  inputTaskCategory: document.getElementById('inputTaskCategory'),
  inputTaskDesc: document.getElementById('inputTaskDesc'),

  // Day Detail Modal
  dayDetailModal: document.getElementById('dayDetailModal'),
  dayDetailModalTitle: document.getElementById('dayDetailModalTitle'),
  dayDetailModalSubtitle: document.getElementById('dayDetailModalSubtitle'),
  dayDetailEventsContainer: document.getElementById('dayDetailEventsContainer'),
  btnCloseDayDetailModal: document.getElementById('btnCloseDayDetailModal'),
  btnCloseDayDetailBtn: document.getElementById('btnCloseDayDetailBtn'),
  btnDayDetailAddEvent: document.getElementById('btnDayDetailAddEvent')
};

// Utilities: Date Helpers
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateISO(date) {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

function formatDateSpanish(dateStr) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysDifference(date1, date2) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

function addDaysToDate(dateStr, days) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + Number(days));
  return formatDateISO(d);
}

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
    loadPresetTasks(STATE.profile.stayType, false);
  }
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(STATE.profile));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(STATE.tasks));
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

function loadPresetTasks(presetKey, shouldConfirm = true) {
  if (shouldConfirm && STATE.tasks.length > 0) {
    const confirmed = confirm('¿Deseas recargar los trámites sugeridos? Esto reemplazará o agregará la lista recomendada para este perfil.');
    if (!confirmed) return;
  }

  const preset = STAY_PRESETS[presetKey] || STAY_PRESETS.student;
  const arrival = STATE.profile.arrivalDate || formatDateISO(new Date());

  const newTasks = preset.tasks.map((item, index) => {
    const taskDate = addDaysToDate(arrival, item.dayOffset);
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

// UI Refresh
function updateUI() {
  renderProfileInfo();
  calculateMetrics();
  renderCalendar();
  renderTasks();
}

function renderProfileInfo() {
  const origin = COUNTRIES_LIST.find(c => c.code === STATE.profile.origin) || { name: 'Colombia', flag: '🇨🇴' };
  const dest = COUNTRIES_LIST.find(c => c.code === STATE.profile.destination) || { name: 'España', flag: '🇪🇸' };
  const preset = STAY_PRESETS[STATE.profile.stayType] || STAY_PRESETS.student;

  elements.flagOrigin.textContent = origin.flag;
  elements.countryOriginName.textContent = origin.name;
  elements.flagDestination.textContent = dest.flag;
  elements.countryDestinationName.textContent = dest.name;
  elements.stayTypeBadge.textContent = `${preset.icon} ${preset.name}`;
}

function calculateMetrics() {
  const today = new Date();
  const arrival = parseDate(STATE.profile.arrivalDate);
  const allowed = Number(STATE.profile.allowedDays) || 365;

  // Days Elapsed
  const elapsed = Math.max(0, getDaysDifference(arrival, today));
  elements.metricDaysElapsed.textContent = elapsed;
  elements.metricArrivalDate.textContent = `Llegada: ${formatDateSpanish(STATE.profile.arrivalDate)}`;

  // Limit Date
  const limitDateStr = addDaysToDate(STATE.profile.arrivalDate, allowed);
  const limitDate = parseDate(limitDateStr);
  elements.metricLimitDate.textContent = `Límite legal: ${formatDateSpanish(limitDateStr)}`;

  // Remaining Days
  const remaining = allowed - elapsed;
  elements.metricDaysRemaining.textContent = remaining;

  // Progress Bar
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / allowed) * 100)));
  elements.progressDaysElapsed.textContent = elapsed;
  elements.progressDaysTotal.textContent = allowed;
  elements.progressPercentage.textContent = `${pct}%`;
  elements.progressBarFill.style.width = `${pct}%`;

  // Status Pill & Health classification
  elements.statusPill.className = 'status-pill';
  elements.progressBarFill.className = 'progress-bar-fill';
  elements.iconWrapRemaining.className = 'metric-icon-wrap';

  if (remaining <= 0) {
    elements.statusPill.classList.add('danger');
    elements.statusPillText.textContent = '¡Estancia Expirada!';
    elements.progressBarFill.classList.add('danger');
    elements.iconWrapRemaining.classList.add('danger');
    elements.metricDaysRemaining.style.color = '#ef4444';
  } else if (remaining <= 30) {
    elements.statusPill.classList.add('danger');
    elements.statusPillText.textContent = 'Crítico: Salida / Prórroga Urgente';
    elements.progressBarFill.classList.add('danger');
    elements.iconWrapRemaining.classList.add('warning');
    elements.metricDaysRemaining.style.color = '#ef4444';
  } else if (remaining <= 60) {
    elements.statusPill.classList.add('warning');
    elements.statusPillText.textContent = 'Atención: Ventana de Renovación';
    elements.progressBarFill.classList.add('warning');
    elements.iconWrapRemaining.classList.add('warning');
    elements.metricDaysRemaining.style.color = '#f59e0b';
  } else {
    elements.statusPill.classList.add('safe');
    elements.statusPillText.textContent = 'Estancia en Regla';
    elements.progressBarFill.classList.add('safe');
    elements.iconWrapRemaining.classList.add('safe');
    elements.metricDaysRemaining.style.color = '#10b981';
  }

  // Next Critical Task calculation
  const pendingTasks = STATE.tasks
    .filter(t => !t.completed)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  if (pendingTasks.length > 0) {
    const nextTask = pendingTasks[0];
    const diffDays = getDaysDifference(today, parseDate(nextTask.date));

    if (diffDays < 0) {
      elements.metricNextTaskDays.textContent = `Vencido (${Math.abs(diffDays)}d)`;
      elements.metricNextTaskDays.style.color = '#ef4444';
    } else if (diffDays === 0) {
      elements.metricNextTaskDays.textContent = '¡Hoy!';
      elements.metricNextTaskDays.style.color = '#ef4444';
    } else {
      elements.metricNextTaskDays.textContent = `En ${diffDays} días`;
      elements.metricNextTaskDays.style.color = '#f59e0b';
    }
    elements.metricNextTaskTitle.textContent = nextTask.title;
    elements.metricNextTaskTitle.title = nextTask.title;
  } else {
    elements.metricNextTaskDays.textContent = 'Al día';
    elements.metricNextTaskDays.style.color = '#10b981';
    elements.metricNextTaskTitle.textContent = 'Todos los trámites completados';
  }

  // Tasks Compliance Counter
  const completedCount = STATE.tasks.filter(t => t.completed).length;
  elements.metricTasksProgress.textContent = `${completedCount}/${STATE.tasks.length}`;
}

// Calendar Rendering
function renderCalendar() {
  const current = STATE.currentCalendarDate;
  const year = current.getFullYear();
  const month = current.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  elements.calMonthTitle.textContent = `${monthNames[month]} ${year}`;
  elements.calendarDaysGrid.innerHTML = '';

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Adjust for Monday starting (0 is Sunday, 1 is Monday...)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  // Empty slots before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day empty';
    elements.calendarDaysGrid.appendChild(emptyCell);
  }

  const todayStr = formatDateISO(new Date());
  const arrivalStr = STATE.profile.arrivalDate;
  const limitDateStr = addDaysToDate(arrivalStr, STATE.profile.allowedDays);

  const arrivalDate = parseDate(arrivalStr);
  const limitDate = parseDate(limitDateStr);

  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d);
    const dayStr = formatDateISO(dayDate);

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.dataset.date = dayStr;

    // Check conditions
    if (dayStr === todayStr) {
      cell.classList.add('today');
    }

    if (dayDate >= arrivalDate && dayDate <= limitDate) {
      cell.classList.add('in-stay');
    }

    if (dayStr === arrivalStr) {
      cell.classList.add('arrival-day');
      cell.title = 'Fecha de llegada a tu destino';
    }

    if (dayStr === limitDateStr) {
      cell.classList.add('limit-day');
      cell.title = 'Fecha límite legal de estancia autorizada';
    }

    // Day number
    const numSpan = document.createElement('span');
    numSpan.className = 'day-number';
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    // Indicator dots for tasks on this day
    const dayTasks = STATE.tasks.filter(t => t.date === dayStr);
    if (dayTasks.length > 0) {
      const indicatorsWrap = document.createElement('div');
      indicatorsWrap.className = 'day-indicators';

      dayTasks.forEach(task => {
        const dot = document.createElement('span');
        dot.className = `event-dot ${task.completed ? 'completed' : task.priority}`;
        dot.title = `${task.title} (${task.priority})`;
        indicatorsWrap.appendChild(dot);
      });

      cell.appendChild(indicatorsWrap);
    }

    // Click event to inspect day
    cell.addEventListener('click', () => {
      openDayDetailModal(dayStr, dayTasks);
    });

    elements.calendarDaysGrid.appendChild(cell);
  }
}

// Tasks Rendering
function renderTasks() {
  const filter = STATE.activeFilter;
  let filtered = [...STATE.tasks];

  // Update counts
  elements.countAll.textContent = STATE.tasks.length;
  elements.countPending.textContent = STATE.tasks.filter(t => !t.completed).length;
  elements.countUrgent.textContent = STATE.tasks.filter(t => !t.completed && t.priority === 'urgent').length;
  elements.countCompleted.textContent = STATE.tasks.filter(t => t.completed).length;

  if (filter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (filter === 'urgent') {
    filtered = filtered.filter(t => !t.completed && t.priority === 'urgent');
  } else if (filter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // Sort by date ascending
  filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  elements.tasksListContainer.innerHTML = '';

  if (filtered.length === 0) {
    elements.tasksListContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.9rem;">
        No hay trámites en esta vista. ¡Haz clic en <strong>+ Nuevo Trámite</strong> para añadir uno!
      </div>
    `;
    return;
  }

  const today = new Date();

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.dataset.id = task.id;

    const diffDays = getDaysDifference(today, parseDate(task.date));
    let dateBadgeText = '';

    if (task.completed) {
      dateBadgeText = `Completado (${formatDateSpanish(task.date)})`;
    } else if (diffDays < 0) {
      dateBadgeText = `⚠️ Vencido hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      dateBadgeText = `🚨 ¡Vence hoy!`;
    } else {
      dateBadgeText = `Vence en ${diffDays} días (${formatDateSpanish(task.date)})`;
    }

    item.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} title="Marcar como cumplido">
      <div class="task-body">
        <div class="task-meta-top">
          <span class="task-category">${task.category || 'General'}</span>
          <span class="task-urgency-badge ${task.priority}">${task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : 'Normal'}</span>
        </div>
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
        <div class="task-date-info">
          <span>📅</span> <span>${dateBadgeText}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon-del btn-delete-task" title="Eliminar trámite">🗑️</button>
      </div>
    `;

    // Toggle Completed checkbox
    const checkbox = item.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      toggleTaskComplete(task.id, checkbox.checked);
    });

    // Delete Button
    const btnDelete = item.querySelector('.btn-delete-task');
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    elements.tasksListContainer.appendChild(item);
  });
}

function toggleTaskComplete(taskId, isCompleted) {
  const t = STATE.tasks.find(x => x.id === taskId);
  if (t) {
    t.completed = isCompleted;
    saveTasks();
    updateUI();
  }
}

function deleteTask(taskId) {
  if (confirm('¿Deseas eliminar este trámite?')) {
    STATE.tasks = STATE.tasks.filter(x => x.id !== taskId);
    saveTasks();
    updateUI();
  }
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

function openDayDetailModal(dateStr, tasksOnDay) {
  STATE.selectedDayForDetail = dateStr;
  elements.dayDetailModalTitle.textContent = `Detalles del ${formatDateSpanish(dateStr)}`;
  
  const today = new Date();
  const dayDate = parseDate(dateStr);
  const diffFromToday = getDaysDifference(today, dayDate);
  let statusText = '';
  if (diffFromToday === 0) statusText = 'El día de hoy';
  else if (diffFromToday > 0) statusText = `En ${diffFromToday} días desde hoy`;
  else statusText = `Ocurrió hace ${Math.abs(diffFromToday)} días`;

  elements.dayDetailModalSubtitle.textContent = statusText;
  elements.dayDetailEventsContainer.innerHTML = '';

  const isArrival = dateStr === STATE.profile.arrivalDate;
  const limitDateStr = addDaysToDate(STATE.profile.arrivalDate, STATE.profile.allowedDays);
  const isLimit = dateStr === limitDateStr;

  if (isArrival) {
    const arrivalBadge = document.createElement('div');
    arrivalBadge.className = 'task-item';
    arrivalBadge.style.borderColor = 'var(--status-safe)';
    arrivalBadge.innerHTML = `
      <div class="task-body">
        <div class="task-title" style="color: var(--status-safe);">🛬 Entrada Oficial al País</div>
        <div class="task-desc">Inicia el conteo de tu estancia legal según tu pasaporte y sello de control fronterizo.</div>
      </div>
    `;
    elements.dayDetailEventsContainer.appendChild(arrivalBadge);
  }

  if (isLimit) {
    const limitBadge = document.createElement('div');
    limitBadge.className = 'task-item';
    limitBadge.style.borderColor = 'var(--status-danger)';
    limitBadge.innerHTML = `
      <div class="task-body">
        <div class="task-title" style="color: var(--status-danger);">🚨 Vencimiento de Estancia Autorizada</div>
        <div class="task-desc">Fecha máxima legal para haber salido del territorio o haber solicitado la prórroga de estancia.</div>
      </div>
    `;
    elements.dayDetailEventsContainer.appendChild(limitBadge);
  }

  if (tasksOnDay.length > 0) {
    tasksOnDay.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskDiv.innerHTML = `
        <div class="task-body">
          <div class="task-meta-top">
            <span class="task-category">${task.category}</span>
            <span class="task-urgency-badge ${task.priority}">${task.priority}</span>
          </div>
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description || 'Sin notas adicionales.'}</div>
        </div>
      `;
      elements.dayDetailEventsContainer.appendChild(taskDiv);
    });
  } else if (!isArrival && !isLimit) {
    elements.dayDetailEventsContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 1.5rem;">
        No tienes eventos ni trámites agendados para este día.
      </div>
    `;
  }

  elements.dayDetailModal.classList.add('active');
}

function closeDayDetailModal() {
  elements.dayDetailModal.classList.remove('active');
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
  const limitDateStr = addDaysToDate(STATE.profile.arrivalDate, STATE.profile.allowedDays);
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
      `SUMMARY:[${task.category || 'Trámite'}] ${task.title}`,
      `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n')}`,
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
    const oldStayType = STATE.profile.stayType;
    const newStayType = elements.selectStayPreset.value;

    STATE.profile.origin = elements.selectOrigin.value;
    STATE.profile.destination = elements.selectDestination.value;
    STATE.profile.stayType = newStayType;
    STATE.profile.arrivalDate = elements.inputArrivalDate.value;
    STATE.profile.allowedDays = Number(elements.inputAllowedDays.value) || 365;

    saveProfile();
    closeProfileModal();

    // If stay type changed, offer to reload tasks
    if (oldStayType !== newStayType) {
      if (confirm('Cambiaste de tipo de estancia. ¿Deseas cargar la lista de trámites recomendados para este nuevo perfil?')) {
        loadPresetTasks(newStayType, false);
      }
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
    loadPresetTasks(STATE.profile.stayType, true);
  });

  // Export to iCal
  elements.btnExportCalendar.addEventListener('click', exportToICal);
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
