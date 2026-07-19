import { describe, expect, it } from 'vitest';
import { createBodyRegions } from './bodyRegions';
import { PROTOCOL_PRESETS } from './protocolPresets';

describe('anatomical protocol presets', () => {
  it.each(PROTOCOL_PRESETS)('$label maps to its supplied handprint total', (preset) => {
    const regions = createBodyRegions();
    const selected = regions.filter((region) => preset.regionIds.includes(region.id));
    expect(selected).toHaveLength(preset.regionIds.length);
    expect(selected.reduce((sum, region) => sum + region.adultHandprints, 0)).toBeCloseTo(preset.handprints, 8);
  });

  it.each([
    { label: 'face and neck', ids: ['face', 'anterior-neck', 'posterior-neck'], handprints: 5, ftu: 2.5 },
    { label: 'scalp', ids: ['front-scalp', 'posterior-scalp'], handprints: 6, ftu: 3 },
    { label: 'anterior trunk', ids: ['upper-chest', 'abdomen'], handprints: 14, ftu: 7 },
    { label: 'posterior trunk including buttocks', ids: ['upper-back', 'lower-back', 'buttocks'], handprints: 14, ftu: 7 },
    { label: 'one arm excluding hand', ids: ['left-upper-arm-front', 'left-forearm-front', 'left-upper-arm-back', 'left-forearm-back'], handprints: 6, ftu: 3 },
    { label: 'one hand both surfaces', ids: ['left-hand-front', 'left-hand-back'], handprints: 2, ftu: 1 },
    { label: 'one leg excluding foot', ids: ['left-thigh-front', 'left-lower-leg-front', 'left-thigh-back', 'left-lower-leg-back'], handprints: 12, ftu: 6 },
    { label: 'one foot both surfaces', ids: ['left-foot-front', 'left-foot-back'], handprints: 4, ftu: 2 },
    { label: 'genital region', ids: ['groin'], handprints: 1, ftu: 0.5 },
  ])('$label sums to the rounded consensus reference', ({ ids, handprints, ftu }) => {
    const regions = createBodyRegions().filter((region) => ids.includes(region.id));
    const total = regions.reduce((sum, region) => sum + region.adultHandprints, 0);
    expect(total).toBeCloseTo(handprints, 8);
    expect(total / 2).toBeCloseTo(ftu, 8);
  });

  it('whole-model regional totals stay conservatively close to the approximately 40 FTU clinical check', () => {
    const totalFtu = createBodyRegions().reduce((sum, region) => sum + region.adultHandprints, 0) / 2;
    expect(totalFtu).toBe(44);
  });
});
