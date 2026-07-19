import { Hand } from 'lucide-react';
import { bsaPercentToHandprints, handprintsToBsaPercent } from '../lib/ftuCalculations';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  enabled: boolean;
  handprints: number;
  onChange: (value: number) => void;
  onClear: () => void;
};

export function HandprintOverride({ enabled, handprints, onChange, onClear }: Props) {
  const bsaPercent = handprintsToBsaPercent(handprints);

  return (
    <details className="card settings-card handprint-card">
      <summary><span><Hand size={18} /> Handprints &amp; BSA</span><small>{enabled ? `${formatNumber(handprints, 2)} HP · ${formatNumber(bsaPercent, 2)}%` : 'Optional'}</small></summary>
      <div className="handprint-settings">
        <p>Enter either value to replace the painted-area total. Both fields stay synchronized.</p>
        <div className="area-override-grid">
          <label><span>Handprints</span><input type="number" min="0" step="0.1" value={formatNumber(handprints, 2)} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} /></label>
          <label><span>Estimated BSA</span><div className="unit-input"><input type="number" min="0" max="100" step="0.1" value={formatNumber(bsaPercent, 2)} onChange={(event) => onChange(Math.max(0, bsaPercentToHandprints(Number(event.target.value))))} /><span>%</span></div></label>
        </div>
        {enabled && <button className="secondary-button" onClick={onClear}>Use painted area instead</button>}
      </div>
    </details>
  );
}
