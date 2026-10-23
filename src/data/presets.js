/**
 * Presets de trámites y reglas migratorias comunes por perfil.
 *
 * NOTA sobre `dayOffset`: es 1-based, es decir, cuenta "días de estancia".
 * El día de llegada es el Día 1, por lo que `dayOffset: 14` significa
 * "el día 14 de tu estancia" (13 días naturales después de la llegada).
 * La app convierte esto a fecha con `addDaysToDate(arrival, dayOffset - 1)`.
 */
export const STAY_PRESETS = {
  student: {
    name: 'Estudiante (Visa / Permiso de Estudios)',
    icon: '🎓',
    defaultDays: 365,
    description: 'Estancia autorizada por motivos académicos con requisitos de prórroga y documentación.',
    tasks: [
      {
        title: 'Registro de Domicilio / Empadronamiento',
        dayOffset: 14,
        category: 'Trámite local',
        priority: 'high',
        description: 'Obligatorio en la alcaldía/ayuntamiento de la ciudad donde resides para formalizar tu estancia.'
      },
      {
        title: 'Toma de huellas para Tarjeta de Identidad (TIE/DNI)',
        dayOffset: 30,
        category: 'Migraciones',
        priority: 'urgent',
        description: 'Solicitar cita previa en la oficina de extranjería o comisaría para expedir tu tarjeta de residencia/estudiante.'
      },
      {
        title: 'Comprobación de Cobertura de Seguro Médico',
        dayOffset: 60,
        category: 'Salud',
        priority: 'medium',
        description: 'Verificar que la póliza internacional sin copago esté activa y cumpla los requisitos exigidos.'
      },
      {
        title: 'Ventana para Prórroga de Estancia por Estudios (Inicio)',
        dayOffset: 305, // 60 días antes de cumplir el año
        category: 'Renovación Migratoria',
        priority: 'urgent',
        description: '¡CRÍTICO! La solicitud de prórroga se debe presentar durante los 60 días naturales previos a la fecha de caducidad.'
      },
      {
        title: 'Fecha Límite Ordinaria de Vencimiento de Estancia',
        dayOffset: 365,
        category: 'Límite Legal',
        priority: 'critical',
        description: 'Último día de vigencia del periodo actual. Debes contar con resguardo de prórroga o haber salido del país.'
      }
    ]
  },
  tourist_90: {
    name: 'Turista (Regla 90 días / Schengen / Exención)',
    icon: '✈️',
    defaultDays: 90,
    description: 'Máximo 90 días dentro de cualquier período de 180 días en la mayoría de zonas turísticas internacionales.',
    tasks: [
      {
        title: 'Registro de Entrada / Sello en Pasaporte',
        dayOffset: 1,
        category: 'Control Fronterizo',
        priority: 'medium',
        description: 'Verificar sello de entrada con la fecha exacta para no tener disputas con la autoridad migratoria.'
      },
      {
        title: 'Revisión de Reserva de Vuelo de Salida',
        dayOffset: 45,
        category: 'Transporte',
        priority: 'medium',
        description: 'Confirmar billete de regreso o billete hacia un tercer país fuera de la zona restringida.'
      },
      {
        title: 'Alerta Preventiva: Mitad del Tiempo de Estancia (45 días)',
        dayOffset: 45,
        category: 'Control de Días',
        priority: 'high',
        description: 'Han transcurrido 45 días. Quedan 45 días para la salida obligatoria.'
      },
      {
        title: 'Alerta Crítica: 15 Días Restantes',
        dayOffset: 75,
        category: 'Alerta Roja',
        priority: 'urgent',
        description: 'Planificar salida definitiva para evitar multas, deportación o prohibición de entrada de 1 a 3 años.'
      },
      {
        title: 'Día 90: Salida Obligatoria del Territorio',
        dayOffset: 90,
        category: 'Límite Legal',
        priority: 'critical',
        description: 'Fecha límite improrrogable sin sanción para turistas.'
      }
    ]
  },
  digital_nomad: {
    name: 'Nómada Digital / Trabajo Remoto',
    icon: '💻',
    defaultDays: 180,
    description: 'Estancia extendida para profesionales remotos con control fiscal y fechas de renovación.',
    tasks: [
      {
        title: 'Notificación de Residencia Fiscal y Domicilio',
        dayOffset: 30,
        category: 'Fiscal',
        priority: 'medium',
        description: 'Registrar la dirección postal local para notificaciones administrativas y bancarias.'
      },
      {
        title: 'Límite de Regla de los 183 Días (Residencia Fiscal)',
        dayOffset: 180,
        category: 'Fiscalidad',
        priority: 'high',
        description: 'Superar los 183 días en un año natural puede convertirte en residente fiscal en el país receptor.'
      },
      {
        title: 'Preparación de Documentación de Renovación',
        dayOffset: 150,
        category: 'Renovación Migratoria',
        priority: 'urgent',
        description: 'Acreditar ingresos de los últimos meses, certificados de trabajo remoto y cotizaciones a la seguridad social.'
      }
    ]
  },
  work_visa: {
    name: 'Trabajo / Contrato Local',
    icon: '💼',
    defaultDays: 365,
    description: 'Autorización de residencia y trabajo por cuenta ajena vinculada a contrato laboral.',
    tasks: [
      {
        title: 'Alta en la Seguridad Social',
        dayOffset: 5,
        category: 'Laboral',
        priority: 'urgent',
        description: 'Confirmar con el empleador la formalización del alta en el sistema de seguridad social antes de iniciar labores.'
      },
      {
        title: 'Apertura de Cuenta Bancaria Local',
        dayOffset: 15,
        category: 'Financiero',
        priority: 'medium',
        description: 'Abrir cuenta con pasaporte o número de identidad para nómina local.'
      },
      {
        title: 'Expedición de Tarjeta de Residencia Laboral',
        dayOffset: 45,
        category: 'Migraciones',
        priority: 'urgent',
        description: 'Cita en comisaría/extranjería aportando contrato de trabajo y alta.'
      },
      {
        title: 'Renovación de Permiso de Trabajo',
        dayOffset: 305,
        category: 'Renovación Migratoria',
        priority: 'critical',
        description: 'Comenzar trámites con RRHH de la empresa 60 días antes del vencimiento.'
      }
    ]
  }
};

