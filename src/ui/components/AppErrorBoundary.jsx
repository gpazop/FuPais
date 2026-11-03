// ========================================================
// FUPAIS — AppErrorBoundary
// Red de seguridad de último recurso para el render de React.
//
// ¿Por qué existe? El 2026-11-02 la app quedó en BLANCO en producción:
// un `ReferenceError` dentro del render de <App> desmontó el árbol y el
// try/catch de main.jsx no lo capturó (el render de React es asíncrono
// respecto a createRoot().render()). El resultado fue un #root vacío sin
// ningún diagnóstico visible para el usuario.
//
// Un error boundary es la única forma que ofrece React de capturar errores
// de render en un subárbol. NO captura errores de handlers, promesas ni
// efectos: para esos casos cada consumidor ya tiene su propio try/catch.
// El fallback usa texto React (nunca innerHTML) y no toca el estado
// persistido, para que un error de UI no destruya datos del usuario.
// ========================================================

import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Diagnóstico para producción (Vercel/consola) sin exponer datos del viaje.
    console.error("Error no controlado en la UI de FuPais:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          maxWidth: 560,
          margin: "48px auto",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          color: "#7f1d1d",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 12
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>
          FuPais — algo salió mal
        </h1>
        <p style={{ margin: "0 0 12px", fontSize: 14 }}>
          La interfaz encontró un error inesperado y se detuvo para no mostrar
          información incorrecta. Tus datos guardados en este navegador siguen
          intactos.
        </p>
        <pre
          style={{
            margin: "0 0 16px",
            padding: 12,
            background: "#fff",
            borderRadius: 6,
            fontSize: 12,
            overflow: "auto",
            whiteSpace: "pre-wrap"
          }}
        >
          {String(error?.message || error)}
        </pre>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: "#dc2626",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Recargar la aplicación
        </button>
      </div>
    );
  }
}
