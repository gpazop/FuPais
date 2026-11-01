// ========================================================
// FUPAIS — AJUSTES DEL DOCK
// ========================================================

export class SettingsMethods {
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
