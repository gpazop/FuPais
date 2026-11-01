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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
