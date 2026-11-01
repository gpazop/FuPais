// ========================================================
// FUPAIS — SmartAlert
// Alerta migratoria contextual. Muestra estados:
// expirado, riesgo, ventana óptima, antes de ventana,
// o al día. Accesible: role="alert", anuncios de estado.
// ========================================================

import Badge from "./Badge.jsx";
import { differenceInDays, formatDatePretty } from "../../domain/dates.js";

export default function SmartAlert({ preset, metrics }) {
  if (!preset || !metrics) return null;

  const { isExpired, isInsideRiskWindow, isInsideOptimalWindow, isBeforeWindow } = metrics;
  const { daysRemaining, daysToSafeLimit = null, prorrogaWindowStartDate, safeDeadlineDate, today } = metrics;
  const { legalNotice, officialEntityName, officialPortalUrl, futFormUrl } = preset;

  let alertContent = null;

  if (isExpired) {
    alertContent = (
      <div className="alert-box" role="alert" aria-label="Estancia vencida">
        <svg
          className="icon icon-lg alert-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="alert-content">
          <div className="alert-title text-ember">
            Estancia Vencida — Plazo Legal Excedido
          </div>
          <div className="alert-desc">
            Tu período autorizado expiró hace {Math.abs(daysRemaining)} días. De acuerdo con {officialEntityName}, deberás solicitar un Salvoconducto (SC-2) por permanencia irregular para salir del país o regularizarte.
          </div>
        </div>
      </div>
    );
  } else if (isInsideRiskWindow) {
    alertContent = (
      <div className="alert-box" style={{ borderLeftColor: "var(--color-ember)" }} role="alert" aria-label="Zona de riesgo">
        <svg
          className="icon icon-lg alert-icon text-ember"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="alert-content">
          <div className="alert-title text-ember">
            <span>¡Atención Urgente! Quedan solo {daysRemaining} días para vencimiento</span>
            <Badge variant="ember">Demora de respuesta: 3-5 días hábiles</Badge>
          </div>
          <div className="alert-desc">
            Has ingresado en la zona de riesgo por tiempos de respuesta. {officialEntityName} tarda entre 3 y 5 días en procesar y validar el pago de la prórroga. Radica tu solicitud inmediatamente a través del Formulario Único de Trámites (FUT).
            <div style={{ marginTop: 8 }}>
              <a
                href={futFormUrl || officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-destructive btn-sm"
              >
                Ir al Formulario Oficial de Radicación ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (isInsideOptimalWindow) {
    const daysToLimit = safeDeadlineDate
      ? differenceInDays(safeDeadlineDate, today)
      : daysToSafeLimit ?? 0;
    alertContent = (
      <div className="alert-box" role="alert" aria-label="Ventana óptima de radicación">
        <svg
          className="icon icon-lg alert-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="alert-content">
          <div className="alert-title">
            <span>Ventana Óptima de Radicación Abierta</span>
            <Badge variant="solid">Faltan {daysRemaining} días para vencer</Badge>
          </div>
          <div className="alert-desc">
            {legalNotice}
            <br />
            <strong>Recomendación activa:</strong> Te quedan <strong>{daysToLimit} días</strong> para radicar antes del límite seguro (5 días de anticipación). Radicar ahora asegura que tu prórroga se resuelva sin contratiempos.
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <a
                href={officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                Radicar en {officialEntityName} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (isBeforeWindow) {
    const daysToWindow = prorrogaWindowStartDate
      ? differenceInDays(prorrogaWindowStartDate, today)
      : 0;
    alertContent = (
      <div className="card card-sm" style={{ backgroundColor: "var(--surface-sidebar)", border: "1px solid var(--color-hairline)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "var(--color-ink-soft)", lineHeight: 1.45 }}>
            <strong>Normativa Oficial:</strong> {legalNotice}
            <br />
            <span style={{ color: "var(--color-mid-gray)" }}>
              La ventana de prórroga se abrirá el <strong>{formatDatePretty(prorrogaWindowStartDate)}</strong> (en {daysToWindow} días). No intentes solicitarla antes porque el sistema no la aceptará.
            </span>
          </div>
          <Badge variant="soft">Estancia Regular</Badge>
        </div>
      </div>
    );
  } else {
    alertContent = (
      <div className="card card-sm" style={{ backgroundColor: "var(--surface-sidebar)", border: "1px solid var(--color-hairline)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
            <strong>Normativa Vigente:</strong> {legalNotice}
          </div>
          <Badge variant="soft">Al día</Badge>
        </div>
      </div>
    );
  }

  return (
    <section id="smart-alert-container" style={{ marginBottom: "var(--spacing-24)" }}>
      {alertContent}
    </section>
  );
}
