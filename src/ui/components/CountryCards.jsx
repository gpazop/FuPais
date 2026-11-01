// ========================================================
// FUPAIS — CountryCards
// Catálogo de países disponible. Renderizado data-driven
// desde MIGRATION_PRESETS. Añadir un país es solo añadir
// datos al registro: nunca se toca este componente.
// ========================================================

import Badge from "./Badge.jsx";
import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";

export default function CountryCards({ onSelectPreset }) {
  const presets = Object.values(MIGRATION_PRESETS);

  return (
    <section className="countries-catalog">
      <div className="text-caption">
        Directorio de Países y Normativas Migratorias
      </div>
      <h3 className="text-heading-sm" style={{ marginTop: 4 }}>
        Países Disponibles en el Sistema
      </h3>
      <p className="text-body" style={{ fontSize: 13, color: "var(--color-mid-gray)" }}>
        Selecciona cualquier país para cargar de inmediato sus leyes, tiempos
        de prórroga, requisitos oficiales y calculadoras.
      </p>

      <div className="countries-cards-grid" id="countries-cards-grid">
        {presets.map((p) => (
          <div
            key={p.id}
            className="country-interactive-card"
            data-select-preset={p.id}
            onClick={() => onSelectPreset?.(p.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectPreset?.(p.id);
              }
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span style={{ fontSize: 28 }}>{p.flag}</span>
                <Badge variant="outline">{p.category}</Badge>
              </div>
              <h4
                className="country-name"
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  marginTop: 8
                }}
              >
                {p.destinationCountry}
              </h4>
              <p
                className="text-caption"
                style={{ textTransform: "none", marginTop: 2 }}
              >
                {p.visaType}
              </p>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-ink-soft)",
                  marginTop: 8,
                  lineHeight: 1.4
                }}
              >
                {p.legal.summary || p.legalNotice}
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Cargar este Destino ↗
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
