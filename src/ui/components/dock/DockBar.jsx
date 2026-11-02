// ========================================================
// FUPAIS — DockBar (Sprint 2)
// Barra flotante declarativa. Configuración data-driven de ítems con
// paridad visual exacta respecto a DockLayout.jsx (mismos SVG, badges,
// dots y tooltips). El efecto de vecindad macOS (neighbor-1) se calcula
// por estado de hover sobre el ÍNDICE DE ÍTEMS (el divisor no cuenta,
// igual que querySelectorAll('.dock-item') en el original), no
// manipulando el DOM.
// ========================================================

import { useState, useCallback } from "react";
import DockItem from "./DockItem.jsx";

// Configuración de navegación del dock.
const DOCK_NAV = [
  {
    key: "inicio",
    type: "tab",
    label: "Inicio",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    )
  },
  {
    key: "mapa",
    type: "tab",
    label: "Mapa y Seguimiento",
    badge: { text: "GPS", pulse: true, title: "Rastreo GPS en vivo" },
    icon: (
      <>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </>
    )
  },
  {
    key: "spotlight",
    type: "action",
    label: "Búsqueda",
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    )
  },
  {
    key: "archivos",
    type: "tab",
    label: "Archivos & Documentos",
    badge: { text: "files" },
    icon: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    )
  },
  {
    key: "perfil",
    type: "tab",
    label: "Perfil del Viajero",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    )
  },
  {
    key: "configuracion",
    type: "tab",
    label: "Configuración",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    )
  },
  { key: "divider" },
  {
    key: "drawer",
    type: "action",
    label: "Menú",
    icon: (
      <>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    )
  },
  {
    key: "hide",
    type: "action",
    label: "Ocultar",
    icon: <polyline points="6 9 12 15 18 9" />
  }
];

// Índice de cada ítem EXCLUYENDO el divisor (paridad con el original:
// la vecindad se calculaba sobre .dock-item, no sobre el contenedor).
const ITEM_INDEX = (() => {
  const map = new Map();
  let n = 0;
  DOCK_NAV.forEach((item) => {
    if (item.key !== "divider") {
      map.set(item.key, n);
      n += 1;
    }
  });
  return map;
})();

export default function DockBar({
  activeTab,
  magnify,
  filesCount = 4,
  play,
  onTabChange,
  onOpenSpotlight,
  onOpenDrawer,
  onToggleHide
}) {
  const [hoveredKey, setHoveredKey] = useState(null);

  const handleClick = useCallback(
    (item) => {
      play(950, "sine", 0.05);
      if (item.type === "tab") {
        onTabChange?.(item.key);
      } else if (item.key === "spotlight") {
        onOpenSpotlight?.();
      } else if (item.key === "drawer") {
        onOpenDrawer?.();
      } else if (item.key === "hide") {
        onToggleHide?.();
      }
    },
    [play, onTabChange, onOpenSpotlight, onOpenDrawer, onToggleHide]
  );

  return DOCK_NAV.map((item) => {
    if (item.key === "divider") {
      return <div className="dock-divider" key="divider"></div>;
    }

    const isTab = item.type === "tab";
    const neighbor =
      magnify &&
      hoveredKey !== null &&
      Math.abs(ITEM_INDEX.get(hoveredKey) - ITEM_INDEX.get(item.key)) === 1;

    return (
      <DockItem
        key={item.key}
        tabId={isTab ? item.key : undefined}
        action={isTab ? undefined : item.key}
        label={item.label}
        icon={item.icon}
        active={isTab && activeTab === item.key}
        neighbor={neighbor}
        badge={
          item.badge
            ? {
                ...item.badge,
                text: item.badge.text === "files" ? filesCount : item.badge.text
              }
            : null
        }
        onMouseEnterItem={() => setHoveredKey(item.key)}
        onMouseLeaveItem={() => setHoveredKey(null)}
        onClick={() => handleClick(item)}
      />
    );
  });
}
