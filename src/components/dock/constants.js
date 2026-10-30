// ========================================================
// FUPAIS — CONSTANTES DEL DOCK
// Claves de persistencia, banderas, ajustes por defecto y
// fichas demo del vault.
// ========================================================

export const DOCK_STORAGE_KEY = "fupais_dock_preferences_v1";
export const FILES_STORAGE_KEY = "fupais_vault_files_v1";

// Banderas de presentación para los ítems derivados del registro de presets.
export const FLAG_BY_COUNTRY = {
  CO: "🇨🇴",
  PE: "🇵🇪",
  ES: "🇪🇸",
  MX: "🇲🇽",
  EU: "🇪🇺"
};

export const defaultDockSettings = {
  activeTab: "inicio",
  position: "bottom", // 'bottom' | 'left' | 'top'
  magnify: true,
  autoHide: false,
  isHidden: false,
  theme: "light",
  soundEnabled: true
};

export const initialSampleFiles = [
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
