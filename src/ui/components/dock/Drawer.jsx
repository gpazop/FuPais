// ========================================================
// FUPAIS — Drawer (Sprint 2)
// Control Center (Cmd+M), declarativo. Reemplaza a DrawerMethods
// (clase active por render, backdrop y botón cerrar por handlers).
// Mejoras honestas sobre el original: el país de destino activo deja
// de estar hardcodeado y los dos tiles de "Herramientas Rápidas"
// (que estaban inertes) quedan cableados a mapa/spotlight.
// ========================================================

import { useDialogFocus } from "../../hooks/useDialogFocus.js";

const SECONDARY_VIEWS = [
  ["archivos", "Bóveda"],
  ["perfil", "Perfil"],
  ["configuracion", "Configuración"]
];

export default function Drawer({
  open,
  onClose,
  activeDestination,
  activeTab,
  onTab,
  onOpenMap,
  onOpenSpotlight
}) {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;

  return (
    <div
      className="drawer-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <aside className="drawer-panel" ref={dialogRef} role="dialog" aria-modal="true"
        aria-labelledby="drawer-title" data-dialog-shortcut="m" tabIndex={-1}>
        <div className="drawer-header">
          <div>
            <h3 id="drawer-title" className="text-subheading">Centro de Control</h3>
            <p className="text-caption" style={{ textTransform: "none" }}>
              Accesos rápidos y emergencias
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <nav className="drawer-view-links" aria-label="Más vistas">
          {SECONDARY_VIEWS.map(([key, label]) => (
            <button key={key} type="button" className="btn btn-outline"
              aria-current={activeTab === key ? "page" : undefined}
              onClick={() => {
                onClose?.();
                onTab?.(key);
              }}>
              {label}
            </button>
          ))}
        </nav>

        {/* Quick Switch Country */}
        <div className="drawer-section-title">País de Destino Activo</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          {activeDestination || "🇨🇴 Colombia — Intercambio PIP-2"}
        </div>

        {/* Quick Emergency Contacts */}
        <div className="drawer-section-title">
          Contactos de Asistencia & Emergencia
        </div>
        <a href="tel:123" className="quick-action-tile">
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div>Línea de Emergencias 123 (Colombia)</div>
            <div style={{ fontSize: 11, color: "var(--color-mid-gray)" }}>
              Policía Nacional & Cruz Roja
            </div>
          </div>
        </a>
        <a
          href="https://www.migracioncolombia.gov.co"
          target="_blank"
          rel="noopener noreferrer"
          className="quick-action-tile"
        >
          <span style={{ fontSize: 18 }}>🏛️</span>
          <div>
            <div>Portal Migración Colombia</div>
            <div style={{ fontSize: 11, color: "var(--color-mid-gray)" }}>
              Trámites y prórrogas oficiales
            </div>
          </div>
        </a>
        <a href="tel:+576017460900" className="quick-action-tile">
          <span style={{ fontSize: 18 }}>🇵🇪</span>
          <div>
            <div>Consulado General de Perú en Bogotá</div>
            <div style={{ fontSize: 11, color: "var(--color-mid-gray)" }}>
              +57 (601) 746-0900
            </div>
          </div>
        </a>

        {/* Quick Actions */}
        <div className="drawer-section-title">Herramientas Rápidas</div>
        <button
          className="quick-action-tile"
          style={{ width: "100%", textAlign: "left" }}
          onClick={() => {
            onClose?.();
            onOpenMap?.();
          }}
        >
          <span style={{ fontSize: 18 }}>🛰️</span>
          <div>
            <div>Radar Satelital en Tiempo Real</div>
            <div style={{ fontSize: 11, color: "var(--color-mid-gray)" }}>
              Ver coordenadas y tracking
            </div>
          </div>
        </button>
        <button
          className="quick-action-tile"
          style={{ width: "100%", textAlign: "left" }}
          onClick={() => {
            onClose?.();
            onOpenSpotlight?.();
          }}
        >
          <span style={{ fontSize: 18 }}>🔍</span>
          <div>
            <div>Buscador Global (Spotlight)</div>
            <div style={{ fontSize: 11, color: "var(--color-mid-gray)" }}>
              Atajo Cmd + K
            </div>
          </div>
        </button>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: "1px solid var(--color-hairline)",
            fontSize: 11,
            color: "var(--color-mid-gray)"
          }}
        >
          FuPais • Sistema Migratorio Inteligente
        </div>
      </aside>
    </div>
  );
}
