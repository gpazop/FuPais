// ========================================================
// FUPAIS — MAPA & REAL GOOGLE MAPS INTERACTIVE ENGINE
// ========================================================

import { geocoding } from "../../services/geocoding.js";

export class MapMethods {
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
      const location = await geocoding.reverseGeocode(lat, lng);
      if (location) {
        const { city, country } = location;
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
      const place = await geocoding.searchPlace(query);
      if (place) {
        const { lat, lng } = place;
        if (this.leafletMap) {
          this.leafletMap.flyTo([lat, lng], 12, { duration: 1.5 });
        }
        await this.updateLocationFromLatLng(lat, lng, true);
      } else {
        if (this.app) this.app.showNotification(`No se encontró el lugar "${query}"`);
        if (statusEl) statusEl.textContent = `No se hallaron resultados para "${query}". Intenta con otra ciudad.`;
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
}
