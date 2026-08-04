import type { ClinicalIssue, PatientMode } from '../types/calculator';

// Absolute data-entry bounds prevent non-finite or physiologically impossible
// values while still allowing very small infants. Narrower age-aware ranges
// below generate review warnings rather than rejecting a legitimate outlier.
export const PATIENT_SIZE_LIMITS = {
  heightCm: { min: 20, max: 300 },
  weightKg: { min: 0.2, max: 600 },
  bsa: { min: 0.04, max: 5.5 },
} as const;

type PatientSizeOptions = {
  patientMode?: PatientMode;
  ageYears?: number;
  ageMonths?: number;
};

const issue = (code: string, message: string, severity: ClinicalIssue['severity']): ClinicalIssue => ({
  code,
  message,
  severity,
});

export function calculateMostellerBsa(heightCm?: number, weightKg?: number): number | undefined {
  if (
    heightCm === undefined
    || weightKg === undefined
    || !Number.isFinite(heightCm)
    || !Number.isFinite(weightKg)
    || heightCm <= 0
    || weightKg <= 0
  ) return undefined;
  const bsa = Math.sqrt((heightCm * weightKg) / 3600);
  return Number.isFinite(bsa) ? bsa : undefined;
}

function pediatricPlausibility(ageYears: number) {
  if (ageYears < 2) return { height: { min: 30, max: 120 }, weight: { min: 0.3, max: 35 }, label: 'an infant under 2 years' };
  if (ageYears <= 10) return { height: { min: 45, max: 180 }, weight: { min: 2, max: 150 }, label: 'a child aged 2–10 years' };
  return { height: { min: 70, max: 220 }, weight: { min: 5, max: 250 }, label: 'a child aged 11–17 years' };
}

export function assessPatientSize(heightCm?: number, weightKg?: number, options: PatientSizeOptions = {}) {
  const issues: ClinicalIssue[] = [];
  const ageYears = options.ageMonths !== undefined ? options.ageMonths / 12 : options.ageYears;

  if (options.patientMode === 'child' && ageYears !== undefined) {
    if (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 17) {
      issues.push(issue('patient.age.invalid', 'Pediatric age must be finite and between birth and 17 years.', 'blocking'));
    }
  }

  const heightIsValid = heightCm === undefined
    || (Number.isFinite(heightCm) && heightCm >= PATIENT_SIZE_LIMITS.heightCm.min && heightCm <= PATIENT_SIZE_LIMITS.heightCm.max);
  const weightIsValid = weightKg === undefined
    || (Number.isFinite(weightKg) && weightKg >= PATIENT_SIZE_LIMITS.weightKg.min && weightKg <= PATIENT_SIZE_LIMITS.weightKg.max);

  if (!heightIsValid) {
    issues.push(issue(
      'patient.height.bounds',
      `Height is outside the supported absolute range of ${PATIENT_SIZE_LIMITS.heightCm.min}–${PATIENT_SIZE_LIMITS.heightCm.max} cm.`,
      'blocking',
    ));
  }
  if (!weightIsValid) {
    issues.push(issue(
      'patient.weight.bounds',
      `Weight is outside the supported absolute range of ${PATIENT_SIZE_LIMITS.weightKg.min}–${PATIENT_SIZE_LIMITS.weightKg.max} kg.`,
      'blocking',
    ));
  }

  if (
    options.patientMode === 'child'
    && ageYears !== undefined
    && Number.isFinite(ageYears)
    && ageYears >= 0
    && ageYears <= 17
  ) {
    const expected = pediatricPlausibility(ageYears);
    if (heightCm !== undefined && heightIsValid && (heightCm < expected.height.min || heightCm > expected.height.max)) {
      issues.push(issue(
        'patient.height.age_mismatch',
        `Height is unusual for ${expected.label}; verify age and measurement before using BSA adjustment.`,
        'warning',
      ));
    }
    if (weightKg !== undefined && weightIsValid && (weightKg < expected.weight.min || weightKg > expected.weight.max)) {
      issues.push(issue(
        'patient.weight.age_mismatch',
        `Weight is unusual for ${expected.label}; verify age and measurement before using BSA adjustment.`,
        'warning',
      ));
    }
  }

  if (!heightIsValid || !weightIsValid || heightCm === undefined || weightKg === undefined) {
    return {
      bsa: undefined,
      rawBsa: undefined,
      issues,
      warnings: issues.map((entry) => entry.message),
    };
  }

  const rawBsa = calculateMostellerBsa(heightCm, weightKg);
  const bsaIsValid = rawBsa !== undefined
    && rawBsa >= PATIENT_SIZE_LIMITS.bsa.min
    && rawBsa <= PATIENT_SIZE_LIMITS.bsa.max;

  if (!bsaIsValid) {
    issues.push(issue(
      'patient.bsa.bounds',
      `Calculated BSA is outside the supported range of ${PATIENT_SIZE_LIMITS.bsa.min.toFixed(2)}–${PATIENT_SIZE_LIMITS.bsa.max.toFixed(2)} m²; BSA adjustment has been blocked.`,
      'blocking',
    ));
  }

  const isBlocking = issues.some((entry) => entry.severity === 'blocking');
  return {
    bsa: bsaIsValid && !isBlocking ? rawBsa : undefined,
    rawBsa,
    issues,
    warnings: issues.map((entry) => entry.message),
  };
}

export function resolvePatientBsa(manualBsa?: number, calculatedBsa?: number, pediatricDefaultBsa?: number): number | undefined {
  const candidates = [manualBsa, calculatedBsa, pediatricDefaultBsa];
  return candidates.find((value) => value !== undefined && Number.isFinite(value) && value > 0);
}

export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
export const poundsToKg = (pounds: number) => pounds * 0.45359237;

export function centimetersToFeetInches(centimeters?: number) {
  if (centimeters === undefined || !Number.isFinite(centimeters) || centimeters <= 0) {
    return { feet: undefined, inches: undefined };
  }
  const totalInches = centimeters / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}
