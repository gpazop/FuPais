// ========================================================
// FUPAIS — Badge (componente base reutilizable)
// Estándar profesional: variantes semánticas, accesible,
// estilos derivados de variables CSS del design system.
// ========================================================

export default function Badge({ children, variant = "soft", className = "" }) {
  const variants = {
    solid: "badge badge-solid",
    outline: "badge badge-outline",
    ember: "badge badge-ember",
    soft: "badge badge-soft",
    destructive: "badge badge-destructive"
  };

  return (
    <span className={`${variants[variant]} ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}
