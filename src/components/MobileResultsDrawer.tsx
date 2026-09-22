import { useState } from 'react';
import { Check, ChevronUp, Clipboard, ShieldAlert, TriangleAlert } from 'lucide-react';
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
  onDisplayUnitChange: (unit: DisplayUnit) => void;
};

export function MobileResultsDrawer({ presentation, displayUnit, onDisplayUnitChange }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const { result } = presentation;
  const issues = result.status.issues;
  const firstIssue = issues.find((issue) => issue.severity === 'blocking') ?? issues[0];
  const summary = buildCalculationSummary(presentation);
  const packageComposition = formatPackageComposition(result);
  const quantity = (grams: number, practical = false) => formatDisplayQuantity(grams, displayUnit, practical);
  const copy = async () => {
    if (result.status.isBlocking) return;
    const copied = await copyText(summary);
    setCopyStatus(copied ? 'copied' : 'failed');
    window.setTimeout(() => setCopyStatus('idle'), 2400);
  };

  return (
    <aside className={`mobile-result-dock${issues.length ? ' has-issues' : ''}${result.status.isBlocking ? ' is-blocked' : ''}`} aria-label="Mobile calculation results">
      {firstIssue && (
        <div className={`mobile-result-alert-strip ${firstIssue.severity}`}>
          {firstIssue.severity === 'blocking' ? <ShieldAlert size={18} aria-hidden="true" /> : <TriangleAlert size={18} aria-hidden="true" />}
          <span><strong>{firstIssue.severity === 'blocking' ? 'Recommendation blocked' : 'Check this estimate'}</strong>{firstIssue.message}{issues.length > 1 && <small>+{issues.length - 1} more {issues.length === 2 ? 'issue' : 'issues'} in expanded results</small>}</span>
        </div>
      )}
      <details className="mobile-result-drawer">
        <summary aria-label="Show or hide calculation results">
          <span className="mobile-result-summary-value"><small>Suggested dispense</small><strong>{result.status.isBlocking ? 'Review inputs' : quantity(result.suggestedDispensedGrams, true)}</strong><em>{packageComposition}</em></span>
          <span className="mobile-result-summary-value"><small>Calculated need</small><strong>{result.status.isBlocking ? 'Unavailable' : quantity(result.finalRequiredGrams)}</strong></span>
          <span className="mobile-result-cue" aria-hidden="true"><ChevronUp size={18} /><small>Details</small></span>
          <ResultContext presentation={presentation} />
        </summary>
        <div className="mobile-result-content">
          <ResultIssueList issues={issues} compact />
          <div className="segmented compact-toggle" role="group" aria-label="Display units">
            <button type="button" className={displayUnit === 'g' ? 'active' : ''} onClick={() => onDisplayUnitChange('g')} aria-pressed={displayUnit === 'g'}>Grams</button>
            <button type="button" className={displayUnit === 'oz' ? 'active' : ''} onClick={() => onDisplayUnitChange('oz')} aria-pressed={displayUnit === 'oz'}>Ounces</button>
            <button type="button" className={displayUnit === 'both' ? 'active' : ''} onClick={() => onDisplayUnitChange('both')} aria-pressed={displayUnit === 'both'}>Both</button>
          </div>
          <ResultMetrics presentation={presentation} displayUnit={displayUnit} className="mobile-result-metrics" />
          <div className="mobile-summary-box"><span>Equivalent copy summary</span><p>{summary}</p></div>
          <button type="button" className="mobile-copy-button" onClick={copy} disabled={result.status.isBlocking}>
            {result.status.isBlocking
              ? <><ShieldAlert size={16} />Resolve issues to copy</>
              : copyStatus === 'copied'
                ? <><Check size={16} />Copied</>
                : copyStatus === 'failed'
                  ? <><TriangleAlert size={16} />Copy failed — try again</>
                  : <><Clipboard size={16} />Copy summary</>}
          </button>
          <ResultDetailDisclosures presentation={presentation} displayUnit={displayUnit} />
          <EstimateNotice />
        </div>
      </details>
    </aside>
  );
}
