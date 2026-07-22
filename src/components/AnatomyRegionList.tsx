import { Fragment } from 'react';
import type { BodyRegion } from '../types/calculator';
import { formatNumber } from '../lib/unitConversions';
import type { PatientMode } from '../types/calculator';
import type { PediatricFtuReference } from '../data/pediatricFtu';
import { pediatricRegionFtu } from '../data/pediatricFtu';

type Props = {
  regions: BodyRegion[];
  onChange: (id: string, fraction: number) => void;
  onClear: () => void;
  patientMode?: PatientMode;
  pediatricFtuReference?: PediatricFtuReference;
};

export function AnatomyRegionList({ regions, onChange, onClear, patientMode = 'adult', pediatricFtuReference }: Props) {
  return (
    <div className="region-list-shell">
      <div className="list-headline">
        <div>
          <h3>Region checklist</h3>
          <p>Shares selections with the body painter. Percentages are not added twice.</p>
        </div>
        <button className="text-button" onClick={onClear}>Clear all</button>
      </div>
      <div className="region-table-wrap">
        <table className="region-table">
          <thead><tr><th>Region</th><th>Reference</th><th>% treated</th></tr></thead>
          <tbody>
            {(['front', 'back'] as const).map((view) => (
              <Fragment key={view}>
                <tr className="view-divider" key={`${view}-header`}><th colSpan={3}>{view === 'front' ? 'Front' : 'Back'} view</th></tr>
                {regions.filter((region) => region.view === view).map((region) => (
                  <tr key={region.id} className={region.selectedFraction > 0 ? 'selected-row' : ''}>
                    <td>
                      <label>
                        <input
                          type="checkbox"
                          checked={region.selectedFraction > 0}
                          onChange={(event) => onChange(region.id, event.target.checked ? 1 : 0)}
                        />
                        <span>{region.label}</span>
                      </label>
                    </td>
                    <td>{patientMode === 'child' && pediatricFtuReference
                      ? `${formatNumber(pediatricRegionFtu(region.id, pediatricFtuReference), 2)} FTU`
                      : `${formatNumber(region.adultHandprints / 2, 2)} FTU`}</td>
                    <td>
                      <div className="percent-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="20"
                          value={formatNumber(region.selectedFraction * 100, 0)}
                          onChange={(event) => onChange(region.id, Math.max(0, Math.min(100, Number(event.target.value))) / 100)}
                          aria-label={`Percentage of ${region.label} treated`}
                        />
                        <span>%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
