import { Droplets } from 'lucide-react';
import type { Formulation } from '../types/calculator';
import { DEFAULT_FORMULATION_FACTORS } from '../config/clinical';

type Props = {
  formulation: Formulation;
  factor: number;
  applyFactor: boolean;
  onFormulationChange: (value: Formulation) => void;
  onFactorChange: (value: number) => void;
  onApplyFactorChange: (value: boolean) => void;
};

const formulations = Object.keys(DEFAULT_FORMULATION_FACTORS) as Formulation[];

export function FormulationPanel(props: Props) {
  return (
    <section className="card section-card">
      <div className="section-heading"><div className="icon-tile"><Droplets size={19} /></div><div><h2>Formulation</h2><p>Base FTU calculation applies to all vehicles</p></div></div>
      <div className="segmented formulation-tabs" role="group" aria-label="Formulation">
        {formulations.map((item) => <button key={item} className={props.formulation === item ? 'active' : ''} onClick={() => props.onFormulationChange(item)} aria-pressed={props.formulation === item}>{item}</button>)}
      </div>
      <label className="switch-row">
        <input type="checkbox" role="switch" checked={props.applyFactor} onChange={(event) => props.onApplyFactorChange(event.target.checked)} />
        <span><strong>Apply formulation adjustment</strong><small>Optional configurable allowance for product spreadability.</small></span>
      </label>
      {props.applyFactor && <label className="factor-field"><span>Adjustment factor</span><input type="number" min="0.01" step="0.01" value={props.factor} onChange={(event) => props.onFactorChange(Math.max(0.01, Number(event.target.value)))} /><small>{props.factor >= 1 ? `Adds ${Math.round((props.factor - 1) * 100)}%` : `Reduces by ${Math.round((1 - props.factor) * 100)}%`}</small></label>}
      <p className="footnote">Spreadability varies by product, vehicle, body site, skin condition, and application technique.</p>
    </section>
  );
}
