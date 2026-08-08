import { useEffect, useRef, useState } from 'react';
import { Calculator, TriangleAlert } from 'lucide-react';
import type { PatientMode, PediatricStage } from '../types/calculator';
import type { PediatricFtuReference } from '../data/pediatricFtu';
import { assessPatientSize, centimetersToFeetInches, feetInchesToCm, PATIENT_SIZE_LIMITS, poundsToKg } from '../lib/bsa';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  pediatricBsaDefault?: { bsa: number; assumedAge: string; ageRange: string };
  pediatricFtuReference?: PediatricFtuReference;
  age: string;
  ageMonths: string;
  heightCm?: number;
  weightKg?: number;
  referenceBsa: number;
  adultReferenceBsa: number;
  applyBsa: boolean;
  onPatientModeChange: (value: PatientMode) => void;
  onPediatricStageChange: (value: PediatricStage) => void;
  onAgeChange: (value: string) => void;
  onAgeMonthsChange: (value: string) => void;
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
  min?: number;
  max?: number;
  decimals?: number;
  integer?: boolean;
  allowOutOfRange?: boolean;
  onInvalid?: () => void;
};

function DecimalMeasurement({ ariaLabel, placeholder, value, onChange, min = 0, max = Number.POSITIVE_INFINITY, decimals = 1, integer = false, allowOutOfRange = false, onInvalid }: DecimalMeasurementProps) {
  const focused = useRef(false);
  const formatValue = (next?: number) => next === undefined ? '' : next.toFixed(decimals);
  const [draft, setDraft] = useState(formatValue(value));
  const parsedDraft = draft === '' ? undefined : Number(draft);
  const draftIsInvalid = parsedDraft !== undefined
    && (!Number.isFinite(parsedDraft) || parsedDraft < min || parsedDraft > max);

  useEffect(() => {
    if (!focused.current) setDraft(formatValue(value));
  }, [value, decimals]);

  return <input
    className="measurement-input"
    aria-label={ariaLabel}
    aria-invalid={draftIsInvalid || undefined}
    type="text"
    inputMode={integer ? 'numeric' : 'decimal'}
    placeholder={placeholder}
    value={draft}
    onFocus={() => { focused.current = true; }}
    onChange={(event) => {
      const next = event.target.value;
      if (!(integer ? /^\d*$/.test(next) : /^\d*(?:\.\d*)?$/.test(next))) return;
      setDraft(next);
      if (next === '') onChange(undefined);
      else {
        const parsed = Number(next);
        if (Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
        else if (Number.isFinite(parsed) && allowOutOfRange) onChange(parsed);
        else onInvalid?.();
      }
    }}
    onBlur={() => {
      focused.current = false;
      const parsed = Number(draft);
      if (draft === '') {
        setDraft('');
        onChange(undefined);
        return;
      }
      if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        if (!allowOutOfRange) setDraft(formatValue(value));
        return;
      }
      const factor = 10 ** decimals;
      const rounded = Math.round(parsed * factor) / factor;
      setDraft(rounded.toFixed(decimals));
      onChange(rounded);
    }}
  />;
}

