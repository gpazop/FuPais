// ========================================================
// FUPAIS — DayModal
// Modal "Detalle del Día Inspeccionado" como componente
// React controlado. Sustituye la manipulación directa del
// DOM en openDayInspector.
// ========================================================

import { useState, useCallback, useEffect } from "react";
import Badge from "./Badge.jsx";
import {
  formatDateISO,
  formatDatePretty,
  differenceInDays
} from "../../domain/dates.js";

export default function DayModal({
  open,
  onClose,
  dateStr,
  selectedDate,
  metrics,
  customEvents,
  onAddEvent,
  onDeleteEvent
}) {
  const [newEventTitle, setNewEventTitle] = useState("");

  if (!open) return null;

  const dayNumber = selectedDate
    ? Math.ceil(differenceInDays(selectedDate, metrics.entryDate)) + 1
    : 0;
  const isAbroad =
    selectedDate >= metrics.entryDate && selectedDate <= metrics.expiryDate;
  const isDeadline = selectedDate.getTime() === metrics.expiryDate.getTime();
  const isProrroga =
    selectedDate >= metrics.prorrogaWindowStartDate &&
    selectedDate <= metrics.safeDeadlineDate;
  const isRisk =
    selectedDate > metrics.safeDeadlineDate &&
    selectedDate <= metrics.expiryDate;

  const dayProcs = metrics.resolvedProcedures.filter(
    (p) => p.targetDate && formatDateISO(p.targetDate) === dateStr
  );

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!open) return;
    const onKeydown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    const title = newEventTitle.trim();
    if (!title) return;
    onAddEvent(title, dateStr);
    setNewEventTitle("");
  };

  const handleDeleteEvent = (id) => {
    onDeleteEvent(id);
  };

  return (
    <div className="modal-overlay active" id="day-modal">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="text-caption">Inspección de Fecha</span>
            <h3 className="text-heading-sm" id="day-modal-title" style={{ fontSize: 20 }}>
              {selectedDate ? formatDatePretty(selectedDate) : dateStr}
            </h3>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={onClose}
            data-close-modal
          >
            ✕
          </button>
        </div>

        <div id="day-modal-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {isAbroad ? (
                <Badge variant="solid">Día {dayNumber} fuera de tu país</Badge>
              ) : (
                <Badge variant="outline">Fuera de intervalo de viaje</Badge>
              )}
              {isDeadline && <Badge variant="ember">Fecha Límite Legal</Badge>}
              {isProrroga && <Badge variant="soft">Ventana Óptima de Radicación</Badge>}
              {isRisk && <Badge variant="ember">Riesgo Alto por Tiempos de Respuesta</Badge>}
            </div>

            <div className="card card-sm" style={{ backgroundColor: "var(--surface-sidebar)" }}>
              <div className="text-caption">Hitos Migratorios y Trámites Oficiales</div>
              {dayProcs.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-mid-gray)", marginTop: 4 }}>
                  Sin trámites oficiales fijados para este día.
                </div>
              ) : (
                dayProcs.map((p) => (
                  <div
                    key={p.id}
                    style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}
                  >
                    ★ {p.title}
                    <div style={{ fontSize: 12, color: "var(--color-mid-gray)", fontWeight: 400, marginTop: 2 }}>
                      {p.desc}
                    </div>
                    {p.officialUrl && (
                      <div style={{ marginTop: 4 }}>
                        <a
                          href={p.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: "var(--color-ink)" }}
                        >
                          Abrir portal oficial ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="card card-sm" style={{ backgroundColor: "var(--surface-sidebar)" }}>
              <div className="text-caption">Eventos y Recordatorios Personales</div>
              {customEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-mid-gray)", marginTop: 4 }}>
                  No hay notas personales registradas.
                </div>
              ) : (
                customEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, fontSize: 13 }}
                  >
                    <span>• {ev.title}</span>
                    <button
                      className="btn btn-outline btn-sm delete-event-btn"
                      onClick={() => onDeleteEvent(ev.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}

              <div style={{ marginTop: 8 }}>
                <div className="input-label">Agregar recordatorio para este día:</div>
                <form onSubmit={handleAddEvent} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Pagar tasa, llevar carta a decanatura..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm" type="submit">
                    Guardar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} data-close-modal>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
