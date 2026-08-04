import { describe, expect, it } from 'vitest';
import { createBodyRegions } from '../data/bodyRegions';
import { anatomicalBsaPercent, assessAnatomicalBsaPercent } from './anatomicalBsa';

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

  it('blocks an unmapped region instead of treating it as genital surface', () => {
    const regions = createBodyRegions();
    regions[0] = { ...regions[0], id: 'unknown-region' };
    expect(assessAnatomicalBsaPercent(regions, 'adult').issues[0]).toMatchObject({
      code: 'area.anatomical_region.unmapped',
      severity: 'blocking',
    });
  });

  it('blocks non-finite region fractions', () => {
    const regions = createBodyRegions();
    regions[0] = { ...regions[0], selectedFraction: Number.NaN };
    expect(assessAnatomicalBsaPercent(regions, 'adult').issues[0].code).toBe('area.region_fraction.invalid');
  });
});