export function PatientSizePanel(props: Props) {
  const [adjustmentOpen, setAdjustmentOpen] = useState(props.patientMode === 'child' || props.applyBsa || props.heightCm !== undefined || props.weightKg !== undefined);
  const [measurementUnit, setMeasurementUnit] = useState<'metric' | 'imperial'>('metric');
  const enteredAgeYears = props.age.trim() === '' ? undefined : Number(props.age);
  const enteredAgeMonths = props.ageMonths.trim() === '' ? undefined : Number(props.ageMonths);
  const sizeAssessment = assessPatientSize(props.heightCm, props.weightKg, {
    patientMode: props.patientMode,
    ageYears: enteredAgeYears,
    ageMonths: enteredAgeMonths,
  });
  const calculatedBsa = sizeAssessment.bsa;
  const ratio = calculatedBsa && calculatedBsa > 0 ? calculatedBsa / props.referenceBsa : undefined;
  const { feet: heightFeet, inches: heightInches } = centimetersToFeetInches(props.heightCm);
  const numericAge = enteredAgeMonths !== undefined ? enteredAgeMonths / 12 : enteredAgeYears;
  const maxPounds = Math.round((PATIENT_SIZE_LIMITS.weightKg.max / 0.45359237) * 10) / 10;
  const minPounds = Math.round((PATIENT_SIZE_LIMITS.weightKg.min / 0.45359237) * 10) / 10;
  const commitImperialHeight = (feet: number, inches: number) => {
    const centimeters = feetInchesToCm(feet, inches);
    if (centimeters >= PATIENT_SIZE_LIMITS.heightCm.min && centimeters <= PATIENT_SIZE_LIMITS.heightCm.max) {
      props.onHeightChange(centimeters);
    }
  };

  useEffect(() => {
    if (props.patientMode === 'child' || props.applyBsa) setAdjustmentOpen(true);
  }, [props.patientMode, props.applyBsa]);

  return (
    <section className={`card section-card patient-panel ${props.patientMode === 'child' ? 'child-emphasis' : ''}`}>
      <div className="section-heading patient-heading">
        <div className="patient-heading-main"><div className="icon-tile"><Calculator size={19} /></div><h2>Patient size</h2></div>
        <div className="segmented compact-toggle patient-mode-toggle" role="group" aria-label="Patient model">
          <button className={props.patientMode === 'adult' ? 'active' : ''} onClick={() => props.onPatientModeChange('adult')} aria-pressed={props.patientMode === 'adult'}>Adult</button>
          <button className={props.patientMode === 'child' ? 'active' : ''} onClick={() => props.onPatientModeChange('child')} aria-pressed={props.patientMode === 'child'}>Child</button>
        </div>
      </div>
      <details className="patient-adjustment-details" open={adjustmentOpen} onToggle={(event) => setAdjustmentOpen(event.currentTarget.open)}>
        <summary><span>Patient-size adjustment</span><small>{props.applyBsa ? 'On' : 'Optional'}</small></summary>
        <div className="patient-adjustment-body">
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
          {props.pediatricBsaDefault && <p className="pediatric-assumption">Uses the <strong>{props.pediatricFtuReference?.label}</strong> regional FTU table. Age selects the matching band. The representative BSA is <strong>{props.pediatricBsaDefault.bsa.toFixed(2)} m²</strong> and is used only as the reference when measured-size adjustment is on.{numericAge !== undefined && numericAge > 10 ? ' For ages over 10, the adult regional FTU reference is used.' : ''}</p>}
        </div>
      )}
      <div className={`patient-field-grid${props.patientMode === 'child' ? ' has-age' : ''}`}>
        {props.patientMode === 'child' && (
            <>
              <label className="age-field"><span>Age <small>(full years)</small></span><input aria-label="Age in full years" type="number" inputMode="numeric" min="0" max="17" step="1" placeholder="e.g. 4" value={props.age} onChange={(event) => { const next = event.target.value; if (next === '' || /^\d+$/.test(next)) props.onAgeChange(next); }} /></label>
              <label className="age-field"><span>Or age <small>(months, under 2)</small></span><input aria-label="Age in months for children under 2 years" type="number" inputMode="numeric" min="0" max="23" step="1" placeholder="e.g. 6" value={props.ageMonths} onChange={(event) => { const next = event.target.value; if (next === '' || /^\d+$/.test(next)) props.onAgeMonthsChange(next); }} /></label>
            </>
        )}
        <div className="compound-field height-field">
          <div className="field-label"><span>Height</span><div className="segmented measurement-unit-toggle" role="group" aria-label="Height units"><button type="button" className={measurementUnit === 'metric' ? 'active' : ''} onClick={() => setMeasurementUnit('metric')} aria-pressed={measurementUnit === 'metric'}>cm</button><button type="button" className={measurementUnit === 'imperial' ? 'active' : ''} onClick={() => setMeasurementUnit('imperial')} aria-pressed={measurementUnit === 'imperial'}>ft / in</button></div></div>
          <div className="measurement-row">
            {measurementUnit === 'metric'
              ? <div className="unit-input"><DecimalMeasurement ariaLabel="Height in centimetres" placeholder="cm" value={props.heightCm} min={PATIENT_SIZE_LIMITS.heightCm.min} max={PATIENT_SIZE_LIMITS.heightCm.max} allowOutOfRange onChange={props.onHeightChange} /><span>cm</span></div>
              : <><div className="unit-input compact"><DecimalMeasurement ariaLabel="Height feet" placeholder="ft" value={heightFeet} min={0} max={8} decimals={0} integer onInvalid={() => props.onHeightChange(undefined)} onChange={(value) => value === undefined ? props.onHeightChange(undefined) : commitImperialHeight(value, heightInches ?? 0)} /><span>ft</span></div><div className="unit-input compact"><DecimalMeasurement ariaLabel="Height inches" placeholder="in" value={heightInches} min={0} max={11.9} onInvalid={() => props.onHeightChange(undefined)} onChange={(value) => value === undefined && heightFeet === undefined ? props.onHeightChange(undefined) : commitImperialHeight(heightFeet ?? 0, value ?? 0)} /><span>in</span></div></>}
          </div>
        </div>
        <div className="compound-field weight-field">
          <div className="field-label"><span>Weight</span><div className="segmented measurement-unit-toggle" role="group" aria-label="Weight units"><button type="button" className={measurementUnit === 'metric' ? 'active' : ''} onClick={() => setMeasurementUnit('metric')} aria-pressed={measurementUnit === 'metric'}>kg</button><button type="button" className={measurementUnit === 'imperial' ? 'active' : ''} onClick={() => setMeasurementUnit('imperial')} aria-pressed={measurementUnit === 'imperial'}>lb</button></div></div>
          <div className="measurement-row">
            {measurementUnit === 'metric'
              ? <div className="unit-input"><DecimalMeasurement ariaLabel="Weight in kilograms" placeholder="kg" value={props.weightKg} min={PATIENT_SIZE_LIMITS.weightKg.min} max={PATIENT_SIZE_LIMITS.weightKg.max} allowOutOfRange onChange={props.onWeightChange} /><span>kg</span></div>
              : <div className="unit-input"><DecimalMeasurement ariaLabel="Weight in pounds" placeholder="lb" value={props.weightKg ? props.weightKg / 0.45359237 : undefined} min={minPounds} max={maxPounds} allowOutOfRange onChange={(value) => props.onWeightChange(value === undefined ? undefined : Math.round(poundsToKg(value) * 10) / 10)} /><span>lb</span></div>}
          </div>
        </div>
      </div>
      <div className="bsa-readout">
        <div><span>Measured BSA</span><strong>{calculatedBsa ? `${formatNumber(calculatedBsa, 2)} m²` : sizeAssessment.rawBsa ? 'Check entry' : '—'}</strong>{calculatedBsa && <small>From height + weight</small>}</div>
        <div><span>{props.patientMode === 'child' ? 'Age reference BSA' : 'Reference BSA'}</span><strong>{formatNumber(props.referenceBsa, 2)} m²</strong></div>
        <div><span>Adjustment ratio</span><strong>{ratio ? `${formatNumber(ratio, 3)}×` : '—'}</strong></div>
      </div>
      <label className="switch-row bsa-adjustment-switch">
        <input type="checkbox" role="switch" aria-label="Adjust quantity for patient body surface area" checked={props.applyBsa} disabled={!calculatedBsa && !props.applyBsa} onChange={(event) => props.onApplyBsaChange(event.target.checked)} />
        <span><strong>Adjust quantity for body surface area</strong><small>{calculatedBsa ? 'Uses the measured-to-reference BSA ratio shown above.' : 'Enter height and weight to enable this adjustment.'}</small></span>
      </label>
      <p className="pediatric-assumption">BSA adjustment remains off until selected. Mosteller BSA is an estimate and is less precise in neonates and infants; extreme measured-to-reference ratios are blocked for review.</p>
      {sizeAssessment.warnings.length > 0 && <div className="patient-size-warning"><TriangleAlert size={16} /><span>{sizeAssessment.warnings.join(' ')}</span></div>}
      {props.patientMode === 'adult' && <details className="inline-details"><summary>Advanced BSA settings</summary><label><span>Reference adult BSA</span><div className="unit-input narrow"><input type="number" min="0.1" step="0.01" value={props.adultReferenceBsa} onChange={(event) => props.onReferenceBsaChange(Math.max(0.1, Number(event.target.value)))} /><span>m²</span></div></label></details>}
        </div>
      </details>
    </section>
  );
}
