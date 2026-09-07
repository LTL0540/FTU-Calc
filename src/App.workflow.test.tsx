// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('QuantiDerm user workflows', () => {
  it('updates the estimate from a common area and resets the complete workflow', async () => {
    const { container } = render(<App />);
    const results = within(container.querySelector('.workflow-right .results-card') as HTMLElement);

    fireEvent.click(within(container.querySelector('.left-stack') as HTMLElement).getByRole('button', { name: /Face and neck: add/i }));

    await waitFor(() => {
      expect(results.getByText('35 g / 1.23 oz')).toBeTruthy();
      expect(container.querySelector('.preset-card.active')).not.toBeNull();
    });

    const abdomen = container.querySelector<SVGGElement>('[data-region-id="abdomen"]')!;
    fireEvent.keyDown(abdomen, { key: 'Enter' });
    await waitFor(() => expect(abdomen.querySelector('.anatomy-region')?.classList.contains('is-active')).toBe(true));

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(within(container.querySelector('.topbar') as HTMLElement).getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(results.getByText('Select an area')).toBeTruthy();
      expect(container.querySelector('.preset-card.active')).toBeNull();
      expect(container.querySelector('.anatomy-region.is-active')).toBeNull();
    });
  });

  it('clears patient measurements when switching between adult and child models', async () => {
    const { container } = render(<App />);
    const controls = within(container.querySelector('.workflow-middle') as HTMLElement);
    const height = controls.getByLabelText('Height in centimetres') as HTMLInputElement;
    const weight = controls.getByLabelText('Weight in kilograms') as HTMLInputElement;

    fireEvent.change(height, { target: { value: '180' } });
    fireEvent.change(weight, { target: { value: '80' } });
    expect(Number(height.value)).toBe(180);
    expect(Number(weight.value)).toBe(80);

    fireEvent.click(controls.getByRole('button', { name: 'Child' }));

    await waitFor(() => {
      expect((controls.getByLabelText('Height in centimetres') as HTMLInputElement).value).toBe('');
      expect((controls.getByLabelText('Weight in kilograms') as HTMLInputElement).value).toBe('');
      expect(controls.getByRole('button', { name: 'Child' }).getAttribute('aria-pressed')).toBe('true');
    });
  });

  it('converts days to weeks and leaves months blank for deliberate entry', async () => {
    const { container } = render(<App />);
    const schedule = within(container.querySelector('.workflow-middle .schedule-panel') as HTMLElement);
    const duration = schedule.getByLabelText('Treatment duration in whole units') as HTMLInputElement;
    const unit = schedule.getByLabelText('Duration unit') as HTMLSelectElement;

    expect(duration.value).toBe('14');
    fireEvent.change(unit, { target: { value: 'weeks' } });
    await waitFor(() => expect(duration.value).toBe('2'));

    fireEvent.change(unit, { target: { value: 'months' } });
    await waitFor(() => expect(duration.value).toBe(''));
  });
});
