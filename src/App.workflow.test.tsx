// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

  it('retains the selected area and schedule when an invalid height blocks the result', () => {
    const { container } = render(<App />);
    fireEvent.click(within(container.querySelector('.left-stack') as HTMLElement).getByRole('button', { name: /Face and neck: add/i }));
    const height = within(container.querySelector('.workflow-middle') as HTMLElement).getByLabelText('Height in centimetres');
    fireEvent.change(height, { target: { value: '0' } });
    expect(container.querySelector('.area-live')?.textContent).toContain('2.5 FTU');
    expect(container.querySelector('.area-live')?.textContent).toContain('3.41%');
    expect(container.querySelector('.topbar')?.textContent).toContain('Height is outside');
    expect(container.querySelector('.topbar')?.textContent).not.toContain('Choose a preset');
    for (const selector of ['.result-metrics', '.mobile-result-metrics']) {
      expect(container.querySelector(selector)?.textContent).toContain('28 applications');
      expect(container.querySelector(selector)?.textContent).toContain('2.5 FTU selected');
    }
    expect(container.querySelectorAll('.anatomy-region.has-selection')).toHaveLength(3);
    expect(container.querySelector<HTMLButtonElement>('.mobile-copy-button')?.disabled).toBe(true);
    fireEvent.change(height, { target: { value: '170' } });
    expect(container.querySelector<HTMLButtonElement>('.mobile-copy-button')?.disabled).toBe(false);
  });

  it('retains BMI-responsive geometry without changing the unadjusted quantity', () => {
    const { container } = render(<App />);
    fireEvent.click(within(container.querySelector('.left-stack') as HTMLElement).getByRole('button', { name: /Face and neck: add/i }));
    const controls = within(container.querySelector('.workflow-middle') as HTMLElement);
    fireEvent.change(controls.getByLabelText('Height in centimetres'), { target: { value: '170' } });
    fireEvent.change(controls.getByLabelText('Weight in kilograms'), { target: { value: '64' } });
    const region = container.querySelector('[data-region-id="abdomen"]')!;
    const initial = region.getAttribute('transform');
    const resultText = container.querySelector('.hero-result')?.textContent;
    fireEvent.change(controls.getByLabelText('Weight in kilograms'), { target: { value: '110' } });
    expect(region.getAttribute('transform')).not.toBe(initial);
    expect(container.querySelector('.hero-result')?.textContent).toBe(resultText);
    expect(container.querySelector('.pannus-accent')).not.toBeNull();
  });

  it('keeps painting primary, previews without changing coverage, and undoes one whole stroke', () => {
    class PointerEventForTest extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, options: PointerEventInit = {}) {
        super(type, options);
        this.pointerId = options.pointerId ?? 1;
        this.pointerType = options.pointerType ?? 'mouse';
      }
    }
    vi.stubGlobal('PointerEvent', PointerEventForTest);
    let timestamp = 100;
    vi.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const { container } = render(<App />);
    const chest = container.querySelector('[data-region-id="upper-chest"]')!;
    vi.spyOn(chest.querySelector('[data-region-shape]')!, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 } as DOMRect);
    const tools = within(container.querySelector('.tool-row') as HTMLElement);
    expect(tools.getByRole('button', { name: /^Paint$/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.pointerMove(chest, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(chest.querySelector('.anatomy-zone-preview')).not.toBeNull();
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(0);
    fireEvent.pointerDown(chest, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(container.querySelector('.region-inspector')?.classList.contains('is-empty')).toBe(true);
    timestamp = 150;
    fireEvent.pointerMove(chest, { clientX: 70, clientY: 10, pointerId: 1 });
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(2);
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(container.querySelector('.region-inspector')?.classList.contains('is-empty')).toBe(false);
    fireEvent.click(tools.getByRole('button', { name: 'Undo' }));
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(0);

    fireEvent.pointerDown(chest, { clientX: 10, clientY: 10, pointerId: 2 });
    fireEvent.pointerDown(chest, { clientX: 70, clientY: 10, pointerId: 3 });
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(1);
    fireEvent.pointerCancel(window, { pointerId: 2 });
    timestamp = 200;
    fireEvent.pointerMove(chest, { clientX: 70, clientY: 10, pointerId: 2 });
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(1);
    fireEvent.pointerDown(chest, { clientX: 70, clientY: 10, pointerId: 4 });
    fireEvent.pointerUp(window, { pointerId: 4 });
    expect(chest.querySelectorAll('.anatomy-segment-fill')).toHaveLength(2);
  });
});
