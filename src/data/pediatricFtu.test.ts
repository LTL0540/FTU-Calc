import { describe, expect, it } from 'vitest';
import { createBodyRegions } from './bodyRegions';
import { pediatricFtuReferenceFor, pediatricRegionFtu, selectedPediatricFtu } from './pediatricFtu';

const sumIds = (ids: string[], age: number) => {
  const reference = pediatricFtuReferenceFor('younger', age);
  return ids.reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0);
};

describe('pediatric age-region FTU references', () => {
  it.each([
    [0.5, 1, 1, 1.5, 1, 1.5],
    [1, 1.5, 1.5, 2, 2, 3],
    [4, 1.5, 2, 3, 3, 3.5],
    [8, 2, 2.5, 4.5, 3.5, 5],
    [11, 2.5, 4, 8, 7, 7],
  ])('maps age %s to the published full-region values', (age, face, arm, leg, front, back) => {
    expect(sumIds(['face', 'anterior-neck', 'posterior-neck'], age)).toBeCloseTo(face);
    expect(sumIds(['left-upper-arm-front', 'left-forearm-front', 'left-upper-arm-back', 'left-forearm-back', 'left-hand-front', 'left-hand-back'], age)).toBeCloseTo(arm);
    expect(sumIds(['left-thigh-front', 'left-lower-leg-front', 'left-thigh-back', 'left-lower-leg-back', 'left-foot-front', 'left-foot-back'], age)).toBeCloseTo(leg);
    expect(sumIds(['upper-chest', 'abdomen'], age)).toBeCloseTo(front);
    expect(sumIds(['upper-back', 'lower-back', 'buttocks'], age)).toBeCloseTo(back);
  });

  it('uses the selected fraction of each painter region', () => {
    const regions = createBodyRegions().map((region) => region.id === 'upper-chest' ? { ...region, selectedFraction: 0.4 } : region);
    expect(selectedPediatricFtu(regions, pediatricFtuReferenceFor('younger', 4))).toBeCloseTo(0.6);
  });
});
