export const PATIENT_SIZE_LIMITS = {
  heightCm: { min: 30, max: 275 },
  weightKg: { min: 1, max: 500 },
  bsa: { min: 0.15, max: 4.5 },
} as const;

export function calculateMostellerBsa(heightCm?: number, weightKg?: number): number | undefined {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return undefined;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function assessPatientSize(heightCm?: number, weightKg?: number) {
  const warnings: string[] = [];
  const heightIsValid = heightCm === undefined
    || (heightCm >= PATIENT_SIZE_LIMITS.heightCm.min && heightCm <= PATIENT_SIZE_LIMITS.heightCm.max);
  const weightIsValid = weightKg === undefined
    || (weightKg >= PATIENT_SIZE_LIMITS.weightKg.min && weightKg <= PATIENT_SIZE_LIMITS.weightKg.max);

  if (!heightIsValid) {
    warnings.push(`Height is outside the supported entry range of ${PATIENT_SIZE_LIMITS.heightCm.min}–${PATIENT_SIZE_LIMITS.heightCm.max} cm. Check the measurement.`);
  }
  if (!weightIsValid) {
    warnings.push(`Weight is outside the supported entry range of ${PATIENT_SIZE_LIMITS.weightKg.min}–${PATIENT_SIZE_LIMITS.weightKg.max} kg. Check the measurement.`);
  }

  if (!heightIsValid || !weightIsValid || heightCm === undefined || weightKg === undefined) {
    return { bsa: undefined, rawBsa: undefined, warnings };
  }

  const rawBsa = calculateMostellerBsa(heightCm, weightKg);
  const bsaIsValid = rawBsa !== undefined
    && rawBsa >= PATIENT_SIZE_LIMITS.bsa.min
    && rawBsa <= PATIENT_SIZE_LIMITS.bsa.max;

  if (!bsaIsValid) {
    warnings.push(`Calculated BSA is outside the supported range of ${PATIENT_SIZE_LIMITS.bsa.min.toFixed(2)}–${PATIENT_SIZE_LIMITS.bsa.max.toFixed(2)} m². Check height and weight; BSA adjustment has not been applied.`);
  }

  return { bsa: bsaIsValid ? rawBsa : undefined, rawBsa, warnings };
}

export function resolvePatientBsa(manualBsa?: number, calculatedBsa?: number, pediatricDefaultBsa?: number): number | undefined {
  return manualBsa ?? calculatedBsa ?? pediatricDefaultBsa;
}

export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
export const poundsToKg = (pounds: number) => pounds * 0.45359237;

export function centimetersToFeetInches(centimeters?: number) {
  if (centimeters === undefined || !Number.isFinite(centimeters) || centimeters <= 0) {
    return { feet: undefined, inches: undefined };
  }
  const totalInches = centimeters / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}
