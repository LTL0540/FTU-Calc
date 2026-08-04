import type { FrequencyId, PackageSize, PatientMode } from '../types/calculator';

export type ResettableState = {
  patientMode: PatientMode;
  selectedRegionCount: number;
  handprintOverrideEnabled: boolean;
  quickHandprints: number;
  mirrorFrontBack: boolean;
  activePresetCount: number;
  age: string;
  ageMonths: string;
  heightCm?: number;
  weightKg?: number;
  referenceBsa: number;
  defaultReferenceBsa: number;
  applyBsa: boolean;
  frequency: FrequencyId;
  customApplications: number;
  durationValue: number;
  durationUnit: string;
  allowancePercent: number;
  packageSizes: PackageSize[];
  defaultPackageSizes: PackageSize[];
};

export function hasMeaningfulResetState(state: ResettableState): boolean {
  const packagesChanged = state.packageSizes.length !== state.defaultPackageSizes.length
    || state.packageSizes.some((item, index) => {
      const baseline = state.defaultPackageSizes[index];
      return !baseline || item.grams !== baseline.grams || item.enabled !== baseline.enabled;
    });

  return state.patientMode !== 'adult'
    || state.selectedRegionCount > 0
    || state.handprintOverrideEnabled
    || state.quickHandprints > 0
    || state.mirrorFrontBack
    || state.activePresetCount > 0
    || state.age.trim() !== ''
    || state.ageMonths.trim() !== ''
    || state.heightCm !== undefined
    || state.weightKg !== undefined
    || state.referenceBsa !== state.defaultReferenceBsa
    || state.applyBsa
    || state.frequency !== 'bid'
    || state.customApplications !== 3
    || state.durationValue !== 14
    || state.durationUnit !== 'days'
    || state.allowancePercent !== 0
    || packagesChanged;
}
