import { useState } from 'react';
import { Check, Clipboard, ShieldAlert } from 'lucide-react';
import type { DisplayUnit } from '../types/calculator';
import {
  buildCalculationSummary,
  formatDisplayQuantity,
  formatPackageComposition,
  type ResultPresentation,
} from '../lib/resultPresentation';
import { formatNumber } from '../lib/unitConversions';
import { EstimateNotice, ResultDetailDisclosures, ResultIssueList } from './ResultDetails';

type Props = {
  presentation: ResultPresentation;
  displayUnit: DisplayUnit;
};

export function ResultsPanel({ presentation, displayUnit }: Props) {
  const [copied, setCopied] = useState(false);
  const { result } = presentation;
  const displayedPackageText = formatPackageComposition(result);
  const summary = buildCalculationSummary(presentation);
  const quantity = (grams: number, practical = false) => formatDisplayQuantity(grams, displayUnit, practical);
  const copy = async () => {
    if (result.status.isBlocking) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <aside className="results-column" aria-label="Calculation results">
      <section className="results-card card">
        <div className="results-header">
          <div><span className="eyebrow">Detailed estimate</span><h2>Calculation summary</h2></div>
        </div>
        <ResultIssueList issues={result.status.issues} />
        <div key={`${result.suggestedDispensedGrams}-${result.finalRequiredGrams}-${result.status.isBlocking}`} className={`hero-result quantity-updated${result.status.isBlocking ? ' blocked-result' : ''}`}>
          <strong>{result.status.isBlocking ? 'Review inputs' : quantity(result.suggestedDispensedGrams, true)}</strong>
          <span>{displayedPackageText}</span>
        </div>
        <div className="result-metrics">
          <div><span>Per application</span><strong>{result.status.isBlocking ? '—' : quantity(result.formulationAdjustedGramsPerApplication)}</strong><small>{formatNumber(result.ftuPerApplication, 2)} FTU</small></div>
          <div><span>Calculated need</span><strong>{result.status.isBlocking ? '—' : quantity(result.finalRequiredGrams)}</strong><small>{formatNumber(result.totalApplications, 2)} applications</small></div>
          <div><span>Estimated area</span><strong>{formatNumber(result.approximateBsaPercent, 2)}% BSA</strong><small>{formatNumber(presentation.selectedHandprints, 2)} adult HP eq.</small></div>
        </div>
        <div className="summary-box" aria-label={`Calculation summary. ${summary}`}><span className="eyebrow">Copyable summary</span><p>{summary}</p></div>
        <div className="result-actions">
          <button type="button" className="primary-button" onClick={copy} disabled={result.status.isBlocking}>
            {result.status.isBlocking ? <><ShieldAlert size={18} />Resolve issues to copy</> : <>{copied ? <Check size={18} /> : <Clipboard size={18} />}{copied ? 'Copied' : 'Copy summary'}</>}
          </button>
        </div>
        <ResultDetailDisclosures presentation={presentation} displayUnit={displayUnit} />
        <EstimateNotice />
      </section>
    </aside>
  );
}
