import { CLINICAL_CONSTANTS } from '../config/clinical';

export const gramsToOunces = (grams: number) => grams / CLINICAL_CONSTANTS.gramsPerOunce;
export const ouncesToGrams = (ounces: number) => ounces * CLINICAL_CONSTANTS.gramsPerOunce;

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

export const formatGrams = (grams: number) => `${formatNumber(grams, 2)} g`;
export const formatOunces = (grams: number) => `${formatNumber(gramsToOunces(grams), 2)} oz`;
