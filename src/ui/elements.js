/**
 * FuPais — mapa único de referencias a elementos del DOM.
 * Extraído de app.js (Fase 1b) sin cambios de comportamiento.
 */

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
  btnDayDetailAddEvent: document.getElementById('btnDayDetailAddEvent'),

  // Regla de permanencia verificada (Fase 2)
  ruleNote: document.getElementById('ruleNote'),
  ruleNoteFlag: document.getElementById('ruleNoteFlag'),
  ruleNoteTitle: document.getElementById('ruleNoteTitle'),
  ruleNoteBody: document.getElementById('ruleNoteBody'),
  ruleNoteSource: document.getElementById('ruleNoteSource')
};

export { elements };
