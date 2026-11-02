// ========================================================
// FUPAIS — vaultFiles (utilidad pura)
// Clasificación, formato y filtrado de las FICHAS de documentos de
// la bóveda. Sin DOM, testeable con Vitest. Nota honesta: la bóveda
// guarda metadatos (nombre, tamaño, fecha, categoría) — nunca el
// contenido del archivo, igual que el diseño vanilla original.
// ========================================================

import { formatDateISO } from "../../domain/dates.js";

export const VAULT_CATEGORIES = [
  { key: "todos", label: "Todos" },
  { key: "pasaporte", label: "Pasaporte e ID" },
  { key: "visas", label: "Visas y Sellos" },
  { key: "prorrogas", label: "Prórrogas" },
  { key: "academico", label: "Académico" },
  { key: "otros", label: "Otros" }
];

/** Categoriza por palabras clave del nombre (heurística del vanilla, corregida:
 *  el "id" se evalúa como token delimitado — 'universidad' ya NO clasifica
 *  como pasaporte, bug latente heredado y cazado por los tests). */
export function categorizeFile(name) {
  const lower = (name || "").toLowerCase();
  const hasIdToken = /(^|[^a-z])id([^a-z]|$)/.test(lower);
  if (lower.includes("pasaporte") || lower.includes("dni") || hasIdToken) {
    return "pasaporte";
  }
  if (lower.includes("visa") || lower.includes("pip") || lower.includes("sello")) {
    return "visas";
  }
  if (lower.includes("prorroga") || lower.includes("fut") || lower.includes("ptp")) {
    return "prorrogas";
  }
  if (lower.includes("universidad") || lower.includes("carta") || lower.includes("estudios")) {
    return "academico";
  }
  return "otros";
}

/** Bytes → '850 KB' | '2.4 MB' (paridad con el formato vanilla). */
export function formatFileSize(bytes) {
  const sizeKB = Math.round((Number(bytes) || 0) / 1024);
  return sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
}

/** File-like { name, size } → ficha de la bóveda. */
export function makeFileItem({ name, size }) {
  return {
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    category: categorizeFile(name),
    size: formatFileSize(size),
    uploadedDate: formatDateISO(new Date()),
    status: "Subido recientemente",
    statusColor: "badge-soft",
    icon: (name || "").toLowerCase().endsWith(".pdf") ? "document" : "image"
  };
}

export function filterFiles(files, category) {
  if (!category || category === "todos") return files;
  return files.filter((f) => f.category === category);
}