export const COUNTRIES_LIST = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' }
];

/**
 * Reglas migratorias VERIFICADAS por país (Fase 2).
 *
 * Cada regla incluye su fuente, URL y fecha de verificación (`verifiedAt`).
 * La UI debe mostrar siempre estos datos junto a un disclaimer legal.
 *
 * Semántica de los campos (consistente con src/domain/rules.js):
 * - allowedDays: días otorgados en el ingreso / por estancia inicial.
 * - windowType: 'calendar-year' (tope reinicia el 1 de enero, p. ej. Colombia)
 *               o 'rolling' (ventana móvil de `windowDays` días).
 * - maxDaysInWindow: tope máximo acumulado dentro de la ventana.
 */
export const COUNTRY_RULES = {
  CO: {
    country: 'Colombia',
    flag: '🇨🇴',
    tourist: {
      title: 'Permiso de Ingreso y Permanencia (PIP) por turismo',
      allowedDays: 90,
      windowDays: 180,
      windowType: 'calendar-year',
      maxDaysInWindow: 180,
      summary:
        'Al ingreso por turismo se autorizan hasta 90 días. La permanencia es prorrogable por otros 90 (solicítala antes de vencer tu autorización). El tope absoluto es 180 días — continuos o discontinuos — dentro del año calendario (1 de enero – 31 de diciembre); es improrrogable al alcanzarlos.',
      source:
        'Migración Colombia / Cancillería — Resolución 5477 del 22 de julio de 2022 (visa V, turismo); Decreto 1067 de 2015 · Resolución 2061 de 2020 (PIP)',
      sourceUrl:
        'https://www.cancilleria.gov.co/sites/default/files/2022-12/5477%20del%2022%20de%20julio%20de%202022%20(1).pdf',
      verifiedAt: '2026-10-20'
    }
    // TODO Fase 2b: estudiante y trabajador (Student Visa / M Visa)
  },

  PE: {
    country: 'Perú',
    flag: '🇵🇪',
    tourist: {
      title: 'Turista / Visitante',
      allowedDays: 90,
      windowDays: 365,
      windowType: 'rolling',
      maxDaysInWindow: 183,
      summary:
        'Al ingreso suelen autorizar hasta 90 días (la cantidad se otorga en el sello/solicitud y varía según el oficial). Como visitante o turista puedes permanecer como máximo 183 días dentro de un periodo de 365 días. La prórroga se solicita ante la Superintendencia Nacional de Migraciones ANTES de que venza tu permiso. El pasaporte debe tener una validez mínima de 6 meses al ingreso.',
      source:
        'Superintendencia Nacional de Migraciones (Perú) · consulado peruano — requisitos de visitante/turista',
      sourceUrl: 'https://www.migraciones.gob.pe/',
      extraSources: [
        'https://www.consulado.pe/es/hamburgo/tramite/Paginas/Visas/Issuance-of-Tourist-Visa.aspx'
      ],
      verifiedAt: '2026-10-20'
    },
    student: {
      title: 'Prórroga de residencia (Residentes con calidad especial)',
      allowedDays: 365,
      windowDays: 365,
      windowType: 'rolling',
      maxDaysInWindow: 365,
      summary:
        'La prórroga de residencia en Perú otorga hasta 365 días y aplica a calidades de residencia especial (residente calificado, trabajador del mercado laboral, investigador) — no a estancia turística. Verifica en Migraciones tu calidad migratoria exacta antes de confiar en esta cifra.',
      source: 'gob.pe — Prórroga de residencia (Perú)',
      sourceUrl: 'https://www.gob.pe/12834',
      verifiedAt: '2026-10-20'
    }
  }
};

