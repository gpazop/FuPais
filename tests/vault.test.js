// ========================================================
// FUPAIS — Tests de la bóveda (utilidad pura + hook)
// ========================================================

import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  categorizeFile,
  formatFileSize,
  makeFileItem,
  filterFiles,
  VAULT_CATEGORIES
} from "../src/ui/domain/vaultFiles.js";
import { useVaultFiles } from "../src/ui/hooks/useVaultFiles.js";
import {
  FILES_STORAGE_KEY,
  initialSampleFiles
} from "../src/components/dock/constants.js";
import { storage } from "../src/services/storage.js";

afterEach(() => {
  window.localStorage.clear();
});

describe("vaultFiles (puro)", () => {
  it("categoriza por palabras clave del nombre", () => {
    expect(categorizeFile("Pasaporte_Ordinario.pdf")).toBe("pasaporte");
    expect(categorizeFile("Sello_Ingreso_PIP2.jpg")).toBe("visas");
    expect(categorizeFile("Formulario_FUT_Prorroga.pdf")).toBe("prorrogas");
    expect(categorizeFile("Carta_Aceptacion_Universidad.pdf")).toBe("academico");
    expect(categorizeFile("recibo_luz.pdf")).toBe("otros");
    expect(categorizeFile("")).toBe("otros");
  });

  it("formatea tamaños con paridad vanilla (KB/MB)", () => {
    expect(formatFileSize(512 * 1024)).toBe("512 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(formatFileSize(undefined)).toBe("0 KB");
  });

  it("makeFileItem deriva categoría, fecha ISO de hoy e ícono por extensión", () => {
    const pdf = makeFileItem({ name: "Pasaporte_Nuevo.pdf", size: 2048 });
    expect(pdf.category).toBe("pasaporte");
    expect(pdf.icon).toBe("document");
    expect(pdf.status).toBe("Subido recientemente");
    expect(pdf.uploadedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const img = makeFileItem({ name: "Sello.jpg", size: 1024 });
    expect(img.icon).toBe("image");
    expect(pdf.id).not.toBe(img.id);
  });

  it("filterFiles respeta 'todos' y filtra por categoría", () => {
    const files = [
      { id: "1", category: "pasaporte" },
      { id: "2", category: "visas" },
      { id: "3", category: "pasaporte" }
    ];
    expect(filterFiles(files, "todos")).toHaveLength(3);
    expect(filterFiles(files, "pasaporte").map((f) => f.id)).toEqual(["1", "3"]);
    expect(filterFiles(files, undefined)).toHaveLength(3);
    expect(VAULT_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });
});

describe("useVaultFiles", () => {
  it("hidrata las fichas demo cuando no hay datos guardados", async () => {
    const { result } = renderHook(() => useVaultFiles());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.files).toHaveLength(initialSampleFiles.length);
  });

  it("addFiles agrega fichas al frente y persiste en la clave legacy", async () => {
    const { result } = renderHook(() => useVaultFiles());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let count = 0;
    const file = { name: "Visa_PIP2_Sello.jpg", size: 1024 * 900 };
    act(() => {
      count = result.current.addFiles([file]);
    });
    expect(count).toBe(1);
    expect(result.current.files[0].name).toBe("Visa_PIP2_Sello.jpg");
    expect(result.current.files[0].category).toBe("visas");
    expect(result.current.files).toHaveLength(initialSampleFiles.length + 1);

    const persisted = await storage.get(FILES_STORAGE_KEY);
    expect(persisted).toHaveLength(initialSampleFiles.length + 1);
  });

  it("removeFile elimina por id y persiste el cambio", async () => {
    const { result } = renderHook(() => useVaultFiles());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    const targetId = result.current.files[0].id;

    act(() => result.current.removeFile(targetId));
    expect(result.current.files.some((f) => f.id === targetId)).toBe(false);

    const persisted = await storage.get(FILES_STORAGE_KEY);
    expect(persisted.some((f) => f.id === targetId)).toBe(false);
  });

  it("addFiles sin archivos es un no-op que no persiste", async () => {
    const { result } = renderHook(() => useVaultFiles());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    const before = result.current.files;
    let count = 99;
    act(() => {
      count = result.current.addFiles([]);
    });
    expect(count).toBe(0);
    expect(result.current.files).toBe(before);
  });
});
