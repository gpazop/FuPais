// ========================================================
// FUPAIS — FILE VAULT
// ========================================================

export class VaultMethods {
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
}
