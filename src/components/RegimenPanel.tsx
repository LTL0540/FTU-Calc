import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { DurationUnit, FrequencyId } from '../types/calculator';
import { FREQUENCIES } from '../lib/schedule';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  frequency: FrequencyId;
  customApplications: number;
  durationValue: number;
  durationUnit: DurationUnit;
  allowancePercent: number;
  totalApplications: number;
  daysPerMonth: number;
  onFrequencyChange: (value: FrequencyId) => void;
  onCustomApplicationsChange: (value: number) => void;
  onDurationValueChange: (value: number) => void;
  onDurationUnitChange: (value: DurationUnit) => void;
  onAllowanceChange: (value: number) => void;
};

export function RegimenPanel(props: Props) {
  const custom = props.frequency === 'custom-day' || props.frequency === 'custom-week';
  const standardAllowances = [0, 5, 10, 15, 20];
  const [customAllowance, setCustomAllowance] = useState(!standardAllowances.includes(props.allowancePercent));
  useEffect(() => {
    if (standardAllowances.includes(props.allowancePercent)) setCustomAllowance(false);
  }, [props.allowancePercent]);
  return (
    <section className="card section-card">
      <div className="section-heading"><div className="icon-tile"><CalendarDays size={19} /></div><div><h2>Treatment schedule</h2><p>Supports fractional and intermittent regimens</p></div><div className="schedule-count"><span>Total applications</span><strong>{formatNumber(props.totalApplications, 2)}</strong></div></div>
      <div className="regimen-primary">
        <label><span>Frequency</span><select value={props.frequency} onChange={(event) => props.onFrequencyChange(event.target.value as FrequencyId)}>{FREQUENCIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>Duration</span><div className="duration-combo"><input aria-label="Treatment duration" type="number" min="0.01" step="0.5" value={props.durationValue} onChange={(event) => props.onDurationValueChange(Math.max(0.01, Number(event.target.value)))} /><select aria-label="Duration unit" value={props.durationUnit} onChange={(event) => props.onDurationUnitChange(event.target.value as DurationUnit)}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></label>
      </div>
      <div className="regimen-options">
        {custom && <label className="custom-applications"><span>Applications per {props.frequency === 'custom-week' ? 'week' : 'day'}</span><input type="number" min="0.01" step="0.1" value={props.customApplications} onChange={(event) => props.onCustomApplicationsChange(Math.max(0.01, Number(event.target.value)))} /></label>}
        <label className="buffer-inline"><span>Extra supply buffer</span><select value={customAllowance ? 'custom' : props.allowancePercent} onChange={(event) => { if (event.target.value === 'custom') { setCustomAllowance(true); if (standardAllowances.includes(props.allowancePercent)) props.onAllowanceChange(12); } else { setCustomAllowance(false); props.onAllowanceChange(Number(event.target.value)); } }}><option value="0">None</option><option value="5">5% extra</option><option value="10">10% extra</option><option value="15">15% extra</option><option value="20">20% extra</option><option value="custom">Custom</option></select></label>
        {customAllowance && <label className="custom-buffer"><span>Custom</span><div className="unit-input"><input type="number" min="0" step="1" value={props.allowancePercent} onChange={(event) => props.onAllowanceChange(Math.max(0, Number(event.target.value)))} /><span>%</span></div></label>}
      </div>
      {props.durationUnit === 'months' && <p className="footnote">Using {props.daysPerMonth} days per month.</p>}
    </section>
  );
}
