// ========================================================
// FUPAIS — DockItem (Sprint 2)
// Botón del dock: ícono, badge opcional, punto de estado y tooltip.
// Marcado idéntico al del DockLayout original (clases CSS intactas);
// el estado visual (active, neighbor-1) se DERIVA de props en el
// render en vez de manipularse con classList.
// ========================================================

export default function DockItem({
  tabId,
  action,
  label,
  icon,
  active = false,
  neighbor = false,
  badge = null, // { text, pulse?, title? } | null
  showDot = Boolean(tabId),
  onMouseEnterItem,
  onMouseLeaveItem,
  onClick
}) {
  const classes = ["dock-item"];
  if (active) classes.push("active");
  if (neighbor) classes.push("neighbor-1");

  return (
    <button
      className={classes.join(" ")}
      data-tab={tabId}
      data-action={action}
      title={label}
      aria-label={label}
      aria-current={tabId && active ? "page" : undefined}
      onMouseEnter={onMouseEnterItem}
      onMouseLeave={onMouseLeaveItem}
      onClick={onClick}
    >
      <div className="dock-item-icon-box">
        <svg className="dock-icon" viewBox="0 0 24 24" aria-hidden="true">
          {icon}
        </svg>
      </div>
      {badge ? (
        <span
          className={badge.pulse ? "dock-badge pulse" : "dock-badge"}
          title={badge.title}
        >
          {badge.text}
        </span>
      ) : null}
      {showDot ? <span className="dock-dot"></span> : null}
      <span className="dock-tooltip">{label}</span>
    </button>
  );
}
