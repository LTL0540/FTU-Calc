import { useEffect, useRef, useState } from 'react';
import { Calculator } from 'lucide-react';
import type { PatientMode, PediatricStage } from '../types/calculator';
import { calculateMostellerBsa, feetInchesToCm, poundsToKg } from '../lib/bsa';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  pediatricBsaDefault?: { bsa: number; assumedAge: string; ageRange: string };
  age: string;
  heightCm?: number;
  weightKg?: number;
  referenceBsa: number;
  applyBsa: boolean;
  onPatientModeChange: (value: PatientMode) => void;
  onPediatricStageChange: (value: PediatricStage) => void;
  onAgeChange: (value: string) => void;
  onHeightChange: (value?: number) => void;
  onWeightChange: (value?: number) => void;
  onReferenceBsaChange: (value: number) => void;
  onApplyBsaChange: (value: boolean) => void;
};

type DecimalMeasurementProps = {
  ariaLabel: string;
  placeholder: string;
  value?: number;
  onChange: (value?: number) => void;
};

function DecimalMeasurement({ ariaLabel, placeholder, value, onChange }: DecimalMeasurementProps) {
  const focused = useRef(false);
  const [draft, setDraft] = useState(value === undefined ? '' : value.toFixed(1));

  useEffect(() => {
    if (!focused.current) setDraft(value === undefined ? '' : value.toFixed(1));
  }, [value]);

  return <input
    className="measurement-input"
    aria-label={ariaLabel}
    type="text"
    inputMode="decimal"
    placeholder={placeholder}
    value={draft}
    onFocus={() => { focused.current = true; }}
    onChange={(event) => {
      const next = event.target.value;
      if (!/^\d*(?:\.\d*)?$/.test(next)) return;
      setDraft(next);
      if (next === '') onChange(undefined);
      else {
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange(parsed);
      }
    }}
    onBlur={() => {
      focused.current = false;
      const parsed = Number(draft);
      if (draft === '' || !Number.isFinite(parsed) || parsed <= 0) {
        setDraft('');
        onChange(undefined);
        return;
      }
      const rounded = Math.round(parsed * 10) / 10;
      setDraft(rounded.toFixed(1));
      onChange(rounded);
    }}
  />;
}