/**
 * Mapea ids de STAY_PRESETS → claves dentro de COUNTRY_RULES.
 * Los presets sin datos verificados quedan fuera (getCountryRule → null).
 */
const STAY_TYPE_TO_RULE = {
  tourist_90: 'tourist',
  student: 'student'
  // digital_nomad / work_visa: sin datos verificados en CO/PE → regla genérica
};

/**
 * Devuelve la clave de regla dentro de COUNTRY_RULES para un tipo de estancia
 * del preset (ej. 'tourist_90' → 'tourist'). Exportado para que otros módulos
 * (ventanas de trámite, registro derivado de presets) puedan traducir
 * stayType → ruleKey sin duplicar el mapeo.
 */
export function getStayTypeRuleKey(stayType) {
  return STAY_TYPE_TO_RULE[stayType] || stayType;
}

/**
 * Devuelve la regla verificada para (país, tipo de estancia) o `null` si no
 * hay datos verificados para esa combinación. La UI usa `null` para enseñar
 * la nota genérica "datos no verificados" en lugar de inventar cifras.
 */
export function getCountryRule(countryCode, stayType) {
  const byCountry = COUNTRY_RULES[countryCode];
  if (!byCountry) return null;
  const ruleKey = getStayTypeRuleKey(stayType);
  if (!byCountry[ruleKey]) return null;
  return { ...byCountry[ruleKey], country: byCountry.country, flag: byCountry.flag };
}

/**
 * Trámites migratorios recomendados por PAÍS DE DESTINO (Fase 1b).
 * Igual que COUNTRY_RULES: solo entradas con fuente verificada
 * (verifiedAt: '2026-10-20'); los presets sin datos quedan fuera.
 *
 * dayOffset es 1-based (día de estancia): el día de llegada es el Día 1.
 * Los offsets de "ventana de prórroga" son recordatorios de planificación
 * (antes del vencimiento legal), no plazos legales.
 */
