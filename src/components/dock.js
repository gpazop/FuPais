// ========================================================
// FUPAIS — DOCK NAVIGATION CONTROLLER (iOS / macOS)
// Fachada: ciclo de vida, pestañas, persistencia de ajustes
// y enganche de los módulos del dock.
// ========================================================

import { storage } from "../services/storage.js";
import {
  DOCK_STORAGE_KEY,
  FILES_STORAGE_KEY,
  defaultDockSettings,
  initialSampleFiles
} from "./dock/constants.js";
import { SpotlightMethods } from "./dock/spotlight.js";
import { DrawerMethods } from "./dock/drawer.js";
import { MapMethods } from "./dock/map.js";
import { VaultMethods } from "./dock/vault.js";
import { SettingsMethods } from "./dock/settings.js";

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
}

function applyMethods(Target, ...Sources) {
  for (const Source of Sources) {
    for (const name of Object.getOwnPropertyNames(Source.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        Target.prototype,
        name,
        Object.getOwnPropertyDescriptor(Source.prototype, name)
      );
    }
  }
}

applyMethods(
  FuPaisDock,
  SpotlightMethods,
  DrawerMethods,
  MapMethods,
  VaultMethods,
  SettingsMethods
);
