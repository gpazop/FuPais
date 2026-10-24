/**
 * FuPais — capa de render: actualiza el DOM a partir de STATE.
 * Extraído de app.js (Fase 1b) sin cambios de comportamiento.
 */

import { STATE, saveTasks } from '../state/store.js';
import { elements } from './elements.js';
import { STAY_PRESETS, COUNTRIES_LIST, getCountryRule } from '../data/presets.js';
import { parseDate, formatDateISO, formatDateSpanish, getDaysDifference, addDaysToDate, getLastAllowedDate } from '../domain/dates.js';
import { escapeHtml, escapeIcsText, priorityLabel } from '../domain/format.js';


// UI Refresh
function updateUI() {
  renderProfileInfo();
  updateRuleNote();
  calculateMetrics();
  renderCalendar();
  renderTasks();
}

/**
 * Muestra la regla de permanencia verificada para (país destino, tipo de estancia).
 * Sin datos verificados (getCountryRule → null) muestra nota genérica, nunca cifras inventadas.
 */
function updateRuleNote() {
  const dest = COUNTRIES_LIST.find(c => c.code === STATE.profile.destination) || { name: 'tu país de destino' };
  const preset = STAY_PRESETS[STATE.profile.stayType] || STAY_PRESETS.student;
  const rule = getCountryRule(STATE.profile.destination, STATE.profile.stayType);

  if (!rule) {
    elements.ruleNote.hidden = false;
    elements.ruleNoteFlag.textContent = '❓';
    elements.ruleNoteTitle.textContent = `Sin datos verificados — ${dest.name} · ${preset.name}`;
    elements.ruleNoteBody.innerHTML =
      `Todavía no hay cifras de permanencia verificadas para <strong>${escapeHtml(dest.name)}</strong> ` +
      `con el tipo de estancia <strong>${escapeHtml(preset.name)}</strong>. La App calcula con los ` +
      `días que indiques en tu perfil, pero esa cifra NO proviene de una fuente oficial verificada: ` +
      `revisa la web de migraciones del país antes de planificar.`;
    elements.ruleNoteSource.textContent = '';
    return;
  }

  const anchor = (url, text) =>
    `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;

  const srcLinks = [];
  if (rule.sourceUrl && rule.source) srcLinks.push(anchor(rule.sourceUrl, rule.source));
  if (rule.extraSources) {
    rule.extraSources.forEach((url) => {
      let label = url;
      try { label = new URL(url).hostname; } catch { /* URL inválida: ignora */ }
      srcLinks.push(anchor(url, label));
    });
  }

  elements.ruleNote.hidden = false;
  elements.ruleNoteFlag.textContent = rule.flag || '📖';
  elements.ruleNoteTitle.textContent = `${rule.country} · ${rule.title}`;
  elements.ruleNoteBody.textContent = rule.summary;
  elements.ruleNoteSource.innerHTML = srcLinks.length
    ? `📄 Fuente: ${srcLinks.join(' · ')}${rule.verifiedAt ? ` · datos verificados el ${formatDateSpanish(rule.verifiedAt)}` : ''}`
    : '';
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

  // Days Elapsed (conteo inclusivo: el día de llegada es el Día 1)
  const elapsed = today >= arrival ? getDaysDifference(arrival, today) + 1 : 0;
  elements.metricDaysElapsed.textContent = elapsed;
  elements.metricArrivalDate.textContent = `Llegada: ${formatDateSpanish(STATE.profile.arrivalDate)}`;

  // Limit Date (último día legal, conteo inclusivo)
  const limitDateStr = getLastAllowedDate(STATE.profile.arrivalDate, allowed);
  const limitDate = parseDate(limitDateStr);
  elements.metricLimitDate.textContent = `Límite legal: ${formatDateSpanish(limitDateStr)}`;

  // Remaining Days (incluye hoy: el último día legal aún cuenta como 1 día restante)
  const remaining = Math.max(0, allowed - elapsed + 1);
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
  const limitDateStr = getLastAllowedDate(arrivalStr, STATE.profile.allowedDays);

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
        // 'critical' no tiene estilos propios; se mapea al rojo de 'urgent'
        const dotClass = task.completed ? 'completed' : (task.priority === 'critical' ? 'urgent' : task.priority);
        dot.className = `event-dot ${dotClass}`;
        dot.title = `${task.title} (${priorityLabel(task.priority)})`;
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
          <span class="task-category">${escapeHtml(task.category || 'General')}</span>
          <span class="task-urgency-badge ${task.priority}">${priorityLabel(task.priority)}</span>
        </div>
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
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
  const limitDateStr = getLastAllowedDate(STATE.profile.arrivalDate, STATE.profile.allowedDays);
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
            <span class="task-category">${escapeHtml(task.category)}</span>
            <span class="task-urgency-badge ${task.priority}">${priorityLabel(task.priority)}</span>
          </div>
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-desc">${escapeHtml(task.description || 'Sin notas adicionales.')}</div>
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

export { updateUI, openDayDetailModal, closeDayDetailModal };
