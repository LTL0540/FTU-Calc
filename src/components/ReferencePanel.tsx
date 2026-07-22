import { BookOpen } from 'lucide-react';
import { PROTOCOL_PRESETS } from '../data/protocolPresets';
import type { PatientMode, ProtocolPreset } from '../types/calculator';
import type { PediatricFtuReference } from '../data/pediatricFtu';
import { pediatricRegionFtu } from '../data/pediatricFtu';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  onPreset: (preset: ProtocolPreset) => void;
  activePresetIds: string[];
  patientMode: PatientMode;
  pediatricFtuReference: PediatricFtuReference;
};

export function ReferencePanel({ onPreset, activePresetIds, patientMode, pediatricFtuReference }: Props) {
  const selectedCount = activePresetIds.length;

  return (
    <details className="reference-section reference-disclosure embedded-reference">
      <summary className="reference-summary">
        <div className="section-heading">
          <div className="icon-tile"><BookOpen size={18} /></div>
          <div><h2>Presets</h2></div>
        </div>
        <span>{selectedCount ? `${selectedCount} selected` : `${PROTOCOL_PRESETS.length} regions`}</span>
      </summary>
      <div className="reference-body">
        <div className="preset-grid" aria-label="Add treatment-area presets">
          {PROTOCOL_PRESETS.map((preset) => {
            const active = activePresetIds.includes(preset.id);
            const displayedFtu = patientMode === 'child'
              ? preset.regionIds.reduce((sum, id) => sum + pediatricRegionFtu(id, pediatricFtuReference), 0)
              : preset.ftu;
            return (
              <button
                key={preset.id}
                className={`preset-card${active ? ' active' : ''}`}
                aria-pressed={active}
                aria-label={`${preset.label}: add ${formatNumber(displayedFtu, 2)} FTU for the current patient model`}
                onClick={() => onPreset(preset)}
              >
                <strong>{preset.label}</strong>
                <span>{formatNumber(displayedFtu, 2)} FTU{patientMode === 'child' ? ` · ${pediatricFtuReference.label}` : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}
