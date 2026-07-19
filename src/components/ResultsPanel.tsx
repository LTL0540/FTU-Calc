import { useMemo, useState } from 'react';
import { Check, Clipboard, TriangleAlert } from 'lucide-react';
import type { BodyRegion, CalculatorResult, DisplayUnit, PatientMode, PediatricStage } from '../types/calculator';
import { formatGrams, formatNumber, formatOunces } from '../lib/unitConversions';

type Props = {
  result: CalculatorResult;
  displayUnit: DisplayUnit;
  regions: BodyRegion[];
  selectedHandprints: number;
  areaDescription: string;
  activePresetLabels: string[];
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  heightCm?: number;
  weightKg?: number;
  effectiveBsa?: number;
  applyBsa: boolean;
  frequencyLabel: string;
  durationLabel: string;
  allowancePercent: number;
  warnings: string[];
  usingPediatricBsaDefault: boolean;
  pediatricBsaDefault?: { bsa: number; assumedAge: string; ageRange: string };
};

const packageText = (packages: number[]) => packages.length ? packages.map((value) => `${formatNumber(value, 1)} g`).join(' + ') : 'No package configured';

export function ResultsPanel(props: Props) {
  const [copied, setCopied] = useState(false);
  const displayedDispense = props.result.suggestedDispensedGrams;
  const displayedPackageText = packageText(props.result.suggestedPackages);
  const quantity = (grams: number, practical = false) => {
    const g = practical ? `${formatNumber(grams, 1)} g` : formatGrams(grams);
    if (props.displayUnit === 'g') return g;
    if (props.displayUnit === 'oz') return formatOunces(grams);
    return `${g} / ${formatOunces(grams)}`;
  };
  const bsaAssumption = props.usingPediatricBsaDefault && props.pediatricBsaDefault && props.applyBsa
    ? ` Size adjustment uses the ${props.pediatricBsaDefault.assumedAge} BSA assumption of ${formatNumber(props.pediatricBsaDefault.bsa, 2)} m².`
    : '';
  const summary = useMemo(() => `Apply to ${props.areaDescription} ${props.frequencyLabel.toLowerCase()} for ${props.durationLabel}. Estimated amount per application: ${formatNumber(props.result.ftuPerApplication, 2)} FTU (${formatNumber(props.result.formulationAdjustedGramsPerApplication, 2)} g). Estimated treatment requirement: ${formatNumber(props.result.finalRequiredGrams, 2)} g. Suggested quantity to dispense: ${displayedPackageText}.${bsaAssumption}`, [props.areaDescription, props.durationLabel, props.frequencyLabel, props.result, displayedPackageText, bsaAssumption]);
  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const selectedRegions = props.regions.filter((region) => region.selectedFraction > 0);
  const modelLabel = props.patientMode === 'adult'
    ? 'Adult'
    : props.pediatricStage === 'older' ? 'Older child' : props.pediatricStage === 'younger' ? 'Younger child' : 'Infant';

  return (
    <aside className="results-column" aria-label="Live calculation results">
      <section className="results-card card" aria-live="polite">
        <div className="results-header">
          <div><span className="eyebrow">Detailed estimate</span><h2>Calculation summary</h2></div>
        </div>
        <div key={`${displayedDispense}-${props.result.finalRequiredGrams}`} className="hero-result quantity-updated">
          <strong>{quantity(displayedDispense, true)}</strong>
          <span>{displayedPackageText}</span>
        </div>
        <div className="result-metrics">
          <div><span>Per application</span><strong>{quantity(props.result.formulationAdjustedGramsPerApplication)}</strong><small>{formatNumber(props.result.ftuPerApplication, 2)} FTU</small></div>
          <div><span>Exact requirement</span><strong>{quantity(props.result.finalRequiredGrams)}</strong><small>{formatNumber(props.result.totalApplications, 2)} applications</small></div>
          <div><span>Estimated area</span><strong>{formatNumber(props.result.approximateBsaPercent, 2)}% BSA</strong><small>{formatNumber(props.selectedHandprints, 2)} handprints</small></div>
        </div>
        {props.warnings.length > 0 && (
          <div className="warning-stack">
            {props.warnings.map((warning) => <div className="warning" key={warning}><TriangleAlert size={18} /><span>{warning}</span></div>)}
          </div>
        )}
        <div className="summary-box" tabIndex={0} aria-label={`Copyable calculation summary. ${summary}`}><span className="eyebrow">Copyable summary</span><p>{summary}</p></div>
        <div className="result-actions">
          <button className="primary-button" onClick={copy}>{copied ? <Check size={18} /> : <Clipboard size={18} />}{copied ? 'Copied' : 'Copy summary'}</button>
        </div>
        <details className="calculation-details">
          <summary>Calculation details</summary>
          <div className="calculation-steps">
            <div><span>Selected area</span><strong>{formatNumber(props.selectedHandprints, 2)} handprints</strong></div>
            {props.activePresetLabels.length > 0 && <div><span>Combined preset surfaces</span><strong>{props.activePresetLabels.join('; ')}</strong></div>}
            <div><span>Base amount per application</span><strong>{formatNumber(props.selectedHandprints, 2)} × 0.25 g = {formatGrams(props.result.baseGramsPerApplication)}</strong></div>
            <div><span>BSA adjustment</span><strong>{props.applyBsa ? `${formatGrams(props.result.baseGramsPerApplication)} × ${formatNumber(props.result.bsaRatio, 3)} = ${formatGrams(props.result.sizeAdjustedGramsPerApplication)}` : 'Not applied (1.00×)'}</strong></div>
            <div><span>Applications</span><strong>{formatNumber(props.result.totalApplications, 2)}</strong></div>
            <div><span>Estimated treatment quantity</span><strong>{formatGrams(props.result.exactTreatmentGrams)}</strong></div>
            <div><span>{props.allowancePercent}% extra supply</span><strong>+ {formatGrams(props.result.allowanceGrams)} = {formatGrams(props.result.finalRequiredGrams)}</strong></div>
            <div className="total-step"><span>Suggested quantity to dispense</span><strong>{displayedPackageText} · {quantity(displayedDispense, true)}</strong></div>
          </div>
        </details>
        <details className="calculation-details">
          <summary>Full clinical summary</summary>
          <div className="clinical-summary">
            <h3>Area</h3>
            {props.activePresetLabels.length > 0 && <p><strong>Combined presets:</strong> {props.activePresetLabels.join('; ')}</p>}
            {selectedRegions.length ? <ul>{selectedRegions.map((region) => <li key={region.id}>{region.label}: {formatNumber(region.selectedFraction * 100, 0)}%</li>)}</ul> : <p>{props.areaDescription}</p>}
            <dl><div><dt>Handprints</dt><dd>{formatNumber(props.selectedHandprints, 2)}</dd></div><div><dt>Approx. treated BSA</dt><dd>{formatNumber(props.result.approximateBsaPercent, 2)}%</dd></div><div><dt>FTU / application</dt><dd>{formatNumber(props.result.ftuPerApplication, 2)}</dd></div></dl>
            <h3>Patient adjustment</h3>
            <dl><div><dt>Model</dt><dd>{modelLabel}</dd></div><div><dt>Height / weight</dt><dd>{props.heightCm ? `${formatNumber(props.heightCm, 1)} cm` : '—'} / {props.weightKg ? `${formatNumber(props.weightKg, 1)} kg` : '—'}</dd></div><div><dt>BSA</dt><dd>{props.effectiveBsa ? `${formatNumber(props.effectiveBsa, 2)} m²` : '—'}</dd></div><div><dt>Adjustment</dt><dd>{props.applyBsa ? `${formatNumber(props.result.bsaRatio, 3)}×` : 'Off'}</dd></div></dl>
            <h3>Regimen</h3>
            <dl><div><dt>Frequency</dt><dd>{props.frequencyLabel}</dd></div><div><dt>Duration</dt><dd>{props.durationLabel}</dd></div><div><dt>Total applications</dt><dd>{formatNumber(props.result.totalApplications, 2)}</dd></div></dl>
          </div>
        </details>
        <p className="clinical-disclaimer" role="note">Estimate only. Double-check the calculation, prescribed regimen, and available package sizes. This tool does not replace clinical judgment or product-specific guidance.</p>
      </section>
    </aside>
  );
}
