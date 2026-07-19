export type PatientMode = 'adult' | 'child';
export type PediatricStage = 'older' | 'younger' | 'infant';
export type DisplayUnit = 'g' | 'oz' | 'both';
export type Formulation = 'Cream' | 'Ointment' | 'Lotion' | 'Gel' | 'Other';
export type BodySide = 'left' | 'right' | 'midline' | 'bilateral';
export type BodyView = 'front' | 'back';
export type AreaMode = 'painter' | 'checklist' | 'handprints' | 'bsa';

export type BodyRegion = {
  id: string;
  label: string;
  side: BodySide;
  view: BodyView;
  adultHandprints: number;
  selectedFraction: number;
  paintedSegments: number[];
  paintAxis?: 'vertical' | 'horizontal';
  path: string;
  bounds: { x: number; y: number; width: number; height: number };
};

export type FrequencyId =
  | 'daily'
  | 'bid'
  | 'tid'
  | 'qid'
  | 'alternate'
  | 'weekly'
  | 'custom-day'
  | 'custom-week';

export type DurationUnit = 'days' | 'weeks' | 'months';

export type CalculatorInputs = {
  selectedHandprints: number;
  formulation: Formulation;
  formulationFactor: number;
  applyFormulationFactor: boolean;
  heightCm?: number;
  weightKg?: number;
  patientBsa?: number;
  referenceBsa: number;
  applyBsaAdjustment: boolean;
  applicationsPerDay?: number;
  applicationsPerWeek?: number;
  durationDays: number;
  allowancePercent: number;
  minimumTreatmentGrams?: number;
  enabledPackageSizes: number[];
};

export type CalculatorResult = {
  approximateBsaPercent: number;
  ftuPerApplication: number;
  baseGramsPerApplication: number;
  bsaRatio: number;
  sizeAdjustedGramsPerApplication: number;
  formulationAdjustedGramsPerApplication: number;
  totalApplications: number;
  exactTreatmentGrams: number;
  allowanceGrams: number;
  finalRequiredGrams: number;
  finalRequiredOunces: number;
  suggestedPackages: number[];
  suggestedDispensedGrams: number;
  excessGrams: number;
};

export type PackageSize = { id: string; grams: number; enabled: boolean };

export type ProtocolPreset = {
  id: string;
  label: string;
  regionIds: string[];
  handprints: number;
  ftu: number;
  gramsPerApplication: number;
  bid14Grams: number;
};
