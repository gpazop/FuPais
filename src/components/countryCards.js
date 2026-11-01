// ========================================================
// FUPAIS — CATÁLOGO DE TARJETAS DE PAÍSES (DATA-DRIVEN)
// ========================================================
// Renderiza el catálogo de países disponibles a partir del
// registro publicado `MIGRATION_PRESETS`. Añadir un país es
// solo añadir datos al registro: nunca se toca esta UI ni
// hay listas hardcodeadas.

import { MIGRATION_PRESETS } from "../data/migrationPresets.js";

export function renderCountryCards() {
  const grid = document.querySelector(".countries-cards-grid");
  if (!grid) return;

  const cardsHtml = Object.values(MIGRATION_PRESETS).map((p) => {
    const description = p.legal.summary || p.legalNotice;
    return `
      <div class="country-interactive-card" data-select-preset="${p.id}">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 28px;">${p.flag}</span>
            <span class="badge badge-outline">${p.category}</span>
          </div>
          <h4 class="country-name" style="font-weight: 600; font-size: 15px; margin-top: 8px;">${p.destinationCountry}</h4>
          <p class="text-caption" style="text-transform: none; margin-top: 2px;">${p.visaType}</p>
          <div style="font-size: 12px; color: var(--color-ink-soft); margin-top: 8px; line-height: 1.4;">
            ${description}
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="width: 100%; margin-top: 8px;">
          Cargar este Destino ↗
        </button>
      </div>
    `;
  }).join("");

  grid.innerHTML = cardsHtml;
}
