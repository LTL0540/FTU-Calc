import { ShieldAlert, TriangleAlert } from 'lucide-react';
import type { ClinicalIssue, DisplayUnit } from '../types/calculator';
import {
  ESTIMATE_NOTICE,
  formatBsaStatus,
  formatDisplayQuantity,
  formatPackageComposition,
  patientModelLabel,
  type ResultPresentation,
} from '../lib/resultPresentation';
import { formatGrams, formatNumber } from '../lib/unitConversions';

export function ResultIssueList({ issues, compact = false }: { issues: ClinicalIssue[]; compact?: boolean }) {
  if (!issues.length) return null;
  return (
    <div className={`warning-stack${compact ? ' compact-warning-stack' : ''}`} aria-label="Calculation issues">
      {issues.map((issue) => (
        <div className={`warning ${issue.severity}`} key={`${issue.severity}:${issue.code}`}>
          {issue.severity === 'blocking' ? <ShieldAlert size={18} aria-hidden="true" /> : <TriangleAlert size={18} aria-hidden="true" />}
          <span><strong>{issue.severity === 'blocking' ? 'Resolve before use' : 'Check this estimate'}</strong>{issue.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ResultDetailDisclosures({ presentation, displayUnit }: { presentation: ResultPresentation; displayUnit: DisplayUnit }) {
  const { result } = presentation;
  const selectedRegions = presentation.regions.filter((region) => region.selectedFraction > 0);
  const packageComposition = formatPackageComposition(result);
  const modelLabel = patientModelLabel(presentation.patientMode, presentation.pediatricStage);
  const quantity = (grams: number, practical = false) => formatDisplayQuantity(grams, displayUnit, practical);

  return (
    <>
      <details className="calculation-details">
        <summary>Calculation details</summary>
        <div className="calculation-steps">
          <div><span>Status</span><strong>{result.status.isBlocking ? 'Blocked — resolve input issues' : result.status.issues.length ? 'Estimate available with warnings' : 'Estimate available'}</strong></div>
          <div><span>Selected area</span><strong>{formatNumber(result.approximateBsaPercent, 2)}% BSA · {formatNumber(presentation.selectedHandprints, 2)} adult handprint equivalents</strong></div>
          {presentation.activePresetLabels.length > 0 && <div><span>Combined preset surfaces</span><strong>{presentation.activePresetLabels.join('; ')}</strong></div>}
          {presentation.patientMode === 'child' && presentation.pediatricFtuReference && <div><span>Pediatric regional reference</span><strong>{presentation.pediatricFtuReference.label}</strong></div>}
          <div><span>Base amount per application</span><strong>{result.status.isBlocking ? 'Unavailable while blocked' : `${formatNumber(result.ftuPerApplication, 2)} FTU × 0.5 g = ${formatGrams(result.baseGramsPerApplication)}`}</strong></div>
          <div><span>BSA adjustment</span><strong>{formatBsaStatus(presentation)}</strong></div>
          <div><span>Regimen</span><strong>{presentation.frequencyLabel} · {presentation.durationLabel} · {formatNumber(result.totalApplications, 2)} applications</strong></div>
          <div><span>Estimated treatment quantity</span><strong>{result.status.isBlocking ? 'Unavailable while blocked' : formatGrams(result.exactTreatmentGrams)}</strong></div>
          <div><span>Extra supply buffer</span><strong>{formatNumber(presentation.allowancePercent, 1)}%{result.status.isBlocking ? '' : ` · + ${formatGrams(result.allowanceGrams)} = ${formatGrams(result.finalRequiredGrams)}`}</strong></div>
          <div className="total-step"><span>Suggested quantity to dispense</span><strong>{result.status.isBlocking ? 'Recommendation blocked' : `${packageComposition} · ${quantity(result.suggestedDispensedGrams, true)}`}</strong></div>
        </div>
      </details>
      <details className="calculation-details">
        <summary>Clinical summary &amp; safety</summary>
        <div className="clinical-summary">
          <h3>Area</h3>
          {presentation.activePresetLabels.length > 0 && <p><strong>Combined presets:</strong> {presentation.activePresetLabels.join('; ')}</p>}
          {selectedRegions.length ? <ul>{selectedRegions.map((region) => <li key={region.id}>{region.label}: {formatNumber(region.selectedFraction * 100, 0)}%</li>)}</ul> : <p>{presentation.areaDescription}</p>}
          <dl><div><dt>Adult handprint equivalents</dt><dd>{formatNumber(presentation.selectedHandprints, 2)}</dd></div><div><dt>Approx. treated BSA</dt><dd>{formatNumber(result.approximateBsaPercent, 2)}%</dd></div><div><dt>FTU / application</dt><dd>{formatNumber(result.ftuPerApplication, 2)}</dd></div></dl>
          <h3>Patient adjustment</h3>
          <dl><div><dt>Model</dt><dd>{modelLabel}</dd></div>{presentation.patientMode === 'child' && presentation.pediatricFtuReference && <div><dt>Pediatric band</dt><dd>{presentation.pediatricFtuReference.label}</dd></div>}<div><dt>Height / weight</dt><dd>{presentation.heightCm ? `${formatNumber(presentation.heightCm, 1)} cm` : '—'} / {presentation.weightKg ? `${formatNumber(presentation.weightKg, 1)} kg` : '—'}</dd></div><div><dt>Measured BSA</dt><dd>{presentation.effectiveBsa ? `${formatNumber(presentation.effectiveBsa, 2)} m²` : '—'}</dd></div><div><dt>BSA status / ratio</dt><dd>{formatBsaStatus(presentation)}</dd></div></dl>
          <h3>Regimen and supply</h3>
          <dl><div><dt>Frequency</dt><dd>{presentation.frequencyLabel}</dd></div><div><dt>Duration</dt><dd>{presentation.durationLabel}</dd></div><div><dt>Total applications</dt><dd>{formatNumber(result.totalApplications, 2)}</dd></div><div><dt>Extra supply buffer</dt><dd>{formatNumber(presentation.allowancePercent, 1)}%</dd></div><div><dt>Package composition</dt><dd>{packageComposition}</dd></div></dl>
        </div>
      </details>
    </>
  );
}

export function EstimateNotice() {
  return <p className="clinical-disclaimer" role="note"><strong>Beta v0.9 — estimate only.</strong> {ESTIMATE_NOTICE.replace('Beta estimate only. ', '')}</p>;
}
