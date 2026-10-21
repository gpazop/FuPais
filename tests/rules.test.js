import { describe, it, expect } from 'vitest';
import {
  mergeTrips,
  daysPresentInRange,
  usedDaysInRollingWindow,
  usedDaysInCalendarYear,
  maxDaysForNewTrip
} from '../src/domain/rules.js';

describe('mergeTrips', () => {
  it('fusiona viajes que se solapan', () => {
    const trips = [
      { start: '2026-01-01', end: '2026-03-15' },
      { start: '2026-03-10', end: '2026-04-20' }
    ];
    expect(mergeTrips(trips, '2026-04-20')).toEqual([
      { start: '2026-01-01', end: '2026-04-20' }
    ]);
  });

  it('fusiona viajes contiguos (la presencia no se interrumpe)', () => {
    const trips = [
      { start: '2026-01-01', end: '2026-01-31' },
      { start: '2026-02-01', end: '2026-02-28' }
    ];
    expect(mergeTrips(trips, '2026-02-28')).toEqual([
      { start: '2026-01-01', end: '2026-02-28' }
    ]);
  });

  it('recorta viajes en curso (end null) a today', () => {
    const trips = [{ start: '2026-01-01', end: null }];
    expect(mergeTrips(trips, '2026-03-01')).toEqual([
      { start: '2026-01-01', end: '2026-03-01' }
    ]);
  });

  it('devuelve lista vacía con entrada vacía o inválida', () => {
    expect(mergeTrips([], '2026-01-01')).toEqual([]);
    expect(mergeTrips(null, '2026-01-01')).toEqual([]);
    expect(mergeTrips([{ start: '', end: '2026-01-01' }], '2026-01-01')).toEqual([]);
  });
});

describe('daysPresentInRange', () => {
  it('cuenta 0 con lista vacía', () => {
    expect(daysPresentInRange([], '2026-01-01', '2026-03-31')).toBe(0);
  });

  it('cuenta días inclusivos en ambos extremos', () => {
    const trips = [{ start: '2026-01-01', end: '2026-01-31' }];
    expect(daysPresentInRange(trips, '2026-01-01', '2026-03-31')).toBe(31);
  });

  it('no duplica días de viajes solapados', () => {
    const trips = [
      { start: '2026-01-01', end: '2026-03-15' },
      { start: '2026-03-10', end: '2026-04-20' }
    ];
    // 1 ene → 20 abr = 110 días naturales
    expect(daysPresentInRange(trips, '2026-01-01', '2026-04-20')).toBe(110);
  });

  it('devuelve 0 si el rango es posterior a todos los viajes', () => {
    const trips = [{ start: '2026-01-01', end: '2026-01-31' }];
    expect(daysPresentInRange(trips, '2026-06-01', '2026-06-30')).toBe(0);
  });
});

describe('usedDaysInRollingWindow (ventana móvil 180)', () => {
  // Viaje A: 1 ene – 31 mar 2026 = 90 días exactos.
  const trips = [{ start: '2026-01-01', end: '2026-03-31' }];

  it('cuenta los 90 días mientras siguen dentro de la ventana', () => {
    // La ventana de 180 días que termina el 15/04 arranca el 18/10/2025.
    expect(usedDaysInRollingWindow(trips, '2026-04-15', 180)).toBe(90);
  });

  it('los días antiguos van saliendo de la ventana al avanzar', () => {
    // La ventana que termina el 30/06 arranca el 02/01: el 1 de enero sale.
    expect(usedDaysInRollingWindow(trips, '2026-06-30', 180)).toBe(89);
  });

  it('cuenta también un viaje en curso hasta hoy', () => {
    const ongoing = [{ start: '2026-01-01', end: null }];
    expect(usedDaysInRollingWindow(ongoing, '2026-03-01', 180)).toBe(60);
  });
});

