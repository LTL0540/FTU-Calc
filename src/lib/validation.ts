import { CLINICAL_CONSTANTS } from '../config/clinical';
import type { CalculatorInputs } from '../types/calculator';

export function validateInputs(inputs: CalculatorInputs): string[] {
  const warnings: string[] = [];
  if (inputs.selectedHandprints < 0) warnings.push('Selected area cannot be negative.');
  if (inputs.selectedHandprints * 0.8 > 100) warnings.push('Selected regions exceed 100% estimated BSA. Check for overlapping selections.');
  if (inputs.heightCm !== undefined && inputs.heightCm <= 0) warnings.push('Height must be greater than zero.');
  if (inputs.weightKg !== undefined && inputs.weightKg <= 0) warnings.push('Weight must be greater than zero.');
  if (inputs.patientBsa !== undefined && inputs.patientBsa <= 0) warnings.push('Manual or calculated BSA must be greater than zero.');
  if (inputs.durationDays <= 0) warnings.push('Treatment duration must be greater than zero.');
  if ((inputs.applicationsPerDay ?? inputs.applicationsPerWeek ?? 0) <= 0) warnings.push('Application frequency must be greater than zero.');
  if (inputs.applyBsaAdjustment && (!inputs.patientBsa || inputs.patientBsa <= 0)) warnings.push('BSA adjustment is enabled, but valid height and weight are missing.');
  if (inputs.applyFormulationFactor && inputs.formulationFactor <= 0) warnings.push('Formulation adjustment factor must be greater than zero.');
  return warnings;
}

export function quantityWarnings(finalGrams: number): string[] {
  return finalGrams > CLINICAL_CONSTANTS.largeQuantityWarningGrams
    ? ['This is a very large estimated quantity. Verify the selected area, frequency, duration, and adjustment settings.']
    : [];
}
