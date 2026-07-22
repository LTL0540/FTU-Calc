import type { BodyRegion, PatientMode } from '../types/calculator';

type BodyCompartments = { head: number; trunk: number; upper: number; lower: number };

// ICRP reference body-surface distributions. Values are percentages of total BSA.
const BSA_BY_AGE = [
  { age: 0, head: 20.8, trunk: 31.9, upper: 16.8, lower: 30.5 },
  { age: 1, head: 17.2, trunk: 34.4, upper: 17.8, lower: 30.6 },
  { age: 5, head: 13.1, trunk: 33, upper: 19.6, lower: 34.3 },
  { age: 10, head: 10.9, trunk: 33.6, upper: 19.4, lower: 36.2 },
] as const;
const ADULT: BodyCompartments = { head: 7.5, trunk: 34.6, upper: 19.4, lower: 38.5 };

const HEAD_IDS = new Set(['front-scalp', 'posterior-scalp', 'face', 'anterior-neck', 'posterior-neck']);
const TRUNK_IDS = new Set(['upper-chest', 'abdomen', 'upper-back', 'lower-back', 'buttocks']);
const UPPER_IDS = new Set([
  'left-upper-arm-front', 'right-upper-arm-front', 'left-forearm-front', 'right-forearm-front', 'left-hand-front', 'right-hand-front',
  'left-upper-arm-back', 'right-upper-arm-back', 'left-forearm-back', 'right-forearm-back', 'left-hand-back', 'right-hand-back',
]);
const LOWER_IDS = new Set([
  'left-thigh-front', 'right-thigh-front', 'left-lower-leg-front', 'right-lower-leg-front', 'left-foot-front', 'right-foot-front',
  'left-thigh-back', 'right-thigh-back', 'left-lower-leg-back', 'right-lower-leg-back', 'left-foot-back', 'right-foot-back',
]);

function pediatricCompartments(ageYears: number): BodyCompartments {
  const age = Math.max(0, Math.min(10, ageYears));
  const upperIndex = BSA_BY_AGE.findIndex((item) => item.age >= age);
  const upper = BSA_BY_AGE[Math.max(0, upperIndex)];
  const lower = BSA_BY_AGE[Math.max(0, upperIndex - 1)];
  if (upper.age === lower.age) {
    const total = upper.head + upper.trunk + upper.upper + upper.lower;
    return { head: upper.head * 100 / total, trunk: upper.trunk * 100 / total, upper: upper.upper * 100 / total, lower: upper.lower * 100 / total };
  }
  const fraction = (age - lower.age) / (upper.age - lower.age);
  const interpolated = {
    head: lower.head + (upper.head - lower.head) * fraction,
    trunk: lower.trunk + (upper.trunk - lower.trunk) * fraction,
    upper: lower.upper + (upper.upper - lower.upper) * fraction,
    lower: lower.lower + (upper.lower - lower.lower) * fraction,
  };
  const total = interpolated.head + interpolated.trunk + interpolated.upper + interpolated.lower;
  return { head: interpolated.head * 100 / total, trunk: interpolated.trunk * 100 / total, upper: interpolated.upper * 100 / total, lower: interpolated.lower * 100 / total };
}

function groupFor(regionId: string) {
  if (HEAD_IDS.has(regionId)) return 'head' as const;
  if (TRUNK_IDS.has(regionId)) return 'trunk' as const;
  if (UPPER_IDS.has(regionId)) return 'upper' as const;
  if (LOWER_IDS.has(regionId)) return 'lower' as const;
  return 'genital' as const;
}

export function anatomicalBsaPercent(regions: BodyRegion[], mode: PatientMode, representativeAge = 10): number {
  const compartments = mode === 'adult' ? ADULT : pediatricCompartments(representativeAge);
  const genitalPercent = 1;
  const availableTrunk = compartments.trunk - genitalPercent;
  const totals = regions.reduce((map, region) => {
    const group = groupFor(region.id);
    map[group] = (map[group] ?? 0) + region.adultHandprints;
    return map;
  }, {} as Record<string, number>);
  return regions.reduce((sum, region) => {
    const group = groupFor(region.id);
    const groupPercent = group === 'genital' ? genitalPercent : group === 'trunk' ? availableTrunk : compartments[group];
    const fullRegionPercent = groupPercent * (region.adultHandprints / totals[group]);
    return sum + fullRegionPercent * region.selectedFraction;
  }, 0);
}
