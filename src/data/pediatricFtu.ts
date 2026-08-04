import type { BodyRegion, ClinicalIssue, PediatricStage } from '../types/calculator';

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

export type PediatricAgeResolution = {
  reference: PediatricFtuReference;
  ageYears?: number;
  ageMonths?: number;
  issues: ClinicalIssue[];
  isExtrapolated: boolean;
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

const referenceById = (id: PediatricFtuBandId) => PEDIATRIC_FTU_REFERENCES.find((item) => item.id === id)!;

export function resolvePediatricFtuReference(
  stage: PediatricStage,
  ageYears?: number,
  ageMonths?: number,
): PediatricAgeResolution {
  const issues: ClinicalIssue[] = [];
  let id: PediatricFtuBandId;
  let isExtrapolated = false;

  if (ageMonths !== undefined) {
    if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths > 23 || !Number.isInteger(ageMonths)) {
      return {
        reference: referenceById(stage === 'infant' ? '1-2-years' : stage === 'younger' ? '3-5-years' : '6-10-years'),
        ageMonths,
        issues: [{
          code: 'patient.pediatric_age_months.invalid',
          message: 'Age in months must be a whole number from 0 to 23; use full years from age 2 onward.',
          severity: 'blocking',
        }],
        isExtrapolated: false,
      };
    }
    const resolvedYears = ageMonths / 12;
    if (ageMonths < 3) {
      id = '3-6-months';
      isExtrapolated = true;
      issues.push({
        code: 'patient.pediatric_age.newborn_extrapolation',
        message: 'No cited regional FTU band covers birth to 2 months; the 3–6 month table is being used as an explicitly conservative provisional estimate.',
        severity: 'warning',
      });
    } else if (ageMonths < 12) {
      id = '3-6-months';
      if (ageMonths > 6) {
        isExtrapolated = true;
        issues.push({
          code: 'patient.pediatric_age.late_infancy_extrapolation',
          message: 'The cited 3–6 month table is being extended to 7–11 months; verify the estimate for the individual infant.',
          severity: 'warning',
        });
      }
    } else if (ageMonths < 36) id = '1-2-years';
    else if (resolvedYears < 6) id = '3-5-years';
    else if (resolvedYears <= 10) id = '6-10-years';
    else id = 'adult';
    return { reference: referenceById(id), ageYears: resolvedYears, ageMonths, issues, isExtrapolated };
  }

  if (ageYears !== undefined) {
    if (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 17 || !Number.isInteger(ageYears)) {
      return {
        reference: referenceById(stage === 'infant' ? '1-2-years' : stage === 'younger' ? '3-5-years' : '6-10-years'),
        ageYears,
        issues: [{
          code: 'patient.pediatric_age_years.invalid',
          message: 'Pediatric age in years must be a whole number from 0 to 17.',
          severity: 'blocking',
        }],
        isExtrapolated: false,
      };
    }
    if (ageYears === 0) {
      id = '3-6-months';
      isExtrapolated = true;
      issues.push({
        code: 'patient.pediatric_age.months_required',
        message: 'Age 0 years does not identify an infant FTU band; enter age in months. The 3–6 month table is provisional until months are supplied.',
        severity: 'warning',
      });
    } else {
      id = ageYears < 3 ? '1-2-years' : ageYears < 6 ? '3-5-years' : ageYears <= 10 ? '6-10-years' : 'adult';
    }
    return { reference: referenceById(id), ageYears, issues, isExtrapolated };
  }

  id = stage === 'infant' ? '1-2-years' : stage === 'younger' ? '3-5-years' : '6-10-years';
  if (stage === 'infant') {
    issues.push({
      code: 'patient.pediatric_age.assumed_infant',
      message: 'No infant age was entered; the representative 1–2 year regional FTU table is being used. Enter age in months for an infant-specific estimate.',
      severity: 'warning',
    });
  }
  return { reference: referenceById(id), issues, isExtrapolated: stage === 'infant' };
}

export function pediatricFtuReferenceFor(stage: PediatricStage, ageYears?: number): PediatricFtuReference {
  return resolvePediatricFtuReference(stage, ageYears).reference;
}

// The pediatric source publishes only broad regions. Every smaller painter
// region below is an explicit proportional allocation of its broad-region
// total using the adult regional distribution as the allocation key.
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
const EXTRA_REGION_IDS = new Set(['front-scalp', 'posterior-scalp', 'groin']);

export function isKnownPediatricRegionId(regionId: string) {
  return FACE_NECK[regionId] !== undefined
    || ARM_HAND[regionId] !== undefined
    || LEG_FOOT[regionId] !== undefined
    || FRONT_TRUNK[regionId] !== undefined
    || BACK_TRUNK[regionId] !== undefined
    || EXTRA_REGION_IDS.has(regionId);
}

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
  throw new Error(`Unmapped pediatric region ID: ${regionId}`);
}

export function selectedPediatricFtu(regions: BodyRegion[], reference: PediatricFtuReference): number {
  return regions.reduce((total, region) => total + pediatricRegionFtu(region.id, reference) * region.selectedFraction, 0);
}

export function assessSelectedPediatricFtu(regions: BodyRegion[], reference: PediatricFtuReference) {
  const unknownIds = [...new Set(regions.filter((region) => !isKnownPediatricRegionId(region.id)).map((region) => region.id))];
  if (unknownIds.length > 0) {
    return {
      ftu: 0,
      issues: [{
        code: 'area.pediatric_region.unmapped',
        message: `Unmapped pediatric region ID${unknownIds.length === 1 ? '' : 's'}: ${unknownIds.join(', ')}.`,
        severity: 'blocking' as const,
      }],
    };
  }
  const hasInvalidFraction = regions.some((region) => !Number.isFinite(region.selectedFraction) || region.selectedFraction < 0 || region.selectedFraction > 1);
  if (hasInvalidFraction) {
    return {
      ftu: 0,
      issues: [{
        code: 'area.region_fraction.invalid',
        message: 'Region treatment fractions must be finite and between 0% and 100%.',
        severity: 'blocking' as const,
      }],
    };
  }
  return { ftu: selectedPediatricFtu(regions, reference), issues: [] };
}
