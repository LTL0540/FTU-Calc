import { useState } from 'react';
import { Check, Clipboard, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { DisplayUnit } from '../types/calculator';
import {
  buildCalculationSummary,
  formatDisplayQuantity,
  formatPackageComposition,
  type ResultPresentation,
} from '../lib/resultPresentation';
import { copyText } from '../lib/clipboard';
import { EstimateNotice, ResultContext, ResultDetailDisclosures, ResultIssueList, ResultMetrics } from './ResultDetails';

type Props = {
  presentation: ResultPresentation;
  displayUnit: DisplayUnit;
};

export function ResultsPanel({ presentation, displayUnit }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const { result } = presentation;
  const isEmpty = !result.status.isBlocking && result.ftuPerApplication <= 0;
  const displayedPackageText = formatPackageComposition(result);
  const summary = buildCalculationSummary(presentation);
  const quantity = (grams: number, practical = false) => formatDisplayQuantity(grams, displayUnit, practical);
  const copy = async () => {
    if (result.status.isBlocking) return;
    const copied = await copyText(summary);
    setCopyStatus(copied ? 'copied' : 'failed');
    window.setTimeout(() => setCopyStatus('idle'), 2400);
  };

  return (
    <aside className="results-column" aria-label="Calculation results">
      <section className="results-card card">
        <div className="results-header">
          <div><h2>Calculation summary</h2></div>
        </div>
        <ResultIssueList issues={result.status.issues} />
        <ResultContext presentation={presentation} />
        <div key={`${result.suggestedDispensedGrams}-${result.finalRequiredGrams}-${result.status.isBlocking}`} className={`hero-result quantity-updated${result.status.isBlocking ? ' blocked-result' : ''}${isEmpty ? ' empty-result' : ''}`}>
          <strong>{result.status.isBlocking ? 'Review inputs' : isEmpty ? 'Select an area' : quantity(result.suggestedDispensedGrams, true)}</strong>
          <span>{isEmpty ? 'Choose a common area above or paint the affected region.' : displayedPackageText}</span>
        </div>
        {!isEmpty && <ResultMetrics presentation={presentation} displayUnit={displayUnit} />}
        {!isEmpty && <><details className="summary-preview"><summary>Copyable summary</summary><p>{summary}</p></details>
        <div className="result-actions">
          <button type="button" className="primary-button" onClick={copy} disabled={result.status.isBlocking}>
            {result.status.isBlocking
              ? <><ShieldAlert size={18} />Resolve issues to copy</>
              : copyStatus === 'copied'
                ? <><Check size={18} />Copied</>
                : copyStatus === 'failed'
                  ? <><TriangleAlert size={18} />Copy failed — try again</>
                  : <><Clipboard size={18} />Copy summary</>}
          </button>
        </div>
        <ResultDetailDisclosures presentation={presentation} displayUnit={displayUnit} /></>}
        <EstimateNotice />
      </section>
    </aside>
  );
}
