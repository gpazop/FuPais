// ========================================================
// FUPAIS — MapSearch (Sprint 3)
// Búsqueda de lugares sobre el mapa (reemplaza #btn-map-search /
// #map-search-input vanilla). Reutiliza el CSS heredado
// (.map-search-box). Componente tonto: delega en onSearch, que en
// App conecta con useGeoTracking.findPlace (puerto de geocoding).
// ========================================================

import { useState } from "react";

export default function MapSearch({ onSearch }) {
  const [query, setQuery] = useState("");

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    onSearch?.(q);
  };

  return (
    <div className="map-search-box">
      <svg
        className="icon"
        viewBox="0 0 24 24"
        style={{ width: 16, height: 16, color: "var(--color-mid-gray)", flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Buscar ciudad, dirección o lugar..."
        aria-label="Buscar lugar en el mapa"
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={submit}
        aria-label="Buscar lugar"
      >
        Buscar
      </button>
    </div>
  );
}
