import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDateISO,
  getDaysDifference,
  addDaysToDate,
  getLastAllowedDate
} from '../src/domain/dates.js';

describe('parseDate / formatDateISO', () => {
  it('hace round-trip de YYYY-MM-DD a Date y de vuelta', () => {
    expect(formatDateISO(parseDate('2026-07-17'))).toBe('2026-07-17');
  });

  it('parseDate rellena correctamente mes y día con ceros', () => {
    expect(formatDateISO(parseDate('2026-01-05'))).toBe('2026-01-05');
  });

  it('formatDateISO normaliza componentes de un Date dado', () => {
    const d = new Date(2026, 2, 9); // 9 de marzo de 2026
    expect(formatDateISO(d)).toBe('2026-03-09');
  });
});

describe('getDaysDifference', () => {
  it('cuenta días naturales entre dos fechas (exclusivo del inicio)', () => {
    const a = parseDate('2026-01-01');
    const b = parseDate('2026-01-31');
    expect(getDaysDifference(a, b)).toBe(30);
  });

  it('devuelve negativo si la segunda fecha es anterior', () => {
    expect(getDaysDifference(parseDate('2026-05-10'), parseDate('2026-05-01'))).toBe(-9);
  });
});

describe('addDaysToDate', () => {
  it('cruza correctamente el límite de mes', () => {
    expect(addDaysToDate('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('cruza correctamente el límite de año', () => {
    expect(addDaysToDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('acepta días negativos', () => {
    expect(addDaysToDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('getLastAllowedDate (conteo inclusivo)', () => {
  it('el día de llegada es el Día 1: 90 días desde el 01/01 terminan el 31/03', () => {
    expect(getLastAllowedDate('2026-01-01', 90)).toBe('2026-03-31');
  });

  it('con 1 día autorizado, el último día legal es el propio día de llegada', () => {
    expect(getLastAllowedDate('2026-07-17', 1)).toBe('2026-07-17');
  });

  it('con 365 días desde el 17/07/2026 termina el 16/07/2027', () => {
    expect(getLastAllowedDate('2026-07-17', 365)).toBe('2027-07-16');
  });

  it('con valores inválidos (0, NaN) usa el fallback de 365 días', () => {
    // Number(0) y Number(NaN) son falsy => fallback 365 => último día = llegada + 364.
    expect(getLastAllowedDate('2026-07-17', 0)).toBe('2027-07-16');
    expect(getLastAllowedDate('2026-07-17', NaN)).toBe('2027-07-16');
  });
});
