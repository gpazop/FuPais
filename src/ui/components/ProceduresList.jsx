// ========================================================
// FUPAIS — ProceduresList
// Lista de trámites y obligaciones con checkboxes.
// Incluye auto-extensión de estancia cuando se aprueba
// una prórroga. Accesible: inputs con label implícito,
// announce de cambios de estado.
// ========================================================

import { useCallback } from "react";
import Badge from "./Badge.jsx";

export default function ProceduresList({
  procedures,
  onToggleProcedure,
  formatDatePretty
}) {
  const handleChange = useCallback(
    (id, isChecked, proc) => {
      onToggleProcedure(id, isChecked, proc);
    },
    [onToggleProcedure]
  );

  if (!procedures || procedures.length === 0) {
    return (
      <div className="procedure-list">
        <div style={{ fontSize: 13, color: "var(--color-mid-gray)", marginTop: 4 }}>
          Sin trámites oficiales fijados.
        </div>
      </div>
    );
  }

  // Días que otorga la prórroga según los datos del preset activo. Antes el
  // pie de lista afirmaba "+90 días" para TODAS las normativas (falso para
  // Perú); ahora el número sale del trámite de extensión publicado.
  const extensionDays =
    procedures.find((proc) => proc.isExtensionAction)?.extendsDays ?? null;

  return (
    <div className="procedure-list">
      {procedures.map((proc) => {
        let deadlineBadge = null;
        if (proc.daysUntilProc !== null) {
          if (proc.daysUntilProc > 0) {
            deadlineBadge = (
              <Badge
                variant={proc.urgent ? "ember" : "soft"}
                className="deadline-badge"
              >
                En {proc.daysUntilProc} días
              </Badge>
            );
          } else if (proc.daysUntilProc === 0) {
            deadlineBadge = (
              <Badge variant="ember" className="deadline-badge">
                ¡Vence Hoy!
              </Badge>
            );
          } else {
            deadlineBadge = (
              <Badge variant="outline" className="deadline-badge">
                Pasado
              </Badge>
            );
          }
        }

        const isUrgent = proc.urgent && !proc.done;
        const isDone = proc.done;

        return (
          <div
            key={proc.id}
            className={`procedure-item ${isUrgent ? "is-urgent" : ""} ${isDone ? "is-done" : ""}`}
          >
            <input
              type="checkbox"
              className="procedure-checkbox"
              id={`proc-${proc.id}`}
              checked={isDone}
              onChange={(e) =>
                handleChange(proc.id, e.target.checked, proc)
              }
            />
            <div className="procedure-body">
              <div className="procedure-title">
                <label
                  htmlFor={`proc-${proc.id}`}
                  style={{
                    cursor: "pointer",
                    textDecoration: isDone ? "line-through" : "none",
                    color: isDone ? "var(--color-mid-gray)" : undefined
                  }}
                >
                  {proc.title}
                </label>
                {deadlineBadge}
              </div>
              <div className="procedure-desc">{proc.desc}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: 6,
                  flexWrap: "wrap"
                }}
              >
                {proc.targetDate ? (
                  <div className="procedure-deadline">
                    Fecha objetivo: {formatDatePretty(proc.targetDate)}
                  </div>
                ) : null}
                {proc.officialUrl ? (
                  <a
                    href={proc.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{
                      height: 24,
                      padding: "0 8px",
                      fontSize: 11,
                      textDecoration: "none"
                    }}
                  >
                    Portal Oficial ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--color-mid-gray)",
          lineHeight: 1.35,
          padding: "8px 10px",
          backgroundColor: "var(--surface-sidebar)",
          borderRadius: 8
        }}
      >
        ✦ <strong>Auto-extensión:</strong>{" "}
        {extensionDays
          ? `Marcar la aprobación de la prórroga actualizará automáticamente tu fecha límite añadiendo los +${extensionDays} días de tu normativa.`
          : "La prórroga de tu normativa se registra desde la lista de trámites."}
      </div>
    </div>
  );
}
