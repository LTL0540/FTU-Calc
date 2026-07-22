import { describe, expect, it } from 'vitest';
import type { CalculatorInputs } from '../types/calculator';
import { calculateFtu } from './ftuCalculations';

const baseInputs = (overrides: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  selectedHandprints: 2,
  formulation: 'Cream',
  formulationFactor: 1,
  applyFormulationFactor: false,
  referenceBsa: 1.73,
  applyBsaAdjustment: false,
  applicationsPerDay: 1,
  durationDays: 1,
  allowancePercent: 0,
  enabledPackageSizes: [7.5, 15, 30, 45, 60, 90, 100, 120],
  ...overrides,
});

describe('FTU clinical calculations', () => {
  it.each([
    { label: '2 handprints', handprints: 2, ftu: 1, grams: 0.5 },
    { label: '4 handprints', handprints: 4, ftu: 2, grams: 1 },
    { label: 'face and neck', handprints: 5, ftu: 2.5, grams: 1.25 },
    { label: 'one arm', handprints: 6, ftu: 3, grams: 1.5 },
    { label: 'one leg', handprints: 12, ftu: 6, grams: 3 },
    { label: 'anterior trunk', handprints: 14, ftu: 7, grams: 3.5 },
    { label: 'entire trunk', handprints: 28, ftu: 14, grams: 7 },
  ])('$label converts handprints to FTU and grams', ({ handprints, ftu, grams }) => {
    const result = calculateFtu(baseInputs({ selectedHandprints: handprints }));
    expect(result.ftuPerApplication).toBe(ftu);
    expect(result.baseGramsPerApplication).toBe(grams);
  });

  it.each([
    { label: 'face and neck BID × 14', handprints: 5, grams: 35 },
    { label: 'one arm BID × 14', handprints: 6, grams: 42 },
    { label: 'one leg BID × 14', handprints: 12, grams: 84 },
    { label: 'anterior trunk BID × 14', handprints: 14, grams: 98 },
    { label: 'entire trunk BID × 14', handprints: 28, grams: 196 },
  ])('$label has the expected course quantity', ({ handprints, grams }) => {
    const result = calculateFtu(baseInputs({ selectedHandprints: handprints, applicationsPerDay: 2, durationDays: 14 }));
    expect(result.exactTreatmentGrams).toBe(grams);
  });

  it('uses a 1.00 BSA ratio at 1.73 m²', () => {
    const result = calculateFtu(baseInputs({ patientBsa: 1.73, applyBsaAdjustment: true }));
    expect(result.bsaRatio).toBe(1);
  });

  it('uses a 0.50 BSA ratio at 0.865 m²', () => {
    const result = calculateFtu(baseInputs({ patientBsa: 0.865, applyBsaAdjustment: true }));
    expect(result.bsaRatio).toBe(0.5);
  });

  it('adds a 10% allowance without rounding intermediate values', () => {
    const result = calculateFtu(baseInputs({ selectedHandprints: 4, applicationsPerDay: 1, durationDays: 60, allowancePercent: 10 }));
    expect(result.exactTreatmentGrams).toBe(60);
    expect(result.allowanceGrams).toBe(6);
    expect(result.finalRequiredGrams).toBe(66);
  });

  it('uses a preset minimum when it is higher than the calculated course estimate', () => {
    const result = calculateFtu(baseInputs({
      selectedHandprints: 7,
      applicationsPerDay: 2,
      durationDays: 14,
      minimumTreatmentGrams: 60,
    }));
    expect(result.exactTreatmentGrams).toBe(60);
    expect(result.finalRequiredGrams).toBe(60);
  });

  it('keeps the calculated quantity when it is higher than the preset minimum', () => {
    const result = calculateFtu(baseInputs({
      selectedHandprints: 5,
      applicationsPerDay: 2,
      durationDays: 14,
      minimumTreatmentGrams: 30,
    }));
    expect(result.exactTreatmentGrams).toBe(35);
  });

  it('accepts independent regional FTU and anatomical BSA estimates', () => {
    const result = calculateFtu(baseInputs({ selectedHandprints: 4, selectedFtu: 1.5, selectedBsaPercent: 7.2 }));
    expect(result.ftuPerApplication).toBe(1.5);
    expect(result.baseGramsPerApplication).toBe(0.75);
    expect(result.approximateBsaPercent).toBe(7.2);
  });
});
