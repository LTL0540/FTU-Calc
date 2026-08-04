import { describe, expect, it } from 'vitest';
import { createPackageSizes } from '../data/packageSizes';
import { hasMeaningfulResetState, type ResettableState } from './resetState';

const baseline = (): ResettableState => ({
  patientMode: 'adult',
  selectedRegionCount: 0,
  handprintOverrideEnabled: false,
  quickHandprints: 0,
  mirrorFrontBack: false,
  activePresetCount: 0,
  age: '',
  ageMonths: '',
  referenceBsa: 1.73,
  defaultReferenceBsa: 1.73,
  applyBsa: false,
  frequency: 'bid',
  customApplications: 3,
  durationValue: 14,
  durationUnit: 'days',
  allowancePercent: 0,
  packageSizes: createPackageSizes(),
  defaultPackageSizes: createPackageSizes(),
});

describe('reset confirmation gating', () => {
  it('does not confirm for an untouched workflow', () => {
    expect(hasMeaningfulResetState(baseline())).toBe(false);
  });

  it('confirms when clinical or package state would be lost', () => {
    expect(hasMeaningfulResetState({ ...baseline(), selectedRegionCount: 1 })).toBe(true);
    expect(hasMeaningfulResetState({ ...baseline(), durationValue: 7 })).toBe(true);
    expect(hasMeaningfulResetState({ ...baseline(), packageSizes: baseline().packageSizes.slice(1) })).toBe(true);
  });
});
