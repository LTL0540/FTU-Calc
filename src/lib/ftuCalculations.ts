import { CLINICAL_CONSTANTS } from '../config/clinical';
import type { CalculatorInputs, CalculatorResult } from '../types/calculator';
import { gramsToOunces } from './unitConversions';
import { optimizePackages } from './packageOptimization';

export function calculateFtu(inputs: CalculatorInputs): CalculatorResult {
  const approximateBsaPercent = inputs.selectedHandprints * CLINICAL_CONSTANTS.bsaPercentPerHandprint;
  const ftuPerApplication = inputs.selectedHandprints / CLINICAL_CONSTANTS.handprintsPerFtu;
  const baseGramsPerApplication = inputs.selectedHandprints * CLINICAL_CONSTANTS.gramsPerHandprint;
  const bsaRatio = inputs.applyBsaAdjustment && inputs.patientBsa !== undefined && inputs.patientBsa > 0 && inputs.referenceBsa > 0
    ? inputs.patientBsa / inputs.referenceBsa
    : 1;
  const sizeAdjustedGramsPerApplication = baseGramsPerApplication * bsaRatio;
  const formulationFactor = inputs.applyFormulationFactor ? inputs.formulationFactor : 1;
  const formulationAdjustedGramsPerApplication = sizeAdjustedGramsPerApplication * formulationFactor;
  const totalApplications = inputs.applicationsPerWeek !== undefined
    ? inputs.applicationsPerWeek * (inputs.durationDays / 7)
    : (inputs.applicationsPerDay ?? 0) * inputs.durationDays;
  const calculatedTreatmentGrams = formulationAdjustedGramsPerApplication * totalApplications;
  const exactTreatmentGrams = Math.max(calculatedTreatmentGrams, inputs.minimumTreatmentGrams ?? 0);
  const allowanceGrams = exactTreatmentGrams * (inputs.allowancePercent / 100);
  const finalRequiredGrams = exactTreatmentGrams + allowanceGrams;
  const recommendation = optimizePackages(finalRequiredGrams, inputs.enabledPackageSizes);

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
  };
}

export const handprintsToFtu = (handprints: number) => handprints / 2;
export const handprintsToGrams = (handprints: number) => handprints * 0.25;
export const handprintsToBsaPercent = (handprints: number) => handprints * 0.8;
export const bsaPercentToHandprints = (bsaPercent: number) => bsaPercent / 0.8;
export const gramsToHandprints = (grams: number) => grams / 0.25;
export const ftuToHandprints = (ftu: number) => ftu * 2;
