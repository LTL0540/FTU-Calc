import type { BodyRegion, PediatricStage } from '../types/calculator';

export type PediatricFtuBandId = '3-6-months' | '1-2-years' | '3-5-years' | '6-10-years' | 'adult';

export type PediatricFtuReference = {
  id: PediatricFtuBandId;
  label: string;
  faceNeck: number;
  armHand: number;
  legFoot: number;
  frontTrunk: number;
  backButtocks: number;
};

// Adult-finger FTUs required for one complete application to each listed surface.
// The child values are reproduced in NHS pediatric eczema guidance citing Long (1998).
export const PEDIATRIC_FTU_REFERENCES: readonly PediatricFtuReference[] = [
  { id: '3-6-months', label: '3–6 months', faceNeck: 1, armHand: 1, legFoot: 1.5, frontTrunk: 1, backButtocks: 1.5 },
  { id: '1-2-years', label: '1–2 years', faceNeck: 1.5, armHand: 1.5, legFoot: 2, frontTrunk: 2, backButtocks: 3 },
  { id: '3-5-years', label: '3–5 years', faceNeck: 1.5, armHand: 2, legFoot: 3, frontTrunk: 3, backButtocks: 3.5 },
  { id: '6-10-years', label: '6–10 years', faceNeck: 2, armHand: 2.5, legFoot: 4.5, frontTrunk: 3.5, backButtocks: 5 },
  { id: 'adult', label: 'Over 10 / adult reference', faceNeck: 2.5, armHand: 4, legFoot: 8, frontTrunk: 7, backButtocks: 7 },
] as const;

export function pediatricFtuReferenceFor(stage: PediatricStage, ageYears?: number): PediatricFtuReference {
  let id: PediatricFtuBandId;
  if (ageYears !== undefined && Number.isFinite(ageYears) && ageYears >= 0) {
    id = ageYears < 1 ? '3-6-months' : ageYears < 3 ? '1-2-years' : ageYears < 6 ? '3-5-years' : ageYears <= 10 ? '6-10-years' : 'adult';
  } else {
    id = stage === 'infant' ? '1-2-years' : stage === 'younger' ? '3-5-years' : '6-10-years';
  }
  return PEDIATRIC_FTU_REFERENCES.find((item) => item.id === id)!;
}

const FACE_NECK: Record<string, number> = { face: 2, 'anterior-neck': 0.25, 'posterior-neck': 0.25 };
const ARM_HAND: Record<string, number> = {
  'left-upper-arm-front': 1, 'left-forearm-front': 0.5, 'left-upper-arm-back': 1, 'left-forearm-back': 0.5, 'left-hand-front': 0.5, 'left-hand-back': 0.5,
  'right-upper-arm-front': 1, 'right-forearm-front': 0.5, 'right-upper-arm-back': 1, 'right-forearm-back': 0.5, 'right-hand-front': 0.5, 'right-hand-back': 0.5,
};
const LEG_FOOT: Record<string, number> = {
  'left-thigh-front': 2, 'left-lower-leg-front': 1, 'left-thigh-back': 2, 'left-lower-leg-back': 1, 'left-foot-front': 1, 'left-foot-back': 1,
  'right-thigh-front': 2, 'right-lower-leg-front': 1, 'right-thigh-back': 2, 'right-lower-leg-back': 1, 'right-foot-front': 1, 'right-foot-back': 1,
};
const FRONT_TRUNK: Record<string, number> = { 'upper-chest': 3.5, abdomen: 3.5 };
const BACK_TRUNK: Record<string, number> = { 'upper-back': 1.5, 'lower-back': 1.5, buttocks: 4 };

function ageScale(reference: PediatricFtuReference) {
  const childTotal = reference.faceNeck + (reference.armHand * 2) + (reference.legFoot * 2) + reference.frontTrunk + reference.backButtocks;
  return childTotal / 40.5;
}

export function pediatricRegionFtu(regionId: string, reference: PediatricFtuReference): number {
  if (FACE_NECK[regionId] !== undefined) return reference.faceNeck * (FACE_NECK[regionId] / 2.5);
  if (ARM_HAND[regionId] !== undefined) return reference.armHand * (ARM_HAND[regionId] / 4);
  if (LEG_FOOT[regionId] !== undefined) return reference.legFoot * (LEG_FOOT[regionId] / 8);
  if (FRONT_TRUNK[regionId] !== undefined) return reference.frontTrunk * (FRONT_TRUNK[regionId] / 7);
  if (BACK_TRUNK[regionId] !== undefined) return reference.backButtocks * (BACK_TRUNK[regionId] / 7);
  if (regionId === 'front-scalp' || regionId === 'posterior-scalp') return 1.5 * ageScale(reference);
  if (regionId === 'groin') return 0.5 * ageScale(reference);
  return 0;
}

export function selectedPediatricFtu(regions: BodyRegion[], reference: PediatricFtuReference): number {
  return regions.reduce((total, region) => total + pediatricRegionFtu(region.id, reference) * region.selectedFraction, 0);
}
