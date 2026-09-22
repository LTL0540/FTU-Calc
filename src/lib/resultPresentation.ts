import type {
  BodyRegion,
  CalculatorResult,
  DisplayUnit,
  PatientMode,
  PediatricStage,
} from '../types/calculator';
import type { PediatricFtuReference } from '../data/pediatricFtu';
import { formatGrams, formatNumber, formatOunces } from './unitConversions';

export const ESTIMATE_NOTICE = 'Beta estimate only. Independently verify the treatment area, regimen, patient-size adjustment, calculation, and available package sizes before prescribing or dispensing. QuantiDerm does not replace clinical judgment or product-specific guidance.';

export type ResultPresentation = {
  result: CalculatorResult;
  regions: BodyRegion[];
  selectedHandprints: number;
  // Known inputs remain available even when the calculation returns blocked outputs.
  selectedFtu?: number;
  selectedBsaPercent?: number;
  plannedApplications?: number;
  areaDescription: string;
  activePresetLabels: string[];
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  heightCm?: number;
  weightKg?: number;
  effectiveBsa?: number;
  referenceBsa: number;
  applyBsa: boolean;
  frequencyLabel: string;
  durationLabel: string;
  allowancePercent: number;
  pediatricFtuReference?: PediatricFtuReference;
};

export function formatPackageComposition(result: CalculatorResult): string {
  if (result.status.isBlocking) return 'Recommendation blocked';
  return result.suggestedPackages.length
    ? result.suggestedPackages.map((value) => `${formatNumber(value, 1)} g`).join(' + ')
    : 'No package configured';
}

export function formatDisplayQuantity(grams: number, displayUnit: DisplayUnit, practical = false): string {
  const gramText = practical ? `${formatNumber(grams, 1)} g` : formatGrams(grams);
  if (displayUnit === 'g') return gramText;
  if (displayUnit === 'oz') return formatOunces(grams);
  return `${gramText} / ${formatOunces(grams)}`;
}

export function patientModelLabel(patientMode: PatientMode, pediatricStage: PediatricStage): string {
  if (patientMode === 'adult') return 'Adult';
  if (pediatricStage === 'older') return 'Older child';
  if (pediatricStage === 'younger') return 'Younger child';
  return 'Infant';
}

export function formatKnownInput(value: number | undefined, suffix = ''): string {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? `${formatNumber(value, 2)}${suffix}`
    : '—';
}

export function buildPatientContext(presentation: ResultPresentation): string {
  const model = presentation.patientMode === 'child' && presentation.pediatricFtuReference
    ? `Child · ${presentation.pediatricFtuReference.label}`
    : patientModelLabel(presentation.patientMode, presentation.pediatricStage);
  return `${model} · ${presentation.applyBsa ? 'BSA adjustment on' : 'BSA adjustment off'}`;
}

export function buildRegimenContext(presentation: ResultPresentation): string {
  return `${presentation.frequencyLabel} · ${presentation.durationLabel}${presentation.allowancePercent > 0 ? ` · ${formatNumber(presentation.allowancePercent, 1)}% extra` : ''}`;
}

export function formatBsaStatus(presentation: ResultPresentation): string {
  if (!presentation.applyBsa) return 'Off (1.000×)';
  const measured = presentation.effectiveBsa
    ? `${formatNumber(presentation.effectiveBsa, 2)} m² measured`
    : 'Measured BSA unavailable';
  if (presentation.result.status.isBlocking) return `${measured} · ${formatNumber(presentation.referenceBsa, 2)} m² reference; adjustment unavailable while blocked`;
  return `${measured} ÷ ${formatNumber(presentation.referenceBsa, 2)} m² reference = ${presentation.result.bsaRatio.toFixed(3)}×`;
}

export function buildCalculationSummary(presentation: ResultPresentation): string {
  const { result } = presentation;
  const packageComposition = formatPackageComposition(result);
  const model = patientModelLabel(presentation.patientMode, presentation.pediatricStage);
  const pediatricBand = presentation.patientMode === 'child' && presentation.pediatricFtuReference
    ? ` Pediatric regional reference: ${presentation.pediatricFtuReference.label}.`
    : '';
  const clinicalContext = `Patient model: ${model}.${pediatricBand} BSA adjustment: ${formatBsaStatus(presentation)}. Regimen: ${presentation.frequencyLabel.toLowerCase()} for ${presentation.durationLabel}; ${formatNumber(presentation.allowancePercent, 1)}% extra supply.`;

  if (result.status.isBlocking) {
    const issues = result.status.issues.map((issue) => issue.message).join(' ');
    return `Calculation blocked. ${issues} Treatment area: ${presentation.areaDescription}. ${clinicalContext} No dispensing recommendation is available until the blocking inputs are resolved. ${ESTIMATE_NOTICE}`;
  }

  return `Apply to ${presentation.areaDescription} ${presentation.frequencyLabel.toLowerCase()} for ${presentation.durationLabel}. ${clinicalContext} Estimated amount per application: ${formatNumber(result.ftuPerApplication, 2)} FTU (${formatNumber(result.formulationAdjustedGramsPerApplication, 2)} g). Estimated treatment requirement: ${formatNumber(result.finalRequiredGrams, 2)} g. Suggested quantity to dispense: ${formatNumber(result.suggestedDispensedGrams, 1)} g (${packageComposition}). ${ESTIMATE_NOTICE}`;
}

export function buildConciseResultAnnouncement(presentation: ResultPresentation): string {
  if (presentation.result.status.isBlocking) return 'Calculation blocked. Review the highlighted input issues.';
  if (presentation.result.ftuPerApplication <= 0) return '';
  return `Estimate updated. Suggested dispense ${formatNumber(presentation.result.suggestedDispensedGrams, 1)} grams; calculated need ${formatNumber(presentation.result.finalRequiredGrams, 2)} grams.`;
}

export function shouldShowMobileResults(presentation: ResultPresentation): boolean {
  return presentation.result.ftuPerApplication > 0 || presentation.result.status.issues.length > 0;
}
