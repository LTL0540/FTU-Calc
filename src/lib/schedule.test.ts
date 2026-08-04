import { describe, expect, it } from 'vitest';
import { durationValueForUnitChange, getSchedule } from './schedule';

describe('treatment schedules', () => {
  it('calculates BID for 14 days', () => expect(getSchedule('bid', 1, 14, 'days').totalApplications).toBe(28));
  it('calculates every other day for 14 days', () => expect(getSchedule('alternate', 1, 14, 'days').totalApplications).toBe(7));
  it('calculates three times weekly for four weeks', () => expect(getSchedule('custom-week', 3, 4, 'weeks').totalApplications).toBe(12));
  it('uses 30.4375 days per month', () => expect(getSchedule('daily', 1, 1, 'months').totalApplications).toBe(30.4375));
  it('rounds a partial weekly interval up to a planned administration', () => expect(getSchedule('weekly', 1, 10, 'days').totalApplications).toBe(2));
  it('rounds a partial alternate-day interval up', () => expect(getSchedule('alternate', 1, 15, 'days').totalApplications).toBe(8));
  it('converts 14 days to 2 weeks when the duration unit changes', () => expect(durationValueForUnitChange(14, 'days', 'weeks')).toBe(2));
  it('converts weeks back to their full-day equivalent', () => expect(durationValueForUnitChange(2, 'weeks', 'days')).toBe(14));
  it('leaves the duration blank when months are selected', () => expect(durationValueForUnitChange(14, 'days', 'months')).toBe(0));
  it('uses a sensible default after leaving an unspecified month duration', () => expect(durationValueForUnitChange(0, 'months', 'weeks')).toBe(2));
  it.each([
    ['zero duration', getSchedule('daily', 1, 0, 'days')],
    ['non-finite frequency', getSchedule('custom-day', Number.POSITIVE_INFINITY, 1, 'days')],
    ['excessive course count', getSchedule('qid', 1, 3000, 'days')],
  ])('returns a blocking issue for %s', (_label, schedule) => {
    expect(schedule.issues.some((issue) => issue.severity === 'blocking')).toBe(true);
  });
});
