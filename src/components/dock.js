// ========================================================
// FUPAIS / NOMADSTAY — DOCK NAVIGATION CONTROLLER (iOS / macOS)
// Handles Dock animations, tabs, map tracking, file vault,
// spotlight search, slide-over drawer, and dock persistence
// ========================================================

import { MIGRATION_PRESETS } from "../data/migrationPresets.js";
import { formatDatePretty } from "../domain/dates.js";
import { storage } from "../services/storage.js";

const DOCK_STORAGE_KEY = "fupais_dock_preferences_v1";
const FILES_STORAGE_KEY = "fupais_vault_files_v1";

// Banderas de presentación para los ítems derivados del registro de presets.
const FLAG_BY_COUNTRY = {
  CO: "🇨🇴",
  PE: "🇵🇪",
  ES: "🇪🇸",
  MX: "🇲🇽",
  EU: "🇪🇺"
};

const defaultDockSettings = {
  activeTab: "inicio",
  position: "bottom", // 'bottom' | 'left' | 'top'
  magnify: true,
  autoHide: false,
  isHidden: false,
  theme: "light",
  soundEnabled: true
};

const initialSampleFiles = [
  {
    id: "f-1",
    name: "Pasaporte_Ordinario_Peruano.pdf",
    category: "pasaporte",
    size: "2.4 MB",
    uploadedDate: "2026-08-01",
    status: "Verificado",
    statusColor: "badge-solid",
    icon: "passport"
  },
  {
    id: "f-2",
    name: "Sello_Ingreso_PIP2_ElDorado.jpg",
    category: "visas",
    size: "1.1 MB",
    uploadedDate: "2026-08-05",
    status: "Verificado",
    statusColor: "badge-solid",
    icon: "stamp"
  },
  {
    id: "f-3",
    name: "Carta_Aceptacion_Universidad_SantoTomas.pdf",
    category: "academico",
    size: "850 KB",
    uploadedDate: "2026-07-20",
    status: "Vigente",
    statusColor: "badge-solid",
    icon: "document"
  },
  {
    id: "f-4",
    name: "Formulario_FUT_Prorroga_Borrador.pdf",
    category: "prorrogas",
    size: "420 KB",
    uploadedDate: "2026-10-18",
    status: "Pendiente Radicación",
    statusColor: "badge-ember",
    icon: "document"
  }
];

export class FuPaisDock {
  constructor(appInstance, { settings = {}, files = null } = {}) {
    this.app = appInstance;
    this.settings = { ...defaultDockSettings, ...settings };
    this.files = files ? files : [...initialSampleFiles];
    this.audioCtx = null;
    this.currentGps = {
      lat: 4.7110,
      lng: -74.0721,
      city: "Bogotá D.C.",
      country: "Colombia",
      accuracy: "Alta (GPS Satelital)",
      altitude: "2.640 m s.n.m.",
      legalZone: "Territorio Colombiano — Estancia Legal Vigente"
    };

    this.initElements();
    this.applySettingsToUI();
    this.bindDockEvents();
    this.bindSpotlightEvents();
    this.bindDrawerEvents();
    this.bindMapEvents();
    this.bindFilesEvents();
    this.bindSettingsEvents();
    this.renderFilesList();
    this.renderMapTelemetry();
  }

  /**
   * Boot: hydrate dock preferences and vault files through the storage port.
   * Storage keys are unchanged, so existing user data still loads.
   */
  static async create(appInstance) {
    const [settings, files] = await Promise.all([
      storage.get(DOCK_STORAGE_KEY),
      storage.get(FILES_STORAGE_KEY)
    ]);

    return new FuPaisDock(appInstance, { settings: settings || {}, files });
  }

  saveSettings() {
    // Fire-and-forget: the port handles storage failures internally.
    storage.set(DOCK_STORAGE_KEY, this.settings);
  }

  saveFiles() {
    storage.set(FILES_STORAGE_KEY, this.files);
  }

