// ========================================================
// FUPAIS — APP (React)
// Migración progresiva de ui/app.js (vanilla) → React.
// Fase 1: placeholder para verificar que React arranca.
// Fase 3: portar la lógica de FuPaisApp aquí.
// ========================================================

export default function App() {
  return (
    <div className="app-container">
      <header className="header-bar">
        <div className="brand-section">
          <div className="brand-logo" aria-label="Logo FuPais">Fu</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 className="brand-title">FuPais</h1>
              <span className="badge badge-outline">v2.0</span>
            </div>
            <p className="brand-subtitle">
              Gestión de estancia en el exterior, prórrogas y alertas legales
              oficiales
            </p>
          </div>
        </div>
      </header>

      <main style={{ padding: 24 }}>
        <h2>FuPais (React)</h2>
        <p>Migración en curso: capa UI se está portando a React.</p>
      </main>
    </div>
  );
}
