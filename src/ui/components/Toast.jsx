const icons = { info: "ℹ", success: "✓", warning: "⚠", error: "!" };

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {toasts.filter((toast) => toast.kind !== "error").at(-1)?.message}
      </div>
      <div className="visually-hidden" role="alert" aria-atomic="true">
        {toasts.filter((toast) => toast.kind === "error").at(-1)?.message}
      </div>
      {toasts.map(({ id, message, kind }) => (
        <div key={id} className="toast-notice" data-kind={kind}>
          <span className="toast-icon" aria-hidden="true">{icons[kind] ?? icons.info}</span>
          <span>{message}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onDismiss?.(id)} aria-label="Cerrar notificación">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
