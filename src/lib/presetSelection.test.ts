import { describe, expect, it } from 'vitest';
import { createBodyRegions } from '../data/bodyRegions';
import { PROTOCOL_PRESETS } from '../data/protocolPresets';
import { addTreatmentAreaPreset } from './presetSelection';

describe('treatment-area preset selection', () => {
  it('adds only area state and preserves existing selections for later presets', () => {
    const face = PROTOCOL_PRESETS.find((preset) => preset.id === 'face-neck')!;
    const trunk = PROTOCOL_PRESETS.find((preset) => preset.id === 'anterior-trunk')!;
    const first = addTreatmentAreaPreset(createBodyRegions(), [], face);
    const second = addTreatmentAreaPreset(first.regions, first.activePresetIds, trunk);

    expect(second.activePresetIds).toEqual(['face-neck', 'anterior-trunk']);
    expect(second.regions.filter((region) => region.selectedFraction > 0).map((region) => region.id).sort()).toEqual([
      ...face.regionIds,
      ...trunk.regionIds,
    ].sort());
  });
});
