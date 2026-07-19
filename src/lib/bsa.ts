export function calculateMostellerBsa(heightCm?: number, weightKg?: number): number | undefined {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return undefined;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function resolvePatientBsa(manualBsa?: number, calculatedBsa?: number, pediatricDefaultBsa?: number): number | undefined {
  return manualBsa ?? calculatedBsa ?? pediatricDefaultBsa;
}

export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
export const poundsToKg = (pounds: number) => pounds * 0.45359237;
