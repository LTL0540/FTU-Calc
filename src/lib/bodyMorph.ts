import type { PatientMode, PediatricStage } from '../types/calculator';

export type BodyMorph = {
  measured: boolean;
  statureLabel: 'Short' | 'Average' | 'Tall';
  buildLabel: 'Lean' | 'Average' | 'Broad';
  headWidth: number;
  neckWidth: number;
  shoulderWidth: number;
  torsoWidth: number;
  pelvisWidth: number;
  armWidth: number;
  legWidth: number;
  buttockWidth: number;
  buttockRoundness: number;
  torsoLength: number;
  armLength: number;
  legLength: number;
};

type MorphInputs = {
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  heightCm?: number;
  weightKg?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const REFERENCES: Record<PatientMode | PediatricStage, { height: number; bmi: number }> = {
  adult: { height: 170, bmi: 22 },
  child: { height: 120, bmi: 16.5 },
  older: { height: 138, bmi: 17 },
  younger: { height: 108, bmi: 16 },
  infant: { height: 75, bmi: 17 },
};

export function calculateBodyMorph({ patientMode, pediatricStage, heightCm, weightKg }: MorphInputs): BodyMorph {
  const reference = patientMode === 'adult' ? REFERENCES.adult : REFERENCES[pediatricStage];
  const hasHeight = heightCm !== undefined && heightCm > 0;
  const hasWeight = weightKg !== undefined && weightKg > 0;
  const statureRatio = hasHeight
    ? clamp(heightCm / reference.height, patientMode === 'adult' ? 0.88 : 0.9, patientMode === 'adult' ? 1.15 : pediatricStage === 'infant' ? 1.05 : 1.1)
    : 1;
  const statureDelta = statureRatio - 1;
  const bmi = hasHeight && hasWeight ? weightKg / ((heightCm / 100) ** 2) : undefined;
  const widthLimits = pediatricStage === 'infant' && patientMode === 'child'
    ? { min: 0.96, max: 1.1 }
    : patientMode === 'child'
      ? { min: 0.92, max: 1.32 }
      : { min: 0.88, max: 1.5 };
  const buildDivisor = patientMode === 'adult' ? 45 : 50;
  let buildScale = bmi === undefined ? 1 : clamp(1 + (bmi - reference.bmi) / buildDivisor, widthLimits.min, widthLimits.max);

  // Height already explains some size in tall adults. Dampen modest width growth so a
  // tall, proportionate person reads as long-limbed rather than automatically broad.
  if (patientMode === 'adult' && hasHeight && heightCm > 185 && bmi !== undefined && bmi < 30) {
    buildScale = 1 + (buildScale - 1) * 0.55;
  }

  const buildDelta = buildScale - 1;
  const infantDamping = patientMode === 'child' && pediatricStage === 'infant' ? 0.55 : 1;
  const lengthDamping = patientMode === 'adult' ? 1 : pediatricStage === 'infant' ? 0.45 : 0.7;

  return {
    measured: hasHeight,
    statureLabel: statureRatio < 0.95 ? 'Short' : statureRatio > 1.05 ? 'Tall' : 'Average',
    buildLabel: buildScale < 0.96 ? 'Lean' : buildScale > 1.06 ? 'Broad' : 'Average',
    headWidth: 1 + buildDelta * 0.1 * infantDamping,
    neckWidth: 1 + buildDelta * 0.26 * infantDamping,
    shoulderWidth: 1 + buildDelta * 0.34 * infantDamping,
    torsoWidth: 1 + buildDelta * 1.15 * infantDamping,
    pelvisWidth: 1 + buildDelta * 0.9 * infantDamping,
    armWidth: 1 + buildDelta * 0.46 * infantDamping,
    legWidth: 1 + buildDelta * 0.7 * infantDamping,
    buttockWidth: 1.03 + buildDelta * 1.28 * infantDamping,
    buttockRoundness: clamp(1.02 + buildDelta * 0.45 * infantDamping, 0.99, patientMode === 'child' && pediatricStage === 'infant' ? 1.07 : 1.24),
    torsoLength: 1 + statureDelta * 0.18 * lengthDamping,
    armLength: 1 + statureDelta * 0.58 * lengthDamping,
    legLength: 1 + statureDelta * 0.78 * lengthDamping,
  };
}
