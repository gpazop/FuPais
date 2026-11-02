// ========================================================
// FUPAIS — Toasts (Sprint 4)
// Renderizador declarativo de notificaciones. Paridad visual con el
// toast vanilla (card card-sm, fondo ink, animación modalIn) más un
// botón de cierre manual y región aria-live para accesibilidad.
// ========================================================

export default function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="card card-sm"
          style={{
            background: "var(--color-ink)",
            color: "#fafafa",
            boxShadow: "var(--shadow-floating)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
            padding: "12px 18px",
            animation: "modalIn 0.25s ease"
          }}
        >
          <span>✓</span>
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss?.(toast.id)}
            aria-label="Cerrar notificación"
            style={{
              background: "transparent",
              border: "none",
              color: "#fafafa",
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
