// ========================================================
// FUPAIS — DRAWER (MENÚ HAMBURGUESA / CONTROL CENTER)
// ========================================================

export class DrawerMethods {
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
}
