/** Helpers de formato y sanitización (puros, sin DOM). */

/** Escapa HTML para interpolación segura dentro de innerHTML. */
export function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapa texto para propiedades de valor de texto en archivos .ics (RFC 5545). */
export function escapeIcsText(text) {
  return String(text == null ? '' : text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Traduce el código de prioridad a una etiqueta legible en español. */
export function priorityLabel(priority) {
  switch (priority) {
    case 'urgent': return 'Urgente';
    case 'critical': return 'Crítica';
    case 'high': return 'Alta';
    default: return 'Normal';
  }
}
