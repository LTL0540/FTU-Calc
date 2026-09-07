// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('copyText', () => {
  it('uses the modern clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await expect(copyText('clinical summary')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('clinical summary');
  });

  it('returns a failure result when copying is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: undefined });

    await expect(copyText('clinical summary')).resolves.toBe(false);
  });
});
