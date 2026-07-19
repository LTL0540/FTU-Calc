import { describe, expect, it } from 'vitest';
import { getSchedule } from './schedule';

describe('treatment schedules', () => {
  it('calculates BID for 14 days', () => expect(getSchedule('bid', 1, 14, 'days').totalApplications).toBe(28));
  it('calculates every other day for 14 days', () => expect(getSchedule('alternate', 1, 14, 'days').totalApplications).toBe(7));
  it('calculates three times weekly for four weeks', () => expect(getSchedule('custom-week', 3, 4, 'weeks').totalApplications).toBe(12));
  it('uses 30.4375 days per month', () => expect(getSchedule('daily', 1, 1, 'months').totalApplications).toBe(30.4375));
});
