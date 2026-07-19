import { describe, expect, it } from 'vitest';
import { pediatricStageForAge } from './clinical';

describe('pediatric model age bands', () => {
  it('maps age to the conventional visual model band', () => {
    expect(pediatricStageForAge(1)).toBe('infant');
    expect(pediatricStageForAge(3)).toBe('younger');
    expect(pediatricStageForAge(5.9)).toBe('younger');
    expect(pediatricStageForAge(6)).toBe('older');
    expect(pediatricStageForAge(12)).toBe('older');
  });
});
