import { describe, expect, it } from 'vitest';
import { createBodyRegions } from '../data/bodyRegions';
import { getPairedRegionId, mirrorSegmentIndex, resizePaintedSegments } from './anatomyPairing';

describe('front and back anatomy pairing', () => {
  it('maps paired regions symmetrically across views', () => {
    const regions = createBodyRegions();
    regions.forEach((region) => {
      const pairedId = getPairedRegionId(region.id);
      if (!pairedId) return;
      const paired = regions.find((candidate) => candidate.id === pairedId);
      expect(paired).toBeDefined();
      expect(paired?.view).not.toBe(region.view);
      expect(getPairedRegionId(pairedId)).toBe(region.id);
    });
  });

  it('reverses side-to-side zones and preserves top-to-bottom zones', () => {
    expect(mirrorSegmentIndex({ paintAxis: 'horizontal' }, { paintAxis: 'horizontal' }, 0)).toBe(4);
    expect(mirrorSegmentIndex({}, {}, 1)).toBe(1);
  });

  it('changes zone count while preserving existing painted zones where possible', () => {
    expect(resizePaintedSegments([1, 3], 3)).toEqual([0, 1, 3]);
    expect(resizePaintedSegments([0, 1, 3], 2)).toEqual([0, 1]);
    expect(resizePaintedSegments([0, 1], 8)).toEqual([0, 1, 2, 3, 4]);
  });
});