  // Synthesized Apple-like haptic UI sound via Web Audio API
  playClickSound(freq = 800, type = "sine", duration = 0.04) {
    if (!this.settings.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (err) {
      // Audio autoplay policy or unavailable
    }
  }

  initElements() {
    this.dockWrapper = document.getElementById("fupais-dock");
    this.dockPeekHandle = document.getElementById("dock-peek-trigger");
    this.spotlightOverlay = document.getElementById("spotlight-overlay");
    this.spotlightInput = document.getElementById("spotlight-input");
    this.spotlightResults = document.getElementById("spotlight-results");
    this.drawerOverlay = document.getElementById("drawer-overlay");
  }

  applySettingsToUI() {
    // Dock Theme
    if (this.settings.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    // Dock Position
    if (this.dockWrapper) {
      this.dockWrapper.classList.remove("dock-bottom", "dock-left", "dock-top");
      this.dockWrapper.classList.add(`dock-${this.settings.position}`);

      document.body.classList.remove("dock-pos-bottom", "dock-pos-left", "dock-pos-top");
      document.body.classList.add(`dock-pos-${this.settings.position}`);
    }

    // Dock Peek handle position
    if (this.dockPeekHandle) {
      this.dockPeekHandle.classList.remove("handle-bottom", "handle-left", "handle-top");
      this.dockPeekHandle.classList.add(`handle-${this.settings.position}`);
    }

    // Magnify
    if (this.dockWrapper) {
      if (this.settings.magnify) {
        this.dockWrapper.classList.add("magnify-enabled");
      } else {
        this.dockWrapper.classList.remove("magnify-enabled");
      }
    }

    // Hide state
    if (this.settings.isHidden) {
      this.hideDock(false);
    } else {
      this.showDock(false);
    }

    // Switch to active tab
    this.switchTab(this.settings.activeTab, false);
  }

  bindDockEvents() {
    if (!this.dockWrapper) return;

    // Tab buttons & Actions
    this.dockWrapper.querySelectorAll(".dock-item").forEach((btn, index, allButtons) => {
      // Click handler
      btn.addEventListener("click", (e) => {
        this.playClickSound(950, "sine", 0.05);

        const tab = btn.getAttribute("data-tab");
        const action = btn.getAttribute("data-action");

        if (tab) {
          this.switchTab(tab);
        } else if (action === "busqueda") {
          this.openSpotlight();
        } else if (action === "drawer") {
          this.openDrawer();
        } else if (action === "hide-dock") {
          this.toggleDockHide();
        }
      });

      // macOS Magnification neighbor effect
      btn.addEventListener("mouseenter", () => {
        if (!this.settings.magnify) return;
        allButtons.forEach(b => b.classList.remove("neighbor-1"));
        if (index > 0) allButtons[index - 1].classList.add("neighbor-1");
        if (index < allButtons.length - 1) allButtons[index + 1].classList.add("neighbor-1");
      });

      btn.addEventListener("mouseleave", () => {
        allButtons.forEach(b => b.classList.remove("neighbor-1"));
      });
    });

    // Peek Handle click to show dock
    if (this.dockPeekHandle) {
      this.dockPeekHandle.addEventListener("click", () => {
        this.playClickSound(1100, "triangle", 0.06);
        this.showDock();
      });

      // Hover peek to reveal if auto-hide is on
      this.dockPeekHandle.addEventListener("mouseenter", () => {
        if (this.settings.autoHide) {
          this.showDock();
        }
      });
    }

    // Auto-hide mouseleave
    this.dockWrapper.addEventListener("mouseleave", () => {
      if (this.settings.autoHide) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = setTimeout(() => {
          this.hideDock();
        }, 1200);
      }
    });

    this.dockWrapper.addEventListener("mouseenter", () => {
      if (this.settings.autoHide) {
        clearTimeout(this.autoHideTimer);
      }
    });

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.toggleSpotlight();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "m") {
        e.preventDefault();
        this.toggleDrawer();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        this.toggleDockHide();
      } else if (isCmdOrCtrl && e.key === "1") {
        e.preventDefault();
        this.switchTab("inicio");
      } else if (isCmdOrCtrl && e.key === "2") {
        e.preventDefault();
        this.switchTab("mapa");
      } else if (isCmdOrCtrl && e.key === "3") {
        e.preventDefault();
        this.switchTab("archivos");
      } else if (isCmdOrCtrl && e.key === "4") {
        e.preventDefault();
        this.switchTab("perfil");
      } else if (isCmdOrCtrl && e.key === "5") {
        e.preventDefault();
        this.switchTab("configuracion");
      }
    });
  }

  switchTab(tabId, animateSound = true) {
    if (!tabId) return;
    this.settings.activeTab = tabId;
    this.saveSettings();

    if (animateSound) this.playClickSound(850, "sine", 0.04);

    // Update Dock active classes
    if (this.dockWrapper) {
      this.dockWrapper.querySelectorAll(".dock-item[data-tab]").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    // Switch views
    document.querySelectorAll(".fupais-view").forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // If map tab, trigger radar refresh and ensure map size is recomputed
    if (tabId === "mapa") {
      this.ensureMapInitialized();
      setTimeout(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize();
        }
      }, 150);
      this.renderMapTelemetry();
    }

    // Scroll smoothly to top of page when changing view
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showDock(persist = true) {
    if (!this.dockWrapper) return;
    this.dockWrapper.classList.remove("dock-hidden");
    this.settings.isHidden = false;
    if (persist) this.saveSettings();

    if (this.dockPeekHandle) {
      this.dockPeekHandle.style.opacity = "0.4";
    }
  }

  hideDock(persist = true) {
    if (!this.dockWrapper) return;
    this.dockWrapper.classList.add("dock-hidden");
    this.settings.isHidden = true;
    if (persist) this.saveSettings();

    if (this.dockPeekHandle) {
      this.dockPeekHandle.style.opacity = "1";
    }
  }

  toggleDockHide() {
    if (this.settings.isHidden) {
      this.showDock();
    } else {
      this.hideDock();
    }
  }

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

  // ========================================================
  // DRAWER (MENÚ HAMBURGUESA / CONTROL CENTER)
  // ========================================================
  bindDrawerEvents() {
    if (!this.drawerOverlay) return;

    this.drawerOverlay.addEventListener("click", (e) => {
      if (e.target === this.drawerOverlay) {
        this.closeDrawer();
      }
    });

    document.querySelectorAll("[data-close-drawer]").forEach(btn => {
      btn.addEventListener("click", () => this.closeDrawer());
    });
  }

  openDrawer() {
    if (!this.drawerOverlay) return;
    this.playClickSound(1000, "triangle", 0.05);
    this.drawerOverlay.classList.add("active");
  }

  closeDrawer() {
    if (!this.drawerOverlay) return;
    this.drawerOverlay.classList.remove("active");
  }

  toggleDrawer() {
    if (this.drawerOverlay && this.drawerOverlay.classList.contains("active")) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  // ========================================================
  // MAPA & REAL GOOGLE MAPS INTERACTIVE ENGINE
  // ========================================================
  bindMapEvents() {
    this.ensureMapInitialized();

    const btnLocateGps = document.getElementById("btn-gps-locate");
    if (btnLocateGps) {
      btnLocateGps.addEventListener("click", () => {
        this.fetchRealLocation();
      });
    }

    // Map Search Bar (Search city / country / address)
    const btnSearch = document.getElementById("btn-map-search");
    const inputSearch = document.getElementById("map-search-input");
    if (btnSearch && inputSearch) {
      const doSearch = () => {
        const query = inputSearch.value.trim();
        if (query) this.searchMapPlace(query);
      };
      btnSearch.addEventListener("click", doSearch);
      inputSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doSearch();
      });
    }

    // Layer Switcher Buttons (Roadmap, Satellite, Terrain)
    document.querySelectorAll("[data-map-layer]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-map-layer]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const layerType = btn.getAttribute("data-map-layer");
        this.switchMapLayer(layerType);
      });
    });

    // Fast simulation buttons (Bogotá, Lima, Madrid, CDMX, París)
    const btnSimBogota = document.getElementById("btn-sim-bogota");
    if (btnSimBogota) {
      btnSimBogota.addEventListener("click", () => {
        this.setSimulationLocation(4.7110, -74.0721, "Bogotá D.C.", "Colombia");
      });
    }

    const btnSimLima = document.getElementById("btn-sim-lima");
    if (btnSimLima) {
      btnSimLima.addEventListener("click", () => {
        this.setSimulationLocation(-12.0464, -77.0428, "Lima", "Perú");
      });
    }

    const btnSimMadrid = document.getElementById("btn-sim-madrid");
    if (btnSimMadrid) {
      btnSimMadrid.addEventListener("click", () => {
        this.setSimulationLocation(40.4168, -3.7038, "Madrid", "España");
      });
    }

    const btnSimCdmx = document.getElementById("btn-sim-cdmx");
    if (btnSimCdmx) {
      btnSimCdmx.addEventListener("click", () => {
        this.setSimulationLocation(19.4326, -99.1332, "Ciudad de México", "México");
      });
    }

    const btnSimParis = document.getElementById("btn-sim-paris");
    if (btnSimParis) {
      btnSimParis.addEventListener("click", () => {
        this.setSimulationLocation(48.8566, 2.3522, "París", "Espacio Schengen (Francia)");
      });
    }

    // Country catalog cards switch in map view
    document.querySelectorAll("[data-select-preset]").forEach(card => {
      card.addEventListener("click", () => {
        const presetId = card.getAttribute("data-select-preset");
        if (presetId && this.app) {
          this.playClickSound(900, "sine", 0.05);
          this.app.applyPreset(presetId);
          this.app.showNotification(`Destino cambiado a: ${card.querySelector(".country-name")?.textContent || presetId}`);
          this.renderMapTelemetry();

          // Fly map to selected country preset
          const coordsByPreset = {
            colombia_intercambio: [4.7110, -74.0721],
            colombia_turista: [4.7110, -74.0721],
            espana_estudiante: [40.4168, -3.7038],
            schengen_turista: [48.8566, 2.3522],
            mexico_canje: [19.4326, -99.1332]
          };
          if (coordsByPreset[presetId] && this.leafletMap) {
            this.leafletMap.flyTo(coordsByPreset[presetId], 6, { duration: 1.2 });
          }
        }
      });
    });
  }

  ensureMapInitialized() {
    if (this.leafletMap || typeof L === "undefined") return;

    const mapElement = document.getElementById("real-google-map");
    if (!mapElement) return;

    try {
      // 1. Initialize Leaflet Map Instance
      this.leafletMap = L.map("real-google-map", {
        center: [this.currentGps.lat, this.currentGps.lng],
        zoom: 6,
        zoomControl: true
      });

      // 2. Real Google Maps Tile Layers
      this.tileLayers = {
        streets: L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          attribution: "&copy; Google Maps"
        }),
        satellite: L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          attribution: "&copy; Google Maps Satélite"
        }),
        terrain: L.tileLayer("https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          attribution: "&copy; Google Maps Relieve"
        })
      };

      // Set default Google Roadmap (streets) layer
      this.tileLayers.streets.addTo(this.leafletMap);
      this.currentLayerKey = "streets";

      // 3. User Current Location Pin (Draggable & Clickable)
      const radarHtml = `
        <div style="position: relative; width: 28px; height: 28px; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(14, 165, 233, 0.4); border: 2px solid #38bdf8; animation: radarWave 2s infinite ease-out;"></div>
          <div style="position: absolute; inset: 6px; border-radius: 50%; background: #0ea5e9; border: 2px solid #ffffff; box-shadow: 0 0 10px #0ea5e9;"></div>
          <div style="position: absolute; inset: 10px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      `;
      const radarIcon = L.divIcon({
        className: "custom-radar-marker",
        html: radarHtml,
        iconSize: [28, 28]
      });

      this.userMarker = L.marker([this.currentGps.lat, this.currentGps.lng], {
        icon: radarIcon,
        draggable: true,
        title: "Tu Ubicación (Arrastra para mover manualmente)"
      }).addTo(this.leafletMap);

      // Radar coverage circle
      this.radarCircle = L.circle([this.currentGps.lat, this.currentGps.lng], {
        radius: 40000,
        color: "#0ea5e9",
        fillColor: "#38bdf8",
        fillOpacity: 0.12,
        weight: 1.5
      }).addTo(this.leafletMap);

      // Drag event to pick location manually
      this.userMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        this.updateLocationFromLatLng(pos.lat, pos.lng, true);
      });

      // 4. Map Click to pick location manually
      this.leafletMap.on("click", (e) => {
        this.updateLocationFromLatLng(e.latlng.lat, e.latlng.lng, true);
      });

      // 5. Add Available Country Destination Pins
      this.addCountryPinsToMap();

      // 6. Add Geodesic Flight Paths
      this.addFlightRoutesToMap();

    } catch (err) {
      console.error("Error inicializando mapa interactivo:", err);
    }
  }

  switchMapLayer(layerKey) {
    if (!this.leafletMap || !this.tileLayers[layerKey]) return;
    this.playClickSound(800, "sine", 0.04);

    // Remove active tile layer
    if (this.currentLayerKey && this.tileLayers[this.currentLayerKey]) {
      this.leafletMap.removeLayer(this.tileLayers[this.currentLayerKey]);
    }

    // Add selected layer
    this.tileLayers[layerKey].addTo(this.leafletMap);
    this.currentLayerKey = layerKey;
  }

  addCountryPinsToMap() {
    const countries = [
      { id: "colombia_intercambio", name: "Colombia", code: "CO", flag: "🇨🇴", coords: [4.7110, -74.0721], role: "Destino Activo (PIP-2)", allowed: "90 + 90 días" },
      { id: "peru_origen", name: "Perú", code: "PE", flag: "🇵🇪", coords: [-12.0464, -77.0428], role: "País de Origen", allowed: "Residencia Nacional" },
      { id: "espana_estudiante", name: "España", code: "ES", flag: "🇪🇸", coords: [40.4168, -3.7038], role: "Estancia Estudios (TIE)", allowed: "365 días" },
      { id: "schengen_turista", name: "Espacio Schengen", code: "EU", flag: "🇪🇺", coords: [48.8566, 2.3522], role: "Turista Regla 90/180", allowed: "Máx 90/180 días" },
      { id: "mexico_canje", name: "México", code: "MX", flag: "🇲🇽", coords: [19.4326, -99.1332], role: "Canje Residente INM", allowed: "Plazo 30 días" }
    ];

    countries.forEach(c => {
      const pinHtml = `
        <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
          <span>${c.flag}</span>
          <span>${c.name}</span>
        </div>
      `;
      const pinIcon = L.divIcon({
        className: "custom-country-pin",
        html: pinHtml,
        iconSize: [80, 24]
      });

      const m = L.marker(c.coords, { icon: pinIcon, title: c.name }).addTo(this.leafletMap);

      const popupContent = `
        <div style="padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700;">
            <span>${c.flag}</span>
            <span>${c.name}</span>
          </div>
          <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 2px;">${c.role}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Límite legal: <strong>${c.allowed}</strong></div>
          ${c.id !== "peru_origen" ? `
            <button class="btn btn-primary btn-sm" onclick="window.fuPaisApp.applyPreset('${c.id}'); window.fuPaisApp.showNotification('Destino cambiado a ${c.name}');" style="width: 100%; margin-top: 8px; height: 26px; font-size: 11px;">
              ✈️ Activar este país
            </button>
          ` : ''}
        </div>
      `;
      m.bindPopup(popupContent);
    });
  }

  addFlightRoutesToMap() {
    // Geodesic route polylines from Peru to destinations
    const routes = [
      { from: [-12.0464, -77.0428], to: [4.7110, -74.0721], color: "#0ea5e9" }, // Lima -> Bogotá
      { from: [4.7110, -74.0721], to: [40.4168, -3.7038], color: "#f59e0b" },  // Bogotá -> Madrid
      { from: [4.7110, -74.0721], to: [19.4326, -99.1332], color: "#10b981" }  // Bogotá -> CDMX
    ];

    routes.forEach(r => {
      L.polyline([r.from, r.to], {
        color: r.color,
        weight: 2,
        dashArray: "6, 8",
        opacity: 0.7
      }).addTo(this.leafletMap);
    });
  }

  async updateLocationFromLatLng(lat, lng, manual = true) {
    this.playClickSound(950, "sine", 0.04);
    const roundLat = parseFloat(lat.toFixed(4));
    const roundLng = parseFloat(lng.toFixed(4));

    this.currentGps.lat = roundLat;
    this.currentGps.lng = roundLng;
    this.currentGps.accuracy = manual ? "Ubicación Manual (Fijada en Google Maps)" : "Satelital GPS ±5 m";

    if (this.userMarker) {
      this.userMarker.setLatLng([roundLat, roundLng]);
    }
    if (this.radarCircle) {
      this.radarCircle.setLatLng([roundLat, roundLng]);
    }

    // Reverse geocode to resolve city & country name automatically
    await this.reverseGeocode(roundLat, roundLng);
    this.renderMapTelemetry();

    if (manual && this.app) {
      this.app.showNotification(`📍 Posición fijada en: ${this.currentGps.city}, ${this.currentGps.country} (${roundLat}°, ${roundLng}°)`);
    }
  }

  async reverseGeocode(lat, lng) {
    const statusEl = document.getElementById("gps-status-text");
    if (statusEl) statusEl.textContent = `Resolviendo dirección satelital en (${lat}°, ${lng}°)...`;

    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || "Zona Geográfica";
        const country = data.countryName || "Internacional";
        this.currentGps.city = city;
        this.currentGps.country = country;

        const activeCountry = this.app?.state?.destinationCountry || "Colombia";
        if (country.toLowerCase().includes(activeCountry.toLowerCase()) || activeCountry.toLowerCase().includes(country.toLowerCase())) {
          this.currentGps.legalZone = `Territorio de ${activeCountry} — Estancia Legal Vigente`;
        } else if (country.toLowerCase().includes("perú") || country.toLowerCase().includes("peru")) {
          this.currentGps.legalZone = "País de Origen (Perú) — Residencia Nacional";
        } else {
          this.currentGps.legalZone = `Territorio Extranjero (${country}) — Fuera de tu país`;
        }

        if (statusEl) statusEl.textContent = `Localizado en ${city}, ${country}. Telemetría migratoria activa.`;
      }
    } catch (e) {
      console.warn("Geocodificación falló:", e);
      if (statusEl) statusEl.textContent = `Coordenadas: ${lat}°, ${lng}°. Modo sin conexión.`;
    }
  }

  async searchMapPlace(query) {
    const statusEl = document.getElementById("gps-status-text");
    if (statusEl) statusEl.textContent = `Buscando "${query}" en Google Maps...`;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);

          if (this.leafletMap) {
            this.leafletMap.flyTo([lat, lng], 12, { duration: 1.5 });
          }
          await this.updateLocationFromLatLng(lat, lng, true);
        } else {
          if (this.app) this.app.showNotification(`No se encontró el lugar "${query}"`);
          if (statusEl) statusEl.textContent = `No se hallaron resultados para "${query}". Intenta con otra ciudad.`;
        }
      }
    } catch (err) {
      console.warn("Búsqueda de lugar falló:", err);
    }
  }

  fetchRealLocation() {
    const statusEl = document.getElementById("gps-status-text");
    if (statusEl) statusEl.textContent = "Obteniendo coordenadas satelitales GPS en tiempo real...";

    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = "Geolocalización no soportada por el navegador. Usando estimación satelital.";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));

        this.currentGps.accuracy = `GPS Satelital en Vivo ±${Math.round(pos.coords.accuracy)}m`;
        this.currentGps.altitude = pos.coords.altitude ? `${Math.round(pos.coords.altitude)} m` : "Nivel de superficie";

        if (this.leafletMap) {
          this.leafletMap.flyTo([lat, lng], 13, { duration: 1.5 });
        }
        await this.updateLocationFromLatLng(lat, lng, false);

        if (this.app) {
          this.app.showNotification(`GPS en vivo fijado: ${lat}°, ${lng}°`);
        }
      },
      (err) => {
        console.warn("Geolocalización denegada o timeout:", err.message);
        if (statusEl) statusEl.textContent = `Permiso no otorgado o timeout (${err.message}). Haz clic en el mapa para fijar manualmente.`;
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  }

  setSimulationLocation(lat, lng, city, country) {
    this.playClickSound(1020, "triangle", 0.05);
    this.currentGps.lat = lat;
    this.currentGps.lng = lng;
    this.currentGps.city = city;
    this.currentGps.country = country;
    this.currentGps.accuracy = "Simulado ±5 metros";
    this.currentGps.legalZone = `Territorio de ${country} — Modo de Seguimiento`;

    if (this.leafletMap) {
      this.leafletMap.flyTo([lat, lng], 8, { duration: 1.2 });
    }
    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    }
    if (this.radarCircle) {
      this.radarCircle.setLatLng([lat, lng]);
    }

    this.renderMapTelemetry();
    if (this.app) {
      this.app.showNotification(`📍 Radar reubicado en: ${city}, ${country}`);
    }
  }

  renderMapTelemetry() {
    const elCoords = document.getElementById("hud-gps-coords");
    const elCity = document.getElementById("hud-gps-city");
    const elAccuracy = document.getElementById("hud-gps-accuracy");
    const elLegal = document.getElementById("hud-gps-legal");

    if (elCoords) elCoords.textContent = `${this.currentGps.lat}° N, ${this.currentGps.lng}° W`;
    if (elCity) elCity.textContent = `${this.currentGps.city}, ${this.currentGps.country}`;
    if (elAccuracy) elAccuracy.textContent = this.currentGps.accuracy;
    if (elLegal) elLegal.textContent = this.currentGps.legalZone;

    // Highlight matching country card
    document.querySelectorAll("[data-select-preset]").forEach(card => {
      const presetId = card.getAttribute("data-select-preset");
      if (presetId === this.app?.state?.presetId) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
  }

  // ========================================================
  // VAULT & FILES SYSTEM
  // ========================================================
  bindFilesEvents() {
    const fileInput = document.getElementById("vault-file-input");
    const dropzone = document.getElementById("vault-dropzone");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-active");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("drag-active");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-active");
        if (e.dataTransfer.files.length) {
          this.handleUploadedFiles(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) {
          this.handleUploadedFiles(e.target.files);
        }
      });
    }

    // Category filters
    document.querySelectorAll(".files-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".files-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.getAttribute("data-filter");
        this.renderFilesList(cat);
      });
    });
  }

  handleUploadedFiles(fileList) {
    Array.from(fileList).forEach(file => {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      let category = "otros";
      const lower = file.name.toLowerCase();
      if (lower.includes("pasaporte") || lower.includes("dni") || lower.includes("id")) category = "pasaporte";
      else if (lower.includes("visa") || lower.includes("pip") || lower.includes("sello")) category = "visas";
      else if (lower.includes("prorroga") || lower.includes("fut") || lower.includes("ptp")) category = "prorrogas";
      else if (lower.includes("universidad") || lower.includes("carta") || lower.includes("estudios")) category = "academico";

      const newFileItem = {
        id: "f-" + Date.now() + Math.random().toString(36).substr(2, 4),
        name: file.name,
        category,
        size: sizeStr,
        uploadedDate: new Date().toISOString().split("T")[0],
        status: "Subido recientemente",
        statusColor: "badge-soft",
        icon: file.name.endsWith(".pdf") ? "document" : "image"
      };

      this.files.unshift(newFileItem);
    });

    this.saveFiles();
    this.renderFilesList();
    this.playClickSound(1200, "triangle", 0.08);

    if (this.app) {
      this.app.showNotification(`¡${fileList.length} archivo(s) guardado(s) exitosamente en tu bóveda migratoria!`);
    }

    // Update Dock badge for files
    const badge = document.getElementById("dock-files-badge");
    if (badge) {
      badge.textContent = this.files.length;
    }
  }

  deleteFile(fileId) {
    this.files = this.files.filter(f => f.id !== fileId);
    this.saveFiles();
    this.renderFilesList();
    this.playClickSound(700, "sawtooth", 0.04);
  }

  renderFilesList(filterCategory = "todos") {
    const container = document.getElementById("vault-files-grid");
    if (!container) return;

    const filtered = this.files.filter(f => {
      if (filterCategory === "todos") return true;
      return f.category === filterCategory;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--color-mid-gray); font-size: 13px; background: var(--color-paper); border-radius: var(--radius-xl); border: 1px dashed var(--color-hairline);">
          No hay documentos en esta categoría. Puedes arrastrar tus archivos o hacer clic en el botón superior para subir.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(f => `
      <div class="file-card">
        <div class="file-icon-square">
          <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 13px; color: var(--color-ink); word-break: break-all;" title="${f.name}">
            ${f.name}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 11px; color: var(--color-mid-gray);">
            <span>${f.size}</span>
            <span>•</span>
            <span>${f.uploadedDate}</span>
          </div>
          <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span class="badge ${f.statusColor}" style="font-size: 10px;">${f.status}</span>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-outline btn-sm delete-file-btn" data-file-id="${f.id}" title="Eliminar documento" style="height: 24px; padding: 0 6px; font-size: 11px;">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".delete-file-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-file-id");
        this.deleteFile(id);
      });
    });

    const badge = document.getElementById("dock-files-badge");
    if (badge) {
      badge.textContent = this.files.length;
    }
  }

  // ========================================================
  // SETTINGS EVENTS
  // ========================================================
  bindSettingsEvents() {
    // Dock Position switch buttons in Settings
    document.querySelectorAll("[data-set-dock-pos]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pos = btn.getAttribute("data-set-dock-pos");
        this.setDockPosition(pos);
      });
    });

    // Theme selector
    document.querySelectorAll("[data-set-theme]").forEach(btn => {
      btn.addEventListener("click", () => {
        const theme = btn.getAttribute("data-set-theme");
        this.setTheme(theme);
      });
    });

    // Auto-hide switch
    const switchAutoHide = document.getElementById("switch-dock-autohide");
    if (switchAutoHide) {
      switchAutoHide.checked = this.settings.autoHide;
      switchAutoHide.addEventListener("change", (e) => {
        this.settings.autoHide = e.target.checked;
        this.saveSettings();
        this.playClickSound(800, "sine", 0.04);
      });
    }

    // Magnify switch
    const switchMagnify = document.getElementById("switch-dock-magnify");
    if (switchMagnify) {
      switchMagnify.checked = this.settings.magnify;
      switchMagnify.addEventListener("change", (e) => {
        this.settings.magnify = e.target.checked;
        this.saveSettings();
        this.applySettingsToUI();
        this.playClickSound(800, "sine", 0.04);
      });
    }

    // Google Maps API Key setting
    const inputApiKey = document.getElementById("cfg-google-api-key");
    const btnSaveApiKey = document.getElementById("btn-save-maps-key");
    if (inputApiKey) {
      if (this.settings.googleMapsApiKey) {
        inputApiKey.value = this.settings.googleMapsApiKey;
      }
      if (btnSaveApiKey) {
        btnSaveApiKey.addEventListener("click", () => {
          this.settings.googleMapsApiKey = inputApiKey.value.trim();
          this.saveSettings();
          this.playClickSound(1000, "triangle", 0.05);
          if (this.app) {
            this.app.showNotification("Clave de Google Maps guardada correctamente");
          }
        });
      }
    }
  }

  setDockPosition(position) {
    this.settings.position = position;
    this.saveSettings();
    this.applySettingsToUI();
    this.playClickSound(900, "triangle", 0.05);

    document.querySelectorAll("[data-set-dock-pos]").forEach(btn => {
      if (btn.getAttribute("data-set-dock-pos") === position) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (this.app) {
      const posLabels = { bottom: "Abajo (Centro)", left: "Izquierda (Vertical)", top: "Arriba (Centro)" };
      this.app.showNotification(`Posición del Dock cambiada a: ${posLabels[position] || position}`);
    }
  }

  setTheme(theme) {
    this.settings.theme = theme;
    this.saveSettings();
    this.applySettingsToUI();
    this.playClickSound(950, "triangle", 0.05);

    document.querySelectorAll("[data-set-theme]").forEach(btn => {
      if (btn.getAttribute("data-set-theme") === theme) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}
