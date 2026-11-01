// ========================================================
// FUPAIS — MetricCard
// Tarjeta de métrica con barra de progreso opcional.
// Estándar: semántica, contraste adecuado, variantes de
// estado (normal / aviso / vencido).
// ========================================================

export default function MetricCard({
  label,
  value,
  sub,
  variant = "default",
  progress,
  progressPercent,
  footerLabel,
  className = ""
}) {
  const isWarning =
    variant === "warning" ||
    variant === "risk" ||
    variant === "expired";

  return (
    <section
      className={`card metric-card ${className}`}
      aria-label={label}
    >
      <div className="stat-block">
        <span className="stat-label">{label}</span>
        <div className="stat-value">
          <span>{value}</span>
          {sub && <span className="stat-value-sub">{sub}</span>}
        </div>
      </div>

      {progress !== undefined && (
        <div style={{ marginTop: "var(--spacing-16)" }}>
          <div className="progress-bar-container">
            <div
              className={`progress-bar-fill ${isWarning ? "fill-warning" : ""}`}
              id="stay-progress-fill"
              style={{ width: `${progressPercent ?? 0}%` }}
              role="progressbar"
              aria-valuenow={progressPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={label}
            />
          </div>
          <div className="stat-footer">
            <span id="stay-percent-text">{footerLabel ?? ""}</span>
          </div>
        </div>
      )}
    </section>
  );
}
