// ========================================================
// FUPAIS — Badge (componente base reutilizable)
// Estándar profesional: variantes semánticas, accesible,
// estilos derivados de variables CSS del design system.
//
// `aria-hidden` se retiró a propósito: los badges de esta app llevan
// información esencial (fechas límite, "Vence Hoy", estados legales), así
// que un lector de pantalla debe anunciarlos. Cuando un badge sea decorativo,
// el consumidor puede pasar aria-hidden={true} explícitamente.
// `style` se reenvía para que combinaciones como el badge "Live Tracker"
// puedan personalizarse sin duplicar CSS.
// ========================================================

export default function Badge({
  children,
  variant = "soft",
  className = "",
  style,
  ...rest
}) {
  const variants = {
    solid: "badge badge-solid",
    outline: "badge badge-outline",
    ember: "badge badge-ember",
    soft: "badge badge-soft",
    destructive: "badge badge-destructive"
  };

  return (
    <span className={`${variants[variant]} ${className}`} style={style} {...rest}>
      {children}
    </span>
  );
}
