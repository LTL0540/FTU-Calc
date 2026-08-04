import { describe, expect, it } from 'vitest';
import type { CalculatorInputs } from '../types/calculator';
import { CALCULATION_LIMITS, validateInputs } from './validation';

const validInputs = (overrides: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  selectedHandprints: 2,
  selectedFtu: 1,
  selectedBsaPercent: 1.6,
  formulation: 'Cream',
  formulationFactor: 1,
  applyFormulationFactor: false,
  referenceBsa: 1.73,
  applyBsaAdjustment: false,
  applicationsPerDay: 1,
  totalApplications: 14,
  durationDays: 14,
  allowancePercent: 0,
  enabledPackageSizes: [15, 30],
  ...overrides,
});

describe('structured calculation validation', () => {
  it('accepts both inclusive BSA ratio guard boundaries', () => {
    expect(validateInputs(validInputs({
      patientBsa: 0.5,
      referenceBsa: 1,
      applyBsaAdjustment: true,
    })).filter((entry) => entry.severity === 'blocking')).toEqual([]);
    expect(validateInputs(validInputs({
      patientBsa: 1.5,
      referenceBsa: 1,
      applyBsaAdjustment: true,
    })).filter((entry) => entry.severity === 'blocking')).toEqual([]);
  });

  it('blocks treatment areas over 100% BSA', () => {
    expect(validateInputs(validInputs({ selectedBsaPercent: 100.1 }))[0]).toMatchObject({
      code: 'area.bsa.invalid',
      severity: 'blocking',
    });
  });

  it('blocks excessive package configuration counts', () => {
    const packageSizes = Array.from({ length: CALCULATION_LIMITS.maxPackageSizes + 1 }, (_, index) => index + 1);
    expect(validateInputs(validInputs({ enabledPackageSizes: packageSizes })).some((entry) => entry.code === 'packages.count.excessive')).toBe(true);
  });

  it('retains nonblocking upstream clinical warnings without invalidating inputs', () => {
    const issues = validateInputs(validInputs({
      upstreamIssues: [{ code: 'patient.review', message: 'Verify measurement.', severity: 'warning' }],
    }));
    expect(issues).toEqual([{ code: 'patient.review', message: 'Verify measurement.', severity: 'warning' }]);
  });
});
