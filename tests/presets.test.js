import { describe, it, expect } from 'vitest';
import {
  STAY_PRESETS,
  COUNTRIES_LIST,
  COUNTRY_RULES,
  COUNTRY_TASKS,
  getCountryRule,
  getPresetTasks
} from '../src/data/presets.js';

describe('presets base (regresión)', () => {
  it('STAY_PRESETS conserva los 4 tipos de estancia', () => {
    expect(Object.keys(STAY_PRESETS)).toEqual([
      'student', 'tourist_90', 'digital_nomad', 'work_visa'
    ]);
  });

  it('COUNTRIES_LIST contiene al menos CO y PE', () => {
    const codes = COUNTRIES_LIST.map(c => c.code || c);
    expect(codes).toContain('CO');
    expect(codes).toContain('PE');
  });
});

describe('getCountryRule (regresión)', () => {
  it('devuelve la regla verificada para CO turista', () => {
    const rule = getCountryRule('CO', 'tourist_90');
    expect(rule).not.toBeNull();
    expect(rule.country).toBeTruthy();
  });

  it('devuelve null para combinaciones sin datos verificados', () => {
    expect(getCountryRule('XX', 'tourist_90')).toBeNull();
  });
});

describe('COUNTRY_TASKS / getPresetTasks (Fase 1b)', () => {
  it('COUNTRY_TASKS solo incluye países con fuente verificada', () => {
    for (const code of Object.keys(COUNTRY_TASKS)) {
      expect(COUNTRY_RULES[code]).toBeTruthy();
    }
  });

  it('devuelve trámites para CO + turista con dayOffset 1-based válido', () => {
    const tasks = getPresetTasks('CO', 'tourist_90');
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    for (const t of tasks) {
      expect(Number.isInteger(t.dayOffset)).toBe(true);
      expect(t.dayOffset).toBeGreaterThanOrEqual(1);
      expect(typeof t.title).toBe('string');
      expect(t.title.length).toBeGreaterThan(0);
      expect(typeof t.description).toBe('string');
      expect(['high', 'urgent', 'critical', 'medium', 'low']).toContain(t.priority);
    }
  });

  it('debe incluir el tope legal de 90 días para CO (Res. 5477)', () => {
    const tasks = getPresetTasks('CO', 'tourist_90');
    const limite = tasks.find(t => t.dayOffset === 90);
    expect(limite).toBeTruthy();
    expect(limite.priority).toBe('critical');
  });

  it('devuelve trámites para PE + turista, con tope 183/365', () => {
    const tasks = getPresetTasks('PE', 'tourist_90');
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    const tope = tasks.find(t => t.dayOffset === 180);
    expect(tope).toBeTruthy();
  });

  it('tourist_90 y "tourist" resuelven a la misma lista', () => {
    expect(getPresetTasks('CO', 'tourist_90')).toEqual(getPresetTasks('CO', 'tourist'));
  });

  it('devuelve null para país sin datos (cae al preset genérico en la UI)', () => {
    expect(getPresetTasks('ES', 'tourist_90')).toBeNull();
    expect(getPresetTasks('XX', 'tourist_90')).toBeNull();
    expect(getPresetTasks(null, 'tourist_90')).toBeNull();
  });

  it('devuelve null para tipo de estancia sin datos verificados (student/nómada/work)', () => {
    expect(getPresetTasks('CO', 'student')).toBeNull();
    expect(getPresetTasks('CO', 'digital_nomad')).toBeNull();
    expect(getPresetTasks('CO', 'work_visa')).toBeNull();
    expect(getPresetTasks('PE', 'student')).toBeNull();
  });
});
