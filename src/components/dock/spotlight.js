// ========================================================
// FUPAIS — SPOTLIGHT (Cmd + K)
// ========================================================

import { MIGRATION_PRESETS } from "../../data/migrationPresets.js";
import { FLAG_BY_COUNTRY } from "./constants.js";

export class SpotlightMethods {
  // ========================================================
  // SPOTLIGHT (Cmd + K) SEARCH
  // ========================================================
  bindSpotlightEvents() {
    if (!this.spotlightOverlay) return;

    this.spotlightOverlay.addEventListener("click", (e) => {
      if (e.target === this.spotlightOverlay) {
        this.closeSpotlight();
      }
    });

    document.querySelectorAll("[data-close-spotlight]").forEach(btn => {
      btn.addEventListener("click", () => this.closeSpotlight());
    });

    if (this.spotlightInput) {
      this.spotlightInput.addEventListener("input", (e) => {
        this.performSpotlightSearch(e.target.value);
      });

      this.spotlightInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeSpotlight();
        } else if (e.key === "Enter") {
          const firstItem = this.spotlightResults.querySelector(".spotlight-item");
          if (firstItem) firstItem.click();
        }
      });
    }
  }

  openSpotlight() {
    if (!this.spotlightOverlay) return;
    this.playClickSound(1050, "triangle", 0.05);
    this.spotlightOverlay.classList.add("active");
    if (this.spotlightInput) {
      this.spotlightInput.value = "";
      this.spotlightInput.focus();
      this.performSpotlightSearch("");
    }
  }

  closeSpotlight() {
    if (!this.spotlightOverlay) return;
    this.spotlightOverlay.classList.remove("active");
  }

  toggleSpotlight() {
    if (this.spotlightOverlay && this.spotlightOverlay.classList.contains("active")) {
      this.closeSpotlight();
    } else {
      this.openSpotlight();
    }
  }

  performSpotlightSearch(query) {
    if (!this.spotlightResults) return;
    const q = query.toLowerCase().trim();

    const items = [
      // Shortcuts to views
      { title: "Inicio / General", subtitle: "Ver calendario, días transcurridos y prórrogas", icon: "🏠", action: () => this.switchTab("inicio") },
      { title: "Mapa Interactivo & GPS en Vivo", subtitle: "Rastrear posición y países disponibles", icon: "🗺️", action: () => this.switchTab("mapa") },
      { title: "Bóveda de Documentos & Archivos", subtitle: "Subir y gestionar pasaportes, visas y cartas", icon: "📁", action: () => this.switchTab("archivos") },
      { title: "Perfil del Nómada / Viajero", subtitle: "Datos personales, pasaporte y sello digital", icon: "👤", action: () => this.switchTab("perfil") },
      { title: "Configuración del Sistema", subtitle: "Ajustar posición de barra, tema y alertas", icon: "⚙️", action: () => this.switchTab("configuracion") },
      // Presets — derivados del registro publicado; nunca hardcodeados.
      // Solo aparecen los presets que MIGRATION_PRESETS realmente publica.
      ...Object.values(MIGRATION_PRESETS).map(p => ({
        title: `${FLAG_BY_COUNTRY[p.countryCode] || "🌐"} ${p.destinationCountry} — ${p.visaType}`,
        subtitle: p.officialEntityName || "Cambiar escenario migratorio",
        icon: FLAG_BY_COUNTRY[p.countryCode] || "🌐",
        action: () => { this.app.applyPreset(p.id); this.switchTab("inicio"); }
      })),
      // Trámites
      { title: "Formulario Único de Trámites (FUT)", subtitle: "Portal oficial de Migración Colombia", icon: "📝", action: () => window.open("https://www.migracioncolombia.gov.co/tramites-y-servicios/tramites-generales/prorroga/permiso-temporal-de-permanencia-ptp-/-prorroga", "_blank") },
      { title: "Ajustar Fechas de Viaje", subtitle: "Modificar fecha de llegada y límite", icon: "📅", action: () => { this.app.openConfigModal(); } }
    ];

    const filtered = items.filter(it => {
      if (!q) return true;
      return it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      this.spotlightResults.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-mid-gray); font-size: 13px;">
          No se encontraron resultados para "<strong>${query}</strong>"
        </div>
      `;
      return;
    }

    this.spotlightResults.innerHTML = filtered.map((it, idx) => `
      <div class="spotlight-item ${idx === 0 ? 'highlighted' : ''}" data-idx="${idx}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">${it.icon}</span>
          <div>
            <div style="font-weight: 600; color: var(--color-ink);">${it.title}</div>
            <div style="font-size: 12px; color: var(--color-mid-gray);">${it.subtitle}</div>
          </div>
        </div>
        <span class="badge badge-outline" style="font-size: 10px;">↵ Seleccionar</span>
      </div>
    `).join("");

    this.spotlightResults.querySelectorAll(".spotlight-item").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-idx"), 10);
        if (filtered[idx] && filtered[idx].action) {
          filtered[idx].action();
          this.closeSpotlight();
        }
      });
    });
  }
}
