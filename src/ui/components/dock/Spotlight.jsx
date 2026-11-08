// ========================================================
// FUPAIS — Spotlight (Sprint 2)
// Búsqueda universal (Cmd+K), 100% declarativa. Reemplaza a
// SpotlightMethods: resultados derivados por useMemo (mismo set de
// ítems que el original: atajos de vista + presets del registro +
// FUT + fechas), navegación de teclado ↑ ↓ Enter Esc IMPLEMENTADA de
// verdad (el footer del original la prometía) y cero innerHTML — la
// interpolación de React elimina el XSS latente del query crudo.
// ========================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { MIGRATION_PRESETS } from "../../../data/migrationPresets.js";
import { FLAG_BY_COUNTRY } from "../../../components/dock/constants.js";

const FUT_PORTAL_URL =
  "https://www.migracioncolombia.gov.co/tramites-y-servicios/tramites-generales/prorroga/permiso-temporal-de-permanencia-ptp-/-prorroga";

export default function Spotlight({
  open,
  onClose,
  onTab,
  onApplyPreset,
  onOpenConfig
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    return [
      {
        key: "view-inicio",
        title: "Inicio / General",
        subtitle: "Ver calendario, días transcurridos y prórrogas",
        icon: "🏠",
        run: () => onTab?.("inicio")
      },
      {
        key: "view-mapa",
        title: "Mapa Interactivo & GPS en Vivo",
        subtitle: "Rastrear posición y países disponibles",
        icon: "🗺️",
        run: () => onTab?.("mapa")
      },
      {
        key: "view-archivos",
        title: "Bóveda de Documentos & Archivos",
        subtitle: "Subir y gestionar pasaportes, visas y cartas",
        icon: "📁",
        run: () => onTab?.("archivos")
      },
      {
        key: "view-perfil",
        title: "Perfil del Nómada / Viajero",
        subtitle: "Datos personales, pasaporte y sello digital",
        icon: "👤",
        run: () => onTab?.("perfil")
      },
      {
        key: "view-configuracion",
        title: "Configuración del Sistema",
        subtitle: "Ajustar posición de barra, tema y alertas",
        icon: "⚙️",
        run: () => onTab?.("configuracion")
      },
      // Presets — derivados del registro publicado; nunca hardcodeados.
      ...Object.values(MIGRATION_PRESETS).map((p) => ({
        key: `preset-${p.id}`,
        title: `${FLAG_BY_COUNTRY[p.countryCode] || "🌐"} ${p.destinationCountry} — ${p.visaType}`,
        subtitle: p.officialEntityName || "Cambiar escenario migratorio",
        icon: FLAG_BY_COUNTRY[p.countryCode] || "🌐",
        run: () => {
          onApplyPreset?.(p.id);
          onTab?.("inicio");
        }
      })),
      {
        key: "fut",
        title: "Formulario Único de Trámites (FUT)",
        subtitle: "Portal oficial de Migración Colombia",
        icon: "📝",
        run: () => window.open(FUT_PORTAL_URL, "_blank", "noopener,noreferrer")
      },
      {
        key: "fechas",
        title: "Ajustar Fechas de Viaje",
        subtitle: "Modificar fecha de llegada y límite",
        icon: "📅",
        run: () => onOpenConfig?.()
      }
    ];
  }, [onTab, onApplyPreset, onOpenConfig]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Al abrir: input limpio, primer resultado resaltado y foco
  // (paridad con openSpotlight del original).
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const dialogRef = useDialogFocus(open, onClose, inputRef);
  if (!open) return null;

  const runItem = (item) => {
    if (!item) return;
    item.run();
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      runItem(filtered[activeIndex] || filtered[0]);
    }
  };

  return (
    <div
      className="spotlight-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="spotlight-box" ref={dialogRef} role="dialog" aria-modal="true"
        aria-label="Spotlight" data-dialog-shortcut="k" tabIndex={-1}>
        <div className="spotlight-search-header">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            style={{ color: "var(--color-mid-gray)" }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Buscar países, trámites, archivos, fechas..."
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Búsqueda universal"
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}
            aria-label="Cerrar Spotlight">✕</button>
        </div>

        <div className="spotlight-results">
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--color-mid-gray)",
                fontSize: 13
              }}
            >
              No se encontraron resultados para "<strong>{query}</strong>"
            </div>
          ) : (
            filtered.map((it, idx) => (
              <button
                type="button"
                key={it.key}
                className={
                  idx === activeIndex
                    ? "spotlight-item highlighted"
                    : "spotlight-item"
                }
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => runItem(it)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }} aria-hidden="true">
                    {it.icon}
                  </span>
                  <span>
                    <span
                      style={{ display: "block", fontWeight: 600, color: "var(--color-ink)" }}
                    >
                      {it.title}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "var(--color-mid-gray)"
                      }}
                    >
                      {it.subtitle}
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="badge badge-outline" style={{ fontSize: 10 }}>
                  ↵ Seleccionar
                </span>
              </button>
            ))
          )}
        </div>

        <div className="spotlight-footer">
          <div>
            Navegar:{" "}
            <kbd>↑</kbd> <kbd>↓</kbd> | Abrir: <kbd>↵ Enter</kbd>
          </div>
          <div>FuPais Spotlight Search</div>
        </div>
      </div>
    </div>
  );
}