export function PatientSizePanel(props: Props) {
  const calculatedBsa = calculateMostellerBsa(props.heightCm, props.weightKg);
  const effectiveBsa = calculatedBsa ?? props.pediatricBsaDefault?.bsa;
  const ratio = effectiveBsa && effectiveBsa > 0 ? effectiveBsa / props.referenceBsa : undefined;
  const bsaSource = calculatedBsa !== undefined
      ? 'From height + weight'
      : props.pediatricBsaDefault
        ? props.pediatricBsaDefault.assumedAge
        : undefined;
  const heightFeet = props.heightCm ? Math.floor(props.heightCm / 30.48) : undefined;
  const heightInches = props.heightCm ? (props.heightCm / 2.54) - (heightFeet! * 12) : undefined;
  const numericAge = props.age.trim() === '' ? undefined : Number(props.age);

  return (
    <section className={`card section-card patient-panel ${props.patientMode === 'child' ? 'child-emphasis' : ''}`}>
      <div className="section-heading patient-heading">
        <div className="patient-heading-main"><div className="icon-tile"><Calculator size={19} /></div><h2>Patient size</h2></div>
        <div className="segmented compact-toggle patient-mode-toggle" role="group" aria-label="Patient model">
          <button className={props.patientMode === 'adult' ? 'active' : ''} onClick={() => props.onPatientModeChange('adult')} aria-pressed={props.patientMode === 'adult'}>Adult</button>
          <button className={props.patientMode === 'child' ? 'active' : ''} onClick={() => props.onPatientModeChange('child')} aria-pressed={props.patientMode === 'child'}>Child</button>
        </div>
        <label className="header-bsa-switch">
          <span>Adjust by BSA</span>
          <input type="checkbox" role="switch" aria-label="Adjust quantity for patient body surface area" checked={props.applyBsa} onChange={(event) => props.onApplyBsaChange(event.target.checked)} />
        </label>
      </div>
      {props.patientMode === 'child' && (
        <div className="pediatric-stage-control">
          <span>Pediatric model</span>
          <div className="segmented pediatric-stage-toggle" role="group" aria-label="Pediatric model proportions">
            {(['older', 'younger', 'infant'] as PediatricStage[]).map((stage) => {
              const stageDefault = stage === props.pediatricStage ? props.pediatricBsaDefault : undefined;
              const label = stage === 'older' ? 'Older child' : stage === 'younger' ? 'Younger child' : 'Infant';
              return <button key={stage} className={props.pediatricStage === stage ? 'active' : ''} onClick={() => props.onPediatricStageChange(stage)} aria-pressed={props.pediatricStage === stage}><span>{label}</span><small>{stageDefault?.ageRange ?? (stage === 'older' ? '6–10+ yr' : stage === 'younger' ? '3–5 yr' : '0–2 yr')}</small></button>;
            })}
          </div>
          {props.pediatricBsaDefault && <p className="pediatric-assumption">Uses <strong>{props.pediatricBsaDefault.bsa.toFixed(2)} m²</strong> ({props.pediatricBsaDefault.assumedAge}) when measurements are unavailable. Age selects a band automatically and refines the fallback within that range; measured height and weight take priority.{numericAge !== undefined && numericAge > 10 ? ' For ages over 10, enter measured size when possible.' : ''}</p>}
        </div>
      )}
      <div className={`patient-field-grid${props.patientMode === 'child' ? ' has-age' : ''}`}>
        {props.patientMode === 'child' && (
          <label className="age-field"><span>Age <small>(years)</small></span><input aria-label="Age in years" type="number" inputMode="decimal" min="0" step="0.1" placeholder="e.g. 4" value={props.age} onChange={(event) => props.onAgeChange(event.target.value)} /></label>
        )}
        <div className="compound-field height-field">
          <div className="field-label"><span>Height</span><div className="mini-tabs"><span className="active">cm</span><span>ft / in</span></div></div>
          <div className="measurement-row">
            <div className="unit-input"><DecimalMeasurement ariaLabel="Height in centimetres" placeholder="cm" value={props.heightCm} onChange={props.onHeightChange} /><span>cm</span></div>
            <span className="or-label">or</span>
            <div className="unit-input compact"><input className="measurement-input" aria-label="Height feet" type="number" min="0" step="1" placeholder="ft" value={heightFeet ?? ''} onChange={(event) => props.onHeightChange(feetInchesToCm(Number(event.target.value || 0), heightInches || 0))} /><span>ft</span></div>
            <div className="unit-input compact"><DecimalMeasurement ariaLabel="Height inches" placeholder="in" value={heightInches} onChange={(value) => props.onHeightChange(value === undefined && !heightFeet ? undefined : feetInchesToCm(heightFeet || 0, value || 0))} /><span>in</span></div>
          </div>
        </div>
        <div className="compound-field weight-field">
          <div className="field-label"><span>Weight</span><div className="mini-tabs"><span className="active">kg</span><span>lb</span></div></div>
          <div className="measurement-row">
            <div className="unit-input"><DecimalMeasurement ariaLabel="Weight in kilograms" placeholder="kg" value={props.weightKg} onChange={props.onWeightChange} /><span>kg</span></div>
            <span className="or-label">or</span>
            <div className="unit-input"><DecimalMeasurement ariaLabel="Weight in pounds" placeholder="lb" value={props.weightKg ? props.weightKg / 0.45359237 : undefined} onChange={(value) => props.onWeightChange(value === undefined ? undefined : poundsToKg(value))} /><span>lb</span></div>
          </div>
        </div>
      </div>
      <div className="bsa-readout">
        <div><span>Patient BSA</span><strong>{effectiveBsa ? `${formatNumber(effectiveBsa, 2)} m²` : '—'}</strong>{bsaSource && <small>{bsaSource}</small>}</div>
        <div><span>Reference BSA</span><strong>{formatNumber(props.referenceBsa, 2)} m²</strong></div>
        <div><span>Adjustment ratio</span><strong>{ratio ? `${formatNumber(ratio, 3)}×` : '—'}</strong></div>
      </div>
      <details className="inline-details"><summary>Advanced BSA settings</summary><label><span>Reference adult BSA</span><div className="unit-input narrow"><input type="number" min="0.1" step="0.01" value={props.referenceBsa} onChange={(event) => props.onReferenceBsaChange(Math.max(0.1, Number(event.target.value)))} /><span>m²</span></div></label></details>
    </section>
  );
}
