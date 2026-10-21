/**
 * Presets de trámites y reglas migratorias comunes por perfil.
 *
 * NOTA sobre `dayOffset`: es 1-based, es decir, cuenta "días de estancia".
 * El día de llegada es el Día 1, por lo que `dayOffset: 14` significa
 * "el día 14 de tu estancia" (13 días naturales después de la llegada).
 * La app convierte esto a fecha con `addDaysToDate(arrival, dayOffset - 1)`.
 */
const STAY_PRESETS = {
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

const COUNTRIES_LIST = [
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
