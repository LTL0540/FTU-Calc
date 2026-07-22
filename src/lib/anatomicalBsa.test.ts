import { describe, expect, it } from 'vitest';
import { createBodyRegions } from '../data/bodyRegions';
import { anatomicalBsaPercent } from './anatomicalBsa';

const fullySelected = () => createBodyRegions().map((region) => ({ ...region, selectedFraction: 1 }));

describe('anatomical painter BSA', () => {
  it('sums all adult surfaces to 100%', () => expect(anatomicalBsaPercent(fullySelected(), 'adult')).toBeCloseTo(100));
  it.each([0, 1, 5, 10])('sums all pediatric surfaces to 100%% at age %s', (age) => {
    expect(anatomicalBsaPercent(fullySelected(), 'child', age)).toBeCloseTo(100);
  });
  it('scales selected fractions without using FTU handprint arithmetic', () => {
    const regions = createBodyRegions().map((region) => region.id === 'face' ? { ...region, selectedFraction: 0.5 } : region);
    expect(anatomicalBsaPercent(regions, 'adult')).toBeGreaterThan(0);
    expect(anatomicalBsaPercent(regions, 'adult')).toBeLessThan(4);
  });
});
