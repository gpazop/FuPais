// ========================================================
// FUPAIS — MapLayerSwitcher (Sprint 3)
// Calles / Satélite / Terreno (reemplaza los botones [data-map-layer]
// vanilla, que nunca llegaron a existir en el DOM React). CSS
// heredado: .map-layer-pills / .map-layer-btn(.active).
// ========================================================

const LAYERS = [
  { key: "streets", label: "Calles" },
  { key: "satellite", label: "Satélite" },
  { key: "terrain", label: "Terreno" }
];

export default function MapLayerSwitcher({ value, onChange }) {
  return (
    <div className="map-layer-pills" role="group" aria-label="Capa del mapa">
      {LAYERS.map((layer) => (
        <button
          key={layer.key}
          className={
            value === layer.key ? "map-layer-btn active" : "map-layer-btn"
          }
          onClick={() => onChange?.(layer.key)}
          aria-pressed={value === layer.key}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}
