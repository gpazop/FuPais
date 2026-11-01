// ========================================================
// FUPAIS — DockLayout
// HTML del dock, spotlight y drawer convertido a JSX.
// Se renderiza dentro de DockWrapper para que FuPaisDock
// (clase vanilla) tenga sus elementos en el DOM.
// ========================================================

export default function DockLayout() {
  return (
    <>
      {/* FLOATING / DOCK NAVIGATION BAR */}
      <nav
        className="dock-wrapper dock-bottom magnify-enabled"
        id="fupais-dock"
        aria-label="Barra de Navegación"
      >
        {/* Item 1: Inicio */}
        <button
          className="dock-item active"
          data-tab="inicio"
          title="Inicio"
          aria-label="Inicio"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="dock-dot"></span>
          <span className="dock-tooltip">Inicio</span>
        </button>

        {/* Item 2: Mapa en Tiempo Real */}
        <button
          className="dock-item"
          data-tab="mapa"
          title="Mapa y Seguimiento"
          aria-label="Mapa"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <span className="dock-badge pulse" title="Rastreo GPS en vivo">
            GPS
          </span>
          <span className="dock-dot"></span>
          <span className="dock-tooltip">Mapa en Tiempo Real</span>
        </button>

        {/* Item 3: Búsqueda (Spotlight Search) */}
        <button
          className="dock-item"
          data-action="busqueda"
          title="Búsqueda Universal"
          aria-label="Buscar"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <span className="dock-tooltip">Búsqueda</span>
        </button>

        {/* Item 4: Archivos Subidos / Bóveda */}
        <button
          className="dock-item"
          data-tab="archivos"
          title="Archivos & Visas"
          aria-label="Archivos"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="dock-badge" id="dock-files-badge">
            4
          </span>
          <span className="dock-dot"></span>
          <span className="dock-tooltip">Archivos & Documentos</span>
        </button>

        {/* Item 5: Perfil del Viajero */}
        <button
          className="dock-item"
          data-tab="perfil"
          title="Mi Perfil"
          aria-label="Perfil"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="dock-dot"></span>
          <span className="dock-tooltip">Perfil del Viajero</span>
        </button>

        {/* Item 6: Configuración */}
        <button
          className="dock-item"
          data-tab="configuracion"
          title="Configuración"
          aria-label="Configuración"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span className="dock-dot"></span>
          <span className="dock-tooltip">Configuración</span>
        </button>

        {/* Separator */}
        <div className="dock-divider"></div>

        {/* Item 7: Menú Hamburguesa / Control Center */}
        <button
          className="dock-item"
          data-action="drawer"
          title="Menú Rápido"
          aria-label="Menú Hamburguesa"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </div>
          <span className="dock-tooltip">Menú</span>
        </button>

        {/* Item 8: Ocultar / Minimizar Dock */}
        <button
          className="dock-item"
          data-action="hide-dock"
          title="Ocultar"
          aria-label="Ocultar"
        >
          <div className="dock-item-icon-box">
            <svg
              className="dock-icon"
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <span className="dock-tooltip">Ocultar</span>
        </button>
      </nav>

      {/* SEÑAL FLOTANTE / PEEK HANDLE */}
      <div
        className="dock-peek-handle handle-bottom"
        id="dock-peek-trigger"
        title="Clic para mostrar la Barra"
      >
        <span className="handle-live-dot"></span>
        <span className="handle-pill-line"></span>
        <span className="handle-text-tip">Abrir</span>
      </div>

      {/* SPOTLIGHT SEARCH MODAL */}
      <div className="spotlight-overlay" id="spotlight-overlay">
        <div className="spotlight-box">
          <div className="spotlight-search-header">
            <svg
              className="icon"
              viewBox="0 0 24 24"
              style={{ color: "var(--color-mid-gray)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              id="spotlight-input"
              className="spotlight-input"
              placeholder="Buscar países, trámites, archivos, fechas..."
              autoComplete="off"
            />
            <span className="badge badge-outline" style={{ fontSize: 11 }}>
              ESC para salir
            </span>
          </div>
          <div className="spotlight-results" id="spotlight-results">
            {/* Rendered by dock.js */}
          </div>
          <div className="spotlight-footer">
            <div>
              Navegar:{" "}
              <kbd>↑</kbd>{" "}
              <kbd>↓</kbd> | Abrir: <kbd>↵ Enter</kbd>
            </div>
            <div>FuPais Spotlight Search</div>
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER */}
      <div className="drawer-overlay" id="drawer-overlay">
        <aside className="drawer-panel">
          <div className="drawer-header">
            <div>
              <h3 className="text-subheading">Centro de Control</h3>
              <p className="text-caption" style={{ textTransform: "none" }}>
                Accesos rápidos y emergencias
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              data-close-drawer
            >
              ✕
            </button>
          </div>

          {/* Quick Switch Country */}
          <div className="drawer-section-title">País de Destino Activo</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            🇨🇴 Colombia — Intercambio PIP-2
          </div>

          {/* Quick Emergency Contacts */}
          <div className="drawer-section-title">
            Contactos de Asistencia & Emergencia
          </div>
          <a
            href="tel:123"
            className="quick-action-tile"
          >
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
          <a
            href="tel:+576017460900"
            className="quick-action-tile"
          >
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
    </>
  );
}
