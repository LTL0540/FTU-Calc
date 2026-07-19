import type { Formulation, PediatricStage } from '../types/calculator';

export const CLINICAL_CONSTANTS = {
  gramsPerHandprint: 0.25,
  bsaPercentPerHandprint: 0.8,
  handprintsPerFtu: 2,
  gramsPerFtu: 0.5,
  gramsPerOunce: 28.3495,
  referenceBsa: 1.73,
  daysPerMonth: 30.4375,
  largeQuantityWarningGrams: 1000,
} as const;

export const DEFAULT_FORMULATION_FACTORS: Record<Formulation, number> = {
  Cream: 1,
  Ointment: 1,
  Lotion: 1,
  Gel: 1,
  Other: 1,
};

export const DEFAULT_PACKAGE_SIZES = [7.5, 15, 30, 45, 60, 90, 100, 120, 225, 240, 454];

export const PEDIATRIC_BSA_DEFAULTS: Record<PediatricStage, { bsa: number; assumedAge: string; ageRange: string }> = {
  older: { bsa: 1.12, assumedAge: 'representative 10-year-old', ageRange: '6–10+ yr' },
  younger: { bsa: 0.78, assumedAge: 'representative 5-year-old', ageRange: '3–5 yr' },
  infant: { bsa: 0.48, assumedAge: 'representative 1-year-old', ageRange: '0–2 yr' },
};

export function pediatricStageForAge(ageYears: number): PediatricStage {
  if (ageYears < 3) return 'infant';
  if (ageYears < 6) return 'younger';
  return 'older';
}
