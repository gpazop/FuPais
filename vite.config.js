// ========================================================
// FUPAIS — VITE CONFIG
// Mounts the same Node handler that Vercel runs at /api/geocode
// during `vite dev` and `vite preview`, so local behaviour matches
// production without a separate mock or a client-side fallback.
//
// The pathname is compared by hand instead of using use(path, fn):
// connect strips the mount path from req.url, which would drop the
// query string the handler needs.
// ========================================================

import { defineConfig } from "vite";
import geocodeHandler from "./api/geocode.js";

const mountGeocodeApi = () => {
  const mount = (server) => {
    server.middlewares.use((req, res, next) => {
      const pathname = (req.url ?? "").split("?")[0];
      if (pathname !== "/api/geocode") {
        next();
        return;
      }

      Promise.resolve(geocodeHandler(req, res)).catch((error) => {
        console.error("[geocode] error inesperado:", error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
        }
        res.end(JSON.stringify({ error: "internal_error" }));
      });
    });
  };

  return {
    name: "fupais-geocode-api",
    apply: "serve",
    configureServer: mount,
    configurePreviewServer: mount
  };
};

export default defineConfig({
  plugins: [mountGeocodeApi()]
});
