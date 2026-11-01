/**
 * Punto de entrada de la app (React).
 * Vite sirve/bundleará desde aquí.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { setGeocodingAdapter } from "./services/geocoding.js";
import { apiGeocodingAdapter } from "./services/adapters/apiGeocodingAdapter.js";
import App from "./ui/App.jsx";

// Composition root: the app always talks to the serverless proxy, in dev
// and in production. vite.config.js mounts the same handler locally.
setGeocodingAdapter(apiGeocodingAdapter);

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("No se encontró el elemento #root en el DOM");
}

try {
  ReactDOM.createRoot(rootEl).render(<App />);
} catch (error) {
  // Fallback visual si falla el montaje de React: evita pantalla en blanco
  // y muestra el error para diagnóstico en producción (Vercel).
  rootEl.innerHTML = `
    <div style="font-family:system-ui,sans-serif;padding:24px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
      <h2 style="margin-top:0;">FuPais — Error de montaje</h2>
      <p>La aplicación no pudo inicializarse. Revisa la consola del navegador para ver el detalle.</p>
      <pre style="background:#fff;overflow:auto;padding:12px;border-radius:4px;font-size:12px;">${String(error).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      <p style="font-size:12px;color:#6b7280;">Build: ${import.meta.env.PROD ? "producción" : "desarrollo"} | Vite: ${import.meta.env.DEV ? "dev" : "preview/prod"}</p>
    </div>
  `;
  console.error("Error montando la app React:", error);
}
