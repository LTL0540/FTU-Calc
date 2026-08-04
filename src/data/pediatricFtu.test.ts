import { describe, expect, it } from 'vitest';
import { createBodyRegions } from './bodyRegions';
import {
  assessSelectedPediatricFtu,
  PEDIATRIC_FTU_REFERENCES,
  pediatricFtuReferenceFor,
  pediatricRegionFtu,
  resolvePediatricFtuReference,
  selectedPediatricFtu,
} from './pediatricFtu';

const sumIds = (ids: string[], ageYears?: number, ageMonths?: number) => {
  const reference = resolvePediatricFtuReference('younger', ageYears, ageMonths).reference;
  return ids.reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0);
};

describe('pediatric age-region FTU references', () => {
  it.each([
    [undefined, 6, 1, 1, 1.5, 1, 1.5],
    [1, undefined, 1.5, 1.5, 2, 2, 3],
    [4, undefined, 1.5, 2, 3, 3, 3.5],
    [8, undefined, 2, 2.5, 4.5, 3.5, 5],
    [11, undefined, 2.5, 4, 8, 7, 7],
  ])('maps years %s / months %s to the published full-region values', (ageYears, ageMonths, face, arm, leg, front, back) => {
    expect(sumIds(['face', 'anterior-neck', 'posterior-neck'], ageYears, ageMonths)).toBeCloseTo(face);
    expect(sumIds(['left-upper-arm-front', 'left-forearm-front', 'left-upper-arm-back', 'left-forearm-back', 'left-hand-front', 'left-hand-back'], ageYears, ageMonths)).toBeCloseTo(arm);
    expect(sumIds(['left-thigh-front', 'left-lower-leg-front', 'left-thigh-back', 'left-lower-leg-back', 'left-foot-front', 'left-foot-back'], ageYears, ageMonths)).toBeCloseTo(leg);
    expect(sumIds(['upper-chest', 'abdomen'], ageYears, ageMonths)).toBeCloseTo(front);
    expect(sumIds(['upper-back', 'lower-back', 'buttocks'], ageYears, ageMonths)).toBeCloseTo(back);
  });

  it('uses the selected fraction of each painter region', () => {
    const regions = createBodyRegions().map((region) => region.id === 'upper-chest' ? { ...region, selectedFraction: 0.4 } : region);
    expect(selectedPediatricFtu(regions, pediatricFtuReferenceFor('younger', 4))).toBeCloseTo(0.6);
  });

  it.each(PEDIATRIC_FTU_REFERENCES)('allocates every $label broad-region total exactly', (reference) => {
    expect(['face', 'anterior-neck', 'posterior-neck'].reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0)).toBeCloseTo(reference.faceNeck, 12);
    expect(['left-upper-arm-front', 'left-forearm-front', 'left-upper-arm-back', 'left-forearm-back', 'left-hand-front', 'left-hand-back'].reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0)).toBeCloseTo(reference.armHand, 12);
    expect(['left-thigh-front', 'left-lower-leg-front', 'left-thigh-back', 'left-lower-leg-back', 'left-foot-front', 'left-foot-back'].reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0)).toBeCloseTo(reference.legFoot, 12);
    expect(['upper-chest', 'abdomen'].reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0)).toBeCloseTo(reference.frontTrunk, 12);
    expect(['upper-back', 'lower-back', 'buttocks'].reduce((sum, id) => sum + pediatricRegionFtu(id, reference), 0)).toBeCloseTo(reference.backButtocks, 12);
  });

  it('requires months to disambiguate age 0 and discloses extrapolated infant bands', () => {
    expect(resolvePediatricFtuReference('infant', 0).issues[0].code).toBe('patient.pediatric_age.months_required');
    expect(resolvePediatricFtuReference('infant', undefined, 2).isExtrapolated).toBe(true);
    expect(resolvePediatricFtuReference('infant', undefined, 6).issues).toEqual([]);
    expect(resolvePediatricFtuReference('infant', undefined, 9).issues[0].code).toBe('patient.pediatric_age.late_infancy_extrapolation');
  });

  it('blocks unsupported pediatric ages', () => {
    expect(resolvePediatricFtuReference('older', 18).issues[0].severity).toBe('blocking');
    expect(resolvePediatricFtuReference('infant', undefined, 24).issues[0]).toMatchObject({
      code: 'patient.pediatric_age_months.invalid',
      severity: 'blocking',
    });
    expect(resolvePediatricFtuReference('infant', undefined, Number.POSITIVE_INFINITY).issues[0].severity).toBe('blocking');
  });

  it('returns a blocking issue for an unmapped pediatric region instead of silently assigning zero', () => {
    const regions = createBodyRegions();
    regions[0] = { ...regions[0], id: 'unknown-region' };
    const assessment = assessSelectedPediatricFtu(regions, pediatricFtuReferenceFor('younger', 4));
    expect(assessment.ftu).toBe(0);
    expect(assessment.issues[0]).toMatchObject({ code: 'area.pediatric_region.unmapped', severity: 'blocking' });
  });
});
