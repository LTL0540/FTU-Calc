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

export type PediatricBsaFallback = {
  bsa: number;
  assumedAge: string;
  ageRange: string;
  isAgeSpecific: boolean;
};

type PediatricBsaAnchor = { age: number; bsa: number };

// Representative pediatric BSA anchors. Height and weight, when available,
// always take precedence over these age-based estimates.
export const PEDIATRIC_BSA_ANCHORS: readonly PediatricBsaAnchor[] = [
  { age: 0, bsa: 0.24 },
  { age: 1, bsa: 0.48 },
  { age: 5, bsa: 0.78 },
  { age: 10, bsa: 1.12 },
] as const;

const PEDIATRIC_STAGE_DEFAULT_AGES: Record<PediatricStage, number> = {
  older: 8,
  younger: 4,
  infant: 1,
};

const PEDIATRIC_STAGE_RANGES: Record<PediatricStage, string> = {
  older: '6–10 yr',
  younger: '3–5 yr',
  infant: '0–2 yr',
};

function interpolatePediatricBsa(ageYears: number) {
  const first = PEDIATRIC_BSA_ANCHORS[0];
  const last = PEDIATRIC_BSA_ANCHORS[PEDIATRIC_BSA_ANCHORS.length - 1];
  const age = Math.min(last.age, Math.max(first.age, ageYears));
  const upperIndex = PEDIATRIC_BSA_ANCHORS.findIndex((anchor) => anchor.age >= age);
  const upper = PEDIATRIC_BSA_ANCHORS[Math.max(0, upperIndex)];
  const lower = PEDIATRIC_BSA_ANCHORS[Math.max(0, upperIndex - 1)];
  if (upper.age === lower.age) return upper.bsa;
  return lower.bsa + ((age - lower.age) / (upper.age - lower.age)) * (upper.bsa - lower.bsa);
}

function formatAge(ageYears: number) {
  return Number.isInteger(ageYears) ? String(ageYears) : ageYears.toFixed(1);
}

export function getPediatricBsaFallback(stage: PediatricStage, ageYears?: number): PediatricBsaFallback {
  const hasAge = ageYears !== undefined && Number.isFinite(ageYears) && ageYears >= 0;
  const representativeAge = hasAge
    ? Math.min(PEDIATRIC_BSA_ANCHORS[PEDIATRIC_BSA_ANCHORS.length - 1].age, ageYears!)
    : PEDIATRIC_STAGE_DEFAULT_AGES[stage];

  return {
    bsa: interpolatePediatricBsa(representativeAge),
    assumedAge: hasAge
      ? `age ${formatAge(representativeAge)} years fallback`
      : `representative ${formatAge(representativeAge)}-year-old`,
    ageRange: PEDIATRIC_STAGE_RANGES[stage],
    isAgeSpecific: hasAge,
  };
}

export const PEDIATRIC_BSA_DEFAULTS: Record<PediatricStage, PediatricBsaFallback> = {
  older: getPediatricBsaFallback('older'),
  younger: getPediatricBsaFallback('younger'),
  infant: getPediatricBsaFallback('infant'),
};

export function pediatricStageForAge(ageYears: number): PediatricStage {
  if (ageYears < 3) return 'infant';
  if (ageYears < 6) return 'younger';
  return 'older';
}
