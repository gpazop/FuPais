/**
 * Punto de entrada de la app. Vite sirve/bundleará desde aquí.
 */
import { init } from './ui/app.js';
import { setGeocodingAdapter } from './services/geocoding.js';
import { apiGeocodingAdapter } from './services/adapters/apiGeocodingAdapter.js';

// Composition root: the app always talks to the serverless proxy, in dev
// and in production. vite.config.js mounts the same handler locally.
setGeocodingAdapter(apiGeocodingAdapter);

document.addEventListener('DOMContentLoaded', init);
