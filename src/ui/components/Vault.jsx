// ========================================================
// FUPAIS — Vault (vista Archivos)
// Bóveda de documentos declarativa: dropzone (clic + drag&drop con
// teclado y aria), filtros por categoría (segmented control iOS del
// CSS heredado) y grilla de fichas. Reemplaza el vault vanilla que
// NUNCA tuvo UI en la era React (sus mount points no existían).
// Nota honesta: se guardan FICHAS (nombre/tamaño/fecha/categoría),
// no el contenido de los archivos — igual que el diseño original.
// ========================================================

import { useMemo, useRef, useState } from "react";
import { VAULT_CATEGORIES, filterFiles } from "../domain/vaultFiles.js";

export default function Vault({ files, onAddFiles, onRemoveFile }) {
  const [filter, setFilter] = useState("todos");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const visible = useMemo(() => filterFiles(files, filter), [files, filter]);

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) onAddFiles?.(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    if (e.target.files?.length) onAddFiles?.(e.target.files);
    e.target.value = ""; // permite re-subir el mismo archivo
  };

  return (
    <div className="files-vault-container">
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Dropzone */}
      <div
        className={dragging ? "file-dropzone drag-active" : "file-dropzone"}
        role="button"
        tabIndex={0}
        aria-label="Subir documentos a la bóveda"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span style={{ fontSize: 34 }} aria-hidden="true">
          📂
        </span>
        <div>
          <div style={{ fontWeight: 600 }}>
            Arrastra tus documentos aquí
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-mid-gray)",
              marginTop: 2
            }}
          >
            o haz clic para seleccionarlos · pasaporte, visa, FUT, cartas · se
            guarda la ficha (nombre, tamaño y fecha), no el contenido
          </div>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div
        className="segmented-control"
        role="group"
        aria-label="Filtrar por categoría"
      >
        {VAULT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={
              filter === cat.key ? "segment-btn active" : "segment-btn"
            }
            onClick={() => setFilter(cat.key)}
            aria-pressed={filter === cat.key}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grilla de fichas */}
      <div className="files-grid">
        {visible.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 32,
              textAlign: "center",
              color: "var(--color-mid-gray)",
              fontSize: 13,
              background: "var(--color-paper)",
              borderRadius: "var(--radius-xl)",
              border: "1px dashed var(--color-hairline)"
            }}
          >
            No hay documentos en esta categoría. Arrastra archivos o haz clic
            arriba para subirlos.
          </div>
        ) : (
          visible.map((f) => (
            <div key={f.id} className="file-card">
              <div className="file-icon-square">
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--color-ink)",
                    wordBreak: "break-all"
                  }}
                  title={f.name}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                    fontSize: 11,
                    color: "var(--color-mid-gray)",
                    flexWrap: "wrap"
                  }}
                >
                  <span>{f.size}</span>
                  <span>•</span>
                  <span>{f.uploadedDate}</span>
                  <span>•</span>
                  <span style={{ textTransform: "capitalize" }}>
                    {f.category}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8
                  }}
                >
                  <span
                    className={`badge ${f.statusColor}`}
                    style={{ fontSize: 10 }}
                  >
                    {f.status}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onRemoveFile?.(f.id)}
                    title="Eliminar documento"
                    aria-label={`Eliminar ${f.name}`}
                    style={{ height: 24, padding: "0 6px", fontSize: 11 }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