export const COUNTRY_TASKS = {
  CO: {
    tourist: [
      {
        title: 'Verificar sello / autorización de ingreso (PIP)',
        dayOffset: 1,
        category: 'Migraciones',
        priority: 'high',
        description: 'En el ingreso, Migración Colombia suele otorgar el Permiso de Ingreso y Permanencia (PIP) hasta por 90 días para turismo (Resolución 2061 de 2020). Verifica que la duración otorgada en tu sello/registro coincida con lo autorizado.'
      },
      {
        title: 'Solicitar prórroga del PIP ante Migración Colombia (si necesitas más de 90 días)',
        dayOffset: 60,
        category: 'Migraciones',
        priority: 'urgent',
        description: 'El PIP de turismo puede prorrogarse una sola vez, hasta por un máximo igual al otorgado, ANTES de su vencimiento. Solicítalo en línea y guarda el resguardo de la solicitud.'
      },
      {
        title: 'Tope de 90 días como turista (Resolución 5477 de 2022)',
        dayOffset: 90,
        category: 'Límite Legal',
        priority: 'critical',
        description: 'Con la Resolución 5477, la estancia máxima como turista en Colombia es de 90 días. Salir con el permiso vencido implica multa y posible sanción migratoria.'
      }
    ],
    /**
     * Estudiante de intercambio (PIP-2). Set portado VERBATIM de la
     * referencia congelada DISEÑO-PRUEBA-1 (js/data/migrationData.js,
     * preset colombia_intercambio). La regla legal sigue siendo la de
     * CO.tourist (mismo PIP); solo cambian los trámites recomendados.
     *
     * dayOffsets derivados de la semántica de la referencia:
     *  - carta            → daysFromEntry 5  → dayOffset 5
     *  - apertura ventana → 15 días antes    → dayOffset (90 − 15) = 75
     *  - límite seguro    → 5 días antes     → dayOffset (90 − 5)  = 85
     *  - aprobación       → en el vencimiento→ dayOffset 90
     *
     * COLA LEGAL (no reescribir aquí): los claim "+90 días adicionales" y
     * "máximo legal 180 días por año" provienen de la referencia y están
     * pendientes de verificación.
     */
    intercambio: [
      {
        title: 'Carta de Aceptación / Convenio de Intercambio',
        dayOffset: 5,
        category: 'Universidad',
        priority: 'high',
        description: 'Documento de la universidad colombiana (ej. U. Santo Tomás) que certifica el período académico activo.'
      },
      {
        title: 'Apertura de Ventana de Prórroga PTP (15 días antes)',
        dayOffset: 75,
        category: 'Migraciones',
        priority: 'urgent',
        // Flag explícito: el título contiene "Prórroga" pero la tarea abre la
        // ventana de radicación, no es una acción de prórroga.
        isExtensionAction: false,
        description: 'Día a partir del cual el sistema FUT de Migración Colombia permite radicar la prórroga sin rechazo por anticipación.'
      },
      {
        title: 'Límite Seguro de Radicación (5 días antes)',
        dayOffset: 85,
        category: 'Migraciones',
        priority: 'urgent',
        description: 'Fecha máxima recomendada para radicar y pagar el trámite online para dar margen a los 3-4 días de estudio de la entidad.'
      },
      {
        title: 'Aprobación de Prórroga PTP (+90 Días Adicionales)',
        dayOffset: 90,
        category: 'Migraciones',
        priority: 'critical',
        isExtensionAction: true,
        description: 'Al ser aprobada por Migración Colombia, otorga hasta 90 días más (máximo legal 180 días por año).'
      }
    ]
  },
  PE: {
    tourist: [
      {
        title: 'Verificar días otorgados al ingreso (sello / registro)',
        dayOffset: 1,
        category: 'Migraciones',
        priority: 'high',
        description: 'La cantidad de días la otorga el oficial migratorio al ingresar (normalmente hasta 90). Conserva tu registro de entrada y verifica la fecha de vencimiento indicada.'
      },
      {
        title: 'Solicitar prórroga ante la Superintendencia Nacional de Migraciones (si necesitas más días)',
        dayOffset: 60,
        category: 'Migraciones',
        priority: 'urgent',
        description: 'La prórroga se solicita ante Migraciones ANTES de que venza tu permiso de permanencia. Necesitas pasaporte vigente (mínimo 6 meses al ingreso). Consulta www.migraciones.gob.pe y gob.pe/12834.'
      },
      {
        title: 'Tope de estancia como visitante: 183 días en un periodo de 365',
        dayOffset: 180,
        category: 'Límite Legal',
        priority: 'high',
        description: 'Como visitante puedes permanecer máximo 183 días dentro de un periodo de 365 días, aunque sumes prórrogas. Planifica tu salida para no superar este tope.'
      }
    ]
  }
};

const STAY_TYPE_TO_TASK_KEYS = {
  tourist_90: 'tourist',
  student: 'student'
  // digital_nomad / work_visa: sin datos verificados en CO/PE → preset genérico
};

/**
 * Devuelve los trámites recomendados para (país de destino, tipo de estancia)
 * o `null` cuando no hay datos verificados para esa combinación. En ese caso
 * la UI cae al preset genérico de STAY_PRESETS (comportamiento previo).
 */
export function getPresetTasks(countryCode, stayType) {
  const byCountry = COUNTRY_TASKS[countryCode];
  if (!byCountry) return null;
  const taskKey = STAY_TYPE_TO_TASK_KEYS[stayType] || stayType;
  return byCountry[taskKey] || null;
}

