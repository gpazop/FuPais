/**
 * Mapa `presetId → [lat, lng]` de los presets migratorios publicados.
 *
 * Contiene SOLO los presets que pasaron el filtro de publicación de
 * `migrationPresets.js` (regla legal verificada en COUNTRY_RULES). No es
 * una lista hardcodeada de países: es un mero catálogo de coordenadas para
 * dibujar el pin de cada destino publicado. Si se añade un país nuevo al
 * registro, aquí sólo hay que añadir su coordenada; si un preset publicado
 * no tiene coordenada, el mapa simplemente no le dibuja pin y no rompe.
 *
 * `peru_origen` (País de Origen) no es un preset publicado: no aparece aquí.
 */
export const PRESET_COORDS = Object.freeze({
  colombia_intercambio: [4.7110, -74.0721], // Bogotá D.C.
  colombia_turista: [4.7110, -74.0721],     // Bogotá D.C.
  peru_turista: [-12.0464, -77.0428]        // Lima
});
