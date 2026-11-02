// ========================================================
// FUPAIS — useVaultFiles
// Estado de la bóveda de documentos: hydrate desde la clave legacy
// (fupais_vault_files_v1, con fichas demo si no hay datos) y
// persistencia automática por el puerto storage. La lógica pura
// (categorizar/formatear/filtrar) vive en ui/domain/vaultFiles.js.
// ========================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "../../services/storage.js";
import {
  FILES_STORAGE_KEY,
  initialSampleFiles
} from "../../components/dock/constants.js";
import { makeFileItem } from "../domain/vaultFiles.js";

export function useVaultFiles() {
  const [files, setFiles] = useState(initialSampleFiles);
  const [hydrated, setHydrated] = useState(false);
  const lastSavedRef = useRef(null);

  // Boot: hydrate (array almacenado o fichas demo).
  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await storage.get(FILES_STORAGE_KEY);
      if (!alive) return;
      const initial = Array.isArray(stored) ? stored : [...initialSampleFiles];
      lastSavedRef.current = initial;
      setFiles(initial);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Persistencia: cada cambio committed y distinto del último guardado.
  useEffect(() => {
    if (!hydrated || lastSavedRef.current === files) return;
    lastSavedRef.current = files;
    storage.set(FILES_STORAGE_KEY, files);
  }, [files, hydrated]);

  /** FileList/Array de File → fichas nuevas al frente. Devuelve el count. */
  const addFiles = useCallback((fileList) => {
    const list = Array.from(fileList || []);
    if (!list.length) return 0;
    const items = list.map((f) => makeFileItem({ name: f.name, size: f.size }));
    setFiles((prev) => [...items, ...prev]);
    return items.length;
  }, []);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { files, addFiles, removeFile, hydrated };
}

export default useVaultFiles;
