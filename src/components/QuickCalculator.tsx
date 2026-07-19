import { Info } from 'lucide-react';
import type { AreaMode } from '../types/calculator';
import { bsaPercentToHandprints, ftuToHandprints, gramsToHandprints, handprintsToBsaPercent, handprintsToFtu, handprintsToGrams } from '../lib/ftuCalculations';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  mode: AreaMode;
  handprints: number;
  onChange: (handprints: number) => void;
};

export function QuickCalculator({ mode, handprints, onChange }: Props) {
  const bsa = handprintsToBsaPercent(handprints);
  const grams = handprintsToGrams(handprints);
  const ftu = handprintsToFtu(handprints);
  const safe = (value: number) => onChange(Math.max(0, value));

  return (
    <div className="quick-calculator">
      <div className="quick-note"><Info size={18} /><span>All four values stay synchronized using the supplied adult handprint reference.</span></div>
      <div className="quick-grid">
        <label className={mode === 'handprints' ? 'featured-field' : ''}>
          <span>Patient handprints affected</span>
          <input type="number" min="0" step="0.1" value={formatNumber(handprints, 2)} onChange={(event) => safe(Number(event.target.value))} />
          <small>1 handprint = 0.8% BSA</small>
        </label>
        <label className={mode === 'bsa' ? 'featured-field' : ''}>
          <span>Estimated BSA affected</span>
          <div className="unit-input"><input type="number" min="0" max="100" step="0.1" value={formatNumber(bsa, 2)} onChange={(event) => safe(bsaPercentToHandprints(Number(event.target.value)))} /><span>%</span></div>
          <small>Uses 0.8% per handprint</small>
        </label>
        <label>
          <span>Grams per application override</span>
          <div className="unit-input"><input type="number" min="0" step="0.01" value={formatNumber(grams, 2)} onChange={(event) => safe(gramsToHandprints(Number(event.target.value)))} /><span>g</span></div>
          <small>0.25 g per handprint</small>
        </label>
        <label>
          <span>FTU per application override</span>
          <div className="unit-input"><input type="number" min="0" step="0.1" value={formatNumber(ftu, 2)} onChange={(event) => safe(ftuToHandprints(Number(event.target.value)))} /><span>FTU</span></div>
          <small>2 handprints per FTU</small>
        </label>
      </div>
    </div>
  );
}
