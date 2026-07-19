import { CLINICAL_CONSTANTS } from '../config/clinical';
import type { DurationUnit, FrequencyId } from '../types/calculator';

export const FREQUENCIES: Array<{ id: FrequencyId; label: string; perDay?: number; perWeek?: number }> = [
  { id: 'daily', label: 'Once daily', perDay: 1 },
  { id: 'bid', label: 'Twice daily', perDay: 2 },
  { id: 'tid', label: 'Three times daily', perDay: 3 },
  { id: 'qid', label: 'Four times daily', perDay: 4 },
  { id: 'alternate', label: 'Every other day', perDay: 0.5 },
  { id: 'weekly', label: 'Weekly', perWeek: 1 },
  { id: 'custom-day', label: 'Custom applications per day' },
  { id: 'custom-week', label: 'Custom applications per week' },
];

export function durationToDays(value: number, unit: DurationUnit, daysPerMonth = CLINICAL_CONSTANTS.daysPerMonth): number {
  if (unit === 'weeks') return value * 7;
  if (unit === 'months') return value * daysPerMonth;
  return value;
}

export function getSchedule(
  frequency: FrequencyId,
  customApplications: number,
  durationValue: number,
  durationUnit: DurationUnit,
  daysPerMonth = CLINICAL_CONSTANTS.daysPerMonth,
) {
  const definition = FREQUENCIES.find((item) => item.id === frequency)!;
  const durationDays = durationToDays(durationValue, durationUnit, daysPerMonth);
  const applicationsPerWeek = frequency === 'custom-week' ? customApplications : definition.perWeek;
  const applicationsPerDay = frequency === 'custom-day' ? customApplications : definition.perDay;
  const totalApplications = applicationsPerWeek !== undefined
    ? applicationsPerWeek * (durationDays / 7)
    : (applicationsPerDay ?? 0) * durationDays;
  return { durationDays, applicationsPerDay, applicationsPerWeek, totalApplications };
}
