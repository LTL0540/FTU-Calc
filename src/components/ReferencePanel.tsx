import { BookOpen } from 'lucide-react';
import { PROTOCOL_PRESETS } from '../data/protocolPresets';
import type { ProtocolPreset } from '../types/calculator';
import { formatNumber } from '../lib/unitConversions';

type Props = {
  onPreset: (preset: ProtocolPreset) => void;
  activePresetIds: string[];
};

export function ReferencePanel({ onPreset, activePresetIds }: Props) {
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
            return (
              <button
                key={preset.id}
                className={`preset-card${active ? ' active' : ''}`}
                aria-pressed={active}
                aria-label={`${preset.label}: add ${formatNumber(preset.handprints)} handprints, ${formatNumber(preset.ftu)} FTU`}
                onClick={() => onPreset(preset)}
              >
                <strong>{preset.label}</strong>
                <span>{formatNumber(preset.handprints)} handprints · {formatNumber(preset.ftu)} FTU</span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}
