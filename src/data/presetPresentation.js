/**
 * Datos *de presentación* de los presets de destino.
 *
 * Este archivo NO contiene información legal. Los días autorizados, el tope
 * por ventana, la periodicidad y las fuentes oficiales viven en
 * `src/data/presets.js` (COUNTRY_RULES), que es la única fuente de verdad
 * legal. Los trámites viven en COUNTRY_TASKS. Las ventanas operativas viven
 * en `src/domain/windows.js`.
 *
 * Aquí solo hay textos y metadatos para la UI: nombres, banderas, tipo de
 * visa visible, enlace al portal y aviso legal *resumido* para el usuario.
 *
 * Para publicar un preset debe existir además una regla verificada en
 * COUNTRY_RULES para su (countryCode, stayType). Ese filtro lo aplica
 * `migrationPresets.js`; si la regla no existe, el preset se descarta aunque
 * esté listado aquí.
 */

export const PRESET_PRESENTATION = {
  colombia_intercambio: {
    countryCode: 'CO',
    destinationCountry: 'Colombia',
    flag: '🇨🇴',
    originCountry: 'Perú',
    originCode: 'PE',
    originFlag: '🇵🇪',
    visaType: 'Estudiante de Intercambio (Permiso PIP-2)',
    category: 'Estudiante Intercambio',
    // Días de estancia usados por el escenario de demostración (cercano a la
    // ventana de prórroga). No es un dato legal.
    defaultStayDays: 78,
    officialPortalUrl: 'https://www.migracioncolombia.gov.co/',
    officialEntityName: 'Migración Colombia',
    futFormUrl:
      'https://www.migracioncolombia.gov.co/tramites-y-servicios/tramites-generales/prorroga/permiso-temporal-de-permanencia-ptp-/-prorroga',
    legalNotice:
      'En Colombia, la Prórroga de Permanencia (PTP) debe solicitarse en el Formulario Único de Trámites (FUT) con un máximo de 15 días de anticipación (el sistema no la procesa antes) y un mínimo de 5 días antes de vencer (la entidad toma de 3 a 5 días hábiles en validar pago y emitir respuesta).'
  },

  colombia_turista: {
    countryCode: 'CO',
    destinationCountry: 'Colombia',
    flag: '🇨🇴',
    originCountry: 'Extranjero',
    originCode: 'EXT',
    originFlag: '✈️',
    visaType: 'Turista / Visitante (Permiso PIP-5)',
    category: 'Turista',
    defaultStayDays: 76,
    officialPortalUrl: 'https://www.migracioncolombia.gov.co/',
    officialEntityName: 'Migración Colombia',
    futFormUrl:
      'https://www.migracioncolombia.gov.co/tramites-y-servicios/tramites-generales/prorroga/permiso-temporal-de-permanencia-ptp-/-prorroga',
    legalNotice:
      'Permiso de permanencia inicial de 90 días. Solicitar la prórroga PTP entre 15 y 5 días antes del vencimiento para obtener 90 días más.'
  },

  peru_turista: {
    countryCode: 'PE',
    destinationCountry: 'Perú',
    flag: '🇵🇪',
    originCountry: 'Extranjero',
    originCode: 'EXT',
    originFlag: '✈️',
    visaType: 'Turista / Visitante (máx. 183 días / 365)',
    category: 'Turista',
    // Escenario de demostración: 90 días autorizados al ingreso menos 14
    // que ya transcurrieron (ídem patrón de colombia_turista). No es dato legal.
    defaultStayDays: 76,
    officialPortalUrl: 'https://www.migraciones.gob.pe/',
    officialEntityName: 'Superintendencia Nacional de Migraciones (Perú)',
    futFormUrl: 'https://www.migraciones.gob.pe/',
    legalNotice:
      'Al ingreso se autorizan hasta 90 días (la cantidad la fija el oficial migratorio). Como visitante puedes permanecer máximo 183 días dentro de un periodo de 365 días. La prórroga se solicita ante la Superintendencia Nacional de Migraciones ANTES de que venza tu permiso.'
  },

  // Los tres presets siguientes aún NO tienen regla legal verificada en
  // COUNTRY_RULES. Se mantienen aquí para que la UI los pueda publicar el día
  // que se verifique la regla, sin tocar componentes.
  espana_estudiante: {
    countryCode: 'ES',
    destinationCountry: 'España',
    flag: '🇪🇸',
    originCountry: 'Perú / Colombia',
    originCode: 'LATAM',
    originFlag: '🌎',
    visaType: 'Estancia por Estudios (TIE / Prórroga)',
    category: 'Estudiante',
    defaultStayDays: 310,
    officialPortalUrl: 'https://www.inclusion.gob.es/web/migraciones',
    officialEntityName: 'Extranjería — Ministerio de Política Territorial (MERCURIO)',
    futFormUrl: 'https://www.inclusion.gob.es/web/migraciones/vivir-en-espana/no-tiene-autorizacion',
    legalNotice:
      'En España (Ley Orgánica 4/2000 y RD 557/2011), la prórroga de estancia por estudios se presenta durante los 60 días naturales previos al vencimiento por la plataforma MERCURIO. También admite hasta 90 días posteriores, aunque puede acarrear apertura de expediente sancionador.'
  },

  schengen_turista: {
    countryCode: 'EU',
    destinationCountry: 'Espacio Schengen (Europa)',
    flag: '🇪🇺',
    originCountry: 'Perú',
    originCode: 'PE',
    originFlag: '🇵🇪',
    visaType: 'Turista / Exención de Visado (Regla 90/180)',
    category: 'Turista',
    defaultStayDays: 70,
    officialPortalUrl: 'https://home-affairs.ec.europa.eu/policies/schengen_en',
    officialEntityName: 'Comisión Europea — Calculadora Schengen 90/180',
    futFormUrl: 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en',
    legalNotice:
      'Máximo 90 días dentro de cualquier período móvil de 180 días en el espacio Schengen. No admite prórroga salvo motivos médicos o humanitarios excepcionales.'
  },

  mexico_canje: {
    countryCode: 'MX',
    destinationCountry: 'México',
    flag: '🇲🇽',
    originCountry: 'Perú / Colombia',
    originCode: 'LATAM',
    originFlag: '🌎',
    visaType: 'Residente Temporal Estudiante (INM)',
    category: 'Estudiante',
    defaultStayDays: 18,
    officialPortalUrl: 'https://www.gob.mx/inm/acciones-y-programas/tramites-migratorios',
    officialEntityName: 'Instituto Nacional de Migración (INM)',
    futFormUrl: 'https://www.inm.gob.mx/tramites/publico/solicitud-estancia.html',
    legalNotice:
      'Al ingresar a México con visa de estudiante, debes realizar el canje por la tarjeta física ante el INM dentro de los primeros 30 días naturales.'
  }
};
