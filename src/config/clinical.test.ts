import { describe, expect, it } from 'vitest';
import { getPediatricBsaFallback, pediatricStageForAge } from './clinical';

describe('pediatric model age bands', () => {
  it('maps age to the conventional visual model band', () => {
    expect(pediatricStageForAge(1)).toBe('infant');
    expect(pediatricStageForAge(3)).toBe('younger');
    expect(pediatricStageForAge(5.9)).toBe('younger');
    expect(pediatricStageForAge(6)).toBe('older');
    expect(pediatricStageForAge(12)).toBe('older');
  });
});

describe('pediatric BSA fallbacks', () => {
  it('uses mid-range BSA defaults when no age is entered', () => {
    expect(getPediatricBsaFallback('infant').bsa).toBeCloseTo(0.48, 3);
    expect(getPediatricBsaFallback('younger').bsa).toBeCloseTo(0.705, 3);
    expect(getPediatricBsaFallback('older').bsa).toBeCloseTo(0.984, 3);
  });

  it('interpolates a representative BSA across the entered pediatric age', () => {
    expect(getPediatricBsaFallback('infant', 2).bsa).toBeCloseTo(0.555, 3);
    expect(getPediatricBsaFallback('younger', 4).bsa).toBeCloseTo(0.705, 3);
    expect(getPediatricBsaFallback('older', 8).bsa).toBeCloseTo(0.984, 3);
  });

  it('caps age-only fallback values at the oldest supported anchor', () => {
    expect(getPediatricBsaFallback('older', 14).bsa).toBeCloseTo(1.12, 3);
  });
});
