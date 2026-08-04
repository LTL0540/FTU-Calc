import type { CalculatorInputs, ClinicalIssue } from '../types/calculator';

export const CALCULATION_LIMITS = {
  maxHandprints: 125,
  maxFtuPerApplication: 100,
  maxApplicationsPerDay: 100,
  maxApplicationsPerWeek: 700,
  maxTotalApplications: 10_000,
  maxAllowancePercent: 100,
  maxFormulationFactor: 10,
  maxPackageSizes: 100,
  maxPackageSizeGrams: 10_000,
  maxTreatmentGrams: 10_000,
  bsaRatio: { min: 0.5, max: 1.5 },
} as const;

const blocking = (code: string, message: string): ClinicalIssue => ({ code, message, severity: 'blocking' });

function finiteNonnegative(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

export function deduplicateIssues(issues: ClinicalIssue[]): ClinicalIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.severity}:${issue.code}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateInputs(inputs: CalculatorInputs): ClinicalIssue[] {
  const issues: ClinicalIssue[] = [...(inputs.upstreamIssues ?? [])];
  const selectedBsaPercent = inputs.selectedBsaPercent
    ?? (Number.isFinite(inputs.selectedHandprints) ? inputs.selectedHandprints * 0.8 : Number.NaN);
  const selectedFtu = inputs.selectedFtu
    ?? (Number.isFinite(inputs.selectedHandprints) ? inputs.selectedHandprints / 2 : Number.NaN);

  if (!Number.isFinite(inputs.selectedHandprints) || inputs.selectedHandprints < 0) {
    issues.push(blocking('area.handprints.invalid', 'Selected handprint area must be a finite, nonnegative number.'));
  } else if (inputs.selectedHandprints > CALCULATION_LIMITS.maxHandprints) {
    issues.push(blocking('area.handprints.excessive', `Selected handprints exceed the supported maximum of ${CALCULATION_LIMITS.maxHandprints}.`));
  }
  if (!Number.isFinite(selectedFtu) || selectedFtu < 0 || selectedFtu > CALCULATION_LIMITS.maxFtuPerApplication) {
    issues.push(blocking('area.ftu.invalid', `FTU per application must be finite and between 0 and ${CALCULATION_LIMITS.maxFtuPerApplication}.`));
  }
  if (!Number.isFinite(selectedBsaPercent) || selectedBsaPercent < 0 || selectedBsaPercent > 100.01) {
    issues.push(blocking('area.bsa.invalid', 'Estimated treatment area must be finite and no greater than 100% BSA.'));
  }

  if (!finiteNonnegative(inputs.heightCm)) {
    issues.push(blocking('patient.height.invalid', 'Height must be a finite, nonnegative number.'));
  }
  if (!finiteNonnegative(inputs.weightKg)) {
    issues.push(blocking('patient.weight.invalid', 'Weight must be a finite, nonnegative number.'));
  }

  if (!Number.isFinite(inputs.durationDays) || inputs.durationDays <= 0) {
    issues.push(blocking('schedule.duration.invalid', 'Treatment duration must be a finite number greater than zero.'));
  }
  const frequency = inputs.applicationsPerDay ?? inputs.applicationsPerWeek;
  if (!Number.isFinite(frequency) || (frequency ?? 0) <= 0) {
    issues.push(blocking('schedule.frequency.invalid', 'Application frequency must be a finite number greater than zero.'));
  }
  if (
    inputs.applicationsPerDay !== undefined
    && inputs.applicationsPerDay > CALCULATION_LIMITS.maxApplicationsPerDay
  ) {
    issues.push(blocking('schedule.daily.excessive', `Applications per day exceed the supported maximum of ${CALCULATION_LIMITS.maxApplicationsPerDay}.`));
  }
  if (
    inputs.applicationsPerWeek !== undefined
    && inputs.applicationsPerWeek > CALCULATION_LIMITS.maxApplicationsPerWeek
  ) {
    issues.push(blocking('schedule.weekly.excessive', `Applications per week exceed the supported maximum of ${CALCULATION_LIMITS.maxApplicationsPerWeek}.`));
  }
  if (
    inputs.totalApplications !== undefined
    && (!Number.isFinite(inputs.totalApplications)
      || inputs.totalApplications <= 0
      || inputs.totalApplications > CALCULATION_LIMITS.maxTotalApplications)
  ) {
    issues.push(blocking('schedule.total.invalid', `Total applications must be finite, greater than zero, and no more than ${CALCULATION_LIMITS.maxTotalApplications}.`));
  }

  if (
    !Number.isFinite(inputs.allowancePercent)
    || inputs.allowancePercent < 0
    || inputs.allowancePercent > CALCULATION_LIMITS.maxAllowancePercent
  ) {
    issues.push(blocking('allowance.invalid', `Extra supply allowance must be finite and between 0% and ${CALCULATION_LIMITS.maxAllowancePercent}%.`));
  }
  if (
    inputs.minimumTreatmentGrams !== undefined
    && (!Number.isFinite(inputs.minimumTreatmentGrams) || inputs.minimumTreatmentGrams < 0)
  ) {
    issues.push(blocking('minimum.invalid', 'Minimum treatment quantity must be a finite, nonnegative number.'));
  }
  if (
    inputs.applyFormulationFactor
    && (!Number.isFinite(inputs.formulationFactor)
      || inputs.formulationFactor <= 0
      || inputs.formulationFactor > CALCULATION_LIMITS.maxFormulationFactor)
  ) {
    issues.push(blocking('formulation.factor.invalid', `Formulation adjustment factor must be finite, greater than zero, and no more than ${CALCULATION_LIMITS.maxFormulationFactor}.`));
  }

  if (inputs.applyBsaAdjustment) {
    if (
      inputs.patientBsa === undefined
      || !Number.isFinite(inputs.patientBsa)
      || inputs.patientBsa <= 0
      || !Number.isFinite(inputs.referenceBsa)
      || inputs.referenceBsa <= 0
    ) {
      issues.push(blocking('bsa.adjustment.missing', 'BSA adjustment requires valid measured and reference BSA values.'));
    } else {
      const ratio = inputs.patientBsa / inputs.referenceBsa;
      if (
        !Number.isFinite(ratio)
        || ratio < CALCULATION_LIMITS.bsaRatio.min
        || ratio > CALCULATION_LIMITS.bsaRatio.max
      ) {
        issues.push(blocking(
          'bsa.adjustment.ratio',
          `BSA adjustment ratio ${Number.isFinite(ratio) ? ratio.toFixed(3) : 'is invalid'} is outside the supported ${CALCULATION_LIMITS.bsaRatio.min.toFixed(2)}–${CALCULATION_LIMITS.bsaRatio.max.toFixed(2)} range; adjustment has been blocked.`,
        ));
      }
    }
  }

  if (inputs.enabledPackageSizes.length > CALCULATION_LIMITS.maxPackageSizes) {
    issues.push(blocking('packages.count.excessive', `No more than ${CALCULATION_LIMITS.maxPackageSizes} package sizes may be optimized at once.`));
  }
  if (inputs.enabledPackageSizes.some((size) => !Number.isFinite(size) || size < 0.1 || size > CALCULATION_LIMITS.maxPackageSizeGrams)) {
    issues.push(blocking('packages.size.invalid', `Package sizes must be finite and between 0.1 and ${CALCULATION_LIMITS.maxPackageSizeGrams} g.`));
  }

  return deduplicateIssues(issues);
}
