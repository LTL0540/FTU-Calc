import { describe, expect, it } from 'vitest';
import { calculateMostellerBsa, feetInchesToCm, poundsToKg, resolvePatientBsa } from './bsa';

describe('patient size conversions', () => {
  it('calculates Mosteller BSA', () => {
    expect(calculateMostellerBsa(180, 60)).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('requires both positive height and weight', () => {
    expect(calculateMostellerBsa(180, undefined)).toBeUndefined();
    expect(calculateMostellerBsa(-1, 60)).toBeUndefined();
  });

  it('converts common imperial values', () => {
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 8);
    expect(poundsToKg(100)).toBeCloseTo(45.359237, 8);
  });

  it('uses measured or manual patient values before a pediatric fallback', () => {
    expect(resolvePatientBsa(undefined, undefined, 0.78)).toBe(0.78);
    expect(resolvePatientBsa(undefined, 0.91, 0.78)).toBe(0.91);
    expect(resolvePatientBsa(0.84, 0.91, 0.78)).toBe(0.84);
  });
});
