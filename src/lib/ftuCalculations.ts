import { CLINICAL_CONSTANTS } from '../config/clinical';
import type { CalculatorInputs, CalculatorResult } from '../types/calculator';
import { gramsToOunces } from './unitConversions';
import { optimizePackages } from './packageOptimization';
import { CALCULATION_LIMITS, deduplicateIssues, validateInputs } from './validation';

function blockedResult(inputs: CalculatorInputs, issues = validateInputs(inputs)): CalculatorResult {
  return {
    approximateBsaPercent: 0,
    ftuPerApplication: 0,
    baseGramsPerApplication: 0,
    bsaRatio: 1,
    sizeAdjustedGramsPerApplication: 0,
    formulationAdjustedGramsPerApplication: 0,
    totalApplications: 0,
    exactTreatmentGrams: 0,
    allowanceGrams: 0,
    finalRequiredGrams: 0,
    finalRequiredOunces: 0,
    suggestedPackages: [],
    suggestedDispensedGrams: 0,
    excessGrams: 0,
    status: { isBlocking: true, issues: deduplicateIssues(issues) },
  };
}

export function calculateFtu(inputs: CalculatorInputs): CalculatorResult {
  const inputIssues = validateInputs(inputs);
  if (inputIssues.some((issue) => issue.severity === 'blocking')) return blockedResult(inputs, inputIssues);

  const approximateBsaPercent = inputs.selectedBsaPercent ?? inputs.selectedHandprints * CLINICAL_CONSTANTS.bsaPercentPerHandprint;
  const ftuPerApplication = inputs.selectedFtu ?? inputs.selectedHandprints / CLINICAL_CONSTANTS.handprintsPerFtu;
  const baseGramsPerApplication = ftuPerApplication * CLINICAL_CONSTANTS.gramsPerFtu;
  const bsaRatio = inputs.applyBsaAdjustment
    ? inputs.patientBsa! / inputs.referenceBsa
    : 1;
  const sizeAdjustedGramsPerApplication = baseGramsPerApplication * bsaRatio;
  const formulationFactor = inputs.applyFormulationFactor ? inputs.formulationFactor : 1;
  const formulationAdjustedGramsPerApplication = sizeAdjustedGramsPerApplication * formulationFactor;
  const totalApplications = inputs.totalApplications ?? (inputs.applicationsPerWeek !== undefined
    ? inputs.applicationsPerWeek * (inputs.durationDays / 7)
    : (inputs.applicationsPerDay ?? 0) * inputs.durationDays);
  if (
    !Number.isFinite(totalApplications)
    || totalApplications <= 0
    || totalApplications > CALCULATION_LIMITS.maxTotalApplications
  ) {
    return blockedResult(inputs, [...inputIssues, {
      code: 'schedule.total.invalid',
      message: `Total applications must be finite, greater than zero, and no more than ${CALCULATION_LIMITS.maxTotalApplications}.`,
      severity: 'blocking',
    }]);
  }
  const calculatedTreatmentGrams = formulationAdjustedGramsPerApplication * totalApplications;
  const exactTreatmentGrams = Math.max(calculatedTreatmentGrams, inputs.minimumTreatmentGrams ?? 0);
  const allowanceGrams = exactTreatmentGrams * (inputs.allowancePercent / 100);
  const finalRequiredGrams = exactTreatmentGrams + allowanceGrams;
  if (
    !Number.isFinite(finalRequiredGrams)
    || finalRequiredGrams < 0
    || finalRequiredGrams > CALCULATION_LIMITS.maxTreatmentGrams
  ) {
    return blockedResult(inputs, [...inputIssues, {
      code: 'calculation.quantity.invalid',
      message: `Calculated treatment quantity must be finite, nonnegative, and no more than ${CALCULATION_LIMITS.maxTreatmentGrams} g.`,
      severity: 'blocking',
    }]);
  }
  const recommendation = optimizePackages(finalRequiredGrams, inputs.enabledPackageSizes);
  if (!recommendation.valid) {
    return blockedResult(inputs, [...inputIssues, {
      code: 'packages.optimization.invalid',
      message: recommendation.issue ?? 'Package optimization could not be completed safely.',
      severity: 'blocking',
    }]);
  }

  return {
    approximateBsaPercent,
    ftuPerApplication,
    baseGramsPerApplication,
    bsaRatio,
    sizeAdjustedGramsPerApplication,
    formulationAdjustedGramsPerApplication,
    totalApplications,
    exactTreatmentGrams,
    allowanceGrams,
    finalRequiredGrams,
    finalRequiredOunces: gramsToOunces(finalRequiredGrams),
    suggestedPackages: recommendation.packages,
    suggestedDispensedGrams: recommendation.totalGrams,
    excessGrams: recommendation.excessGrams,
    status: { isBlocking: false, issues: inputIssues },
  };
}

export const handprintsToFtu = (handprints: number) => handprints / 2;
export const handprintsToGrams = (handprints: number) => handprints * 0.25;
export const handprintsToBsaPercent = (handprints: number) => handprints * 0.8;
export const bsaPercentToHandprints = (bsaPercent: number) => bsaPercent / 0.8;
export const gramsToHandprints = (grams: number) => grams / 0.25;
export const ftuToHandprints = (ftu: number) => ftu * 2;
