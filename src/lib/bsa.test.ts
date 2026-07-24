import { describe, expect, it } from 'vitest';
import { assessPatientSize, calculateMostellerBsa, centimetersToFeetInches, feetInchesToCm, poundsToKg, resolvePatientBsa } from './bsa';

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
    expect(centimetersToFeetInches(177.8)).toEqual({ feet: 5, inches: 10 });
  });

  it('normalizes a rounded 12 inches into the next foot', () => {
    expect(centimetersToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
  });

  it('rejects implausible measurements before BSA adjustment', () => {
    expect(assessPatientSize(9000, 100).bsa).toBeUndefined();
    expect(assessPatientSize(9000, 100).warnings[0]).toContain('Height');
    expect(assessPatientSize(275, 500).warnings[0]).toContain('Calculated BSA');
  });

  it('accepts broad but plausible measurements', () => {
    const assessment = assessPatientSize(170, 70);
    expect(assessment.warnings).toEqual([]);
    expect(assessment.bsa).toBeCloseTo(calculateMostellerBsa(170, 70)!, 10);
  });

  it('uses measured or manual patient values before a pediatric fallback', () => {
    expect(resolvePatientBsa(undefined, undefined, 0.78)).toBe(0.78);
    expect(resolvePatientBsa(undefined, 0.91, 0.78)).toBe(0.91);
    expect(resolvePatientBsa(0.84, 0.91, 0.78)).toBe(0.84);
  });
});