describe('maxDaysForNewTrip (regla 90/180 tipo Schengen)', () => {
  it('con historial vacío permite los maxDays completos', () => {
    const result = maxDaysForNewTrip({ trips: [], start: '2026-01-01' });
    expect(result).toBe(90);
  });

  it('bloquea la entrada si la ventana ya está llena (90 días recientes)', () => {
    const trips = [{ start: '2026-01-01', end: '2026-03-31' }]; // 90 días
    // Empezando el 01/04, la ventana sigue llena: 0 días permitidos.
    expect(maxDaysForNewTrip({ trips, start: '2026-04-01' })).toBe(0);
  });

  it('permite completar hasta maxDays cuando hay uso parcial', () => {
    const trips = [{ start: '2026-01-01', end: '2026-01-30' }]; // 30 días usados
    // Empezando el 01/02: 30 usados + 60 nuevos = 90; el día 61 rompería.
    expect(maxDaysForNewTrip({ trips, start: '2026-02-01' })).toBe(60);
  });

  it('permite un segundo bloque completo de 90 días cuando los viejos rotan', () => {
    const trips = [{ start: '2026-01-01', end: '2026-03-31' }]; // 90 días
    // Empezando el 01/07: mientras los días de enero rotan, la ventana queda en 89.
    // Cuando enero sale del todo (día 89+ del nuevo viaje), la cuenta pasa a ser
    // solo días nuevos y crece hasta 90 => se rompe en el día 91.
    // Resultado: 1 jul – 28 sep (90 días), luego hay que salir 90 días.
    expect(maxDaysForNewTrip({ trips, start: '2026-07-01', horizonDays: 365 })).toBe(90);
  });

  it('respeta reglas distintas de 90/180 (p. ej. 30/60)', () => {
    const trips = [{ start: '2026-01-01', end: '2026-01-31' }]; // 31 días usados
    // Con maxDays 30 y ventana 60: la ventana que termina el 01/02 arranca el 03/12/2025
    // e incluye los 31 días de enero → no puede entrar.
    expect(
      maxDaysForNewTrip({ trips, start: '2026-02-01', windowDays: 60, maxDays: 30 })
    ).toBe(0);
  });
});

describe('usedDaysInCalendarYear (año calendario, modelo Colombia)', () => {
  it('cuenta solo los días dentro del año pedido', () => {
    const trips = [
      { start: '2025-11-01', end: '2025-12-31' }, // 2025: 61 días
      { start: '2026-01-10', end: '2026-02-20' }  // 2026: 42 días
    ];
    // El año 2026 no incluye nada de 2025: la ventana se reinicia cada 1 de enero.
    expect(usedDaysInCalendarYear(trips, '2026-03-15')).toBe(42);
    expect(usedDaysInCalendarYear(trips, '2025-12-15')).toBe(61);
  });

  it('cuenta hasta la fecha dada en un año en curso', () => {
    const trips = [{ start: '2026-04-01', end: '2026-05-05' }];
    expect(usedDaysInCalendarYear(trips, '2026-05-05')).toBe(35);
  });
});

describe('maxDaysForNewTrip con windowType=calendar-year', () => {
  it('permite los maxDays completos en un año sin uso previo', () => {
    expect(
      maxDaysForNewTrip({
        trips: [],
        start: '2026-05-01',
        windowDays: 180,
        maxDays: 180,
        horizonDays: 220,
        windowType: 'calendar-year'
      })
    ).toBe(180);
  });

  it('no cuenta días de años anteriores (la ventana se reinicia el 1 de enero)', () => {
    // 180 días enteros usados en 2025 NO bloquean el ingreso en 2026.
    const trips = [{ start: '2025-06-01', end: '2025-11-27' }]; // 180 días
    expect(
      maxDaysForNewTrip({
        trips,
        start: '2026-01-01',
        windowDays: 180,
        maxDays: 180,
        horizonDays: 200,
        windowType: 'calendar-year'
      })
    ).toBe(180);
  });

  it('respeta el tope dentro de un mismo año calendario', () => {
    // 120 días usados en 2026 → un nuevo viaje desde 2026-06-01 solo puede
    // completar los 60 días restantes del tope de 180.
    const trips = [{ start: '2026-01-01', end: '2026-04-30' }]; // 120 días
    expect(
      maxDaysForNewTrip({
        trips,
        start: '2026-06-01',
        windowDays: 180,
        maxDays: 180,
        horizonDays: 220,
        windowType: 'calendar-year'
      })
    ).toBe(60);
  });

  it('tras el cambio de año vuelve a permitir días', () => {
    // 180 días completos usados en 2026 (ventana terminada a fines de año):
    // un viaje que empieza el 1 de enero de 2027 arranca con la cuenta en 0.
    const trips = [{ start: '2026-07-01', end: '2026-12-31' }];
    expect(
      maxDaysForNewTrip({
        trips,
        start: '2027-01-01',
        windowDays: 180,
        maxDays: 180,
        horizonDays: 200,
        windowType: 'calendar-year'
      })
    ).toBe(180);
  });
});
