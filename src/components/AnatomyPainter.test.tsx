import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createBodyRegions } from '../data/bodyRegions';
import { resolvePediatricFtuReference } from '../data/pediatricFtu';
import { nextRegionIdForKey } from '../lib/anatomyNavigation';
import { AnatomyPainter } from './AnatomyPainter';

describe('anatomy painter accessibility', () => {
  const regions = createBodyRegions();

  it('uses one roving tab stop per front and back figure with expanded small-region targets', () => {
    const html = renderToStaticMarkup(
      <AnatomyPainter
        regions={regions}
        patientMode="adult"
        pediatricStage="younger"
        pediatricFtuReference={resolvePediatricFtuReference('younger', 4, undefined).reference}
        modelBsa={1.73}
        clearSignal={0}
        mirrorFrontBack={false}
        onMirrorFrontBackChange={() => undefined}
        onChange={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html.match(/tabindex="0"/g)).toHaveLength(2);
    expect(html.match(/tabindex="-1"/g)?.length).toBe(regions.length - 2);
    expect(html).toContain('anatomy-region-hit-target expanded');
    expect(html).not.toContain('aria-live=');
  });

  it('supports arrow wrapping and Home/End navigation within a figure', () => {
    const front = regions.filter((region) => region.view === 'front');
    expect(nextRegionIdForKey(regions, front[0].id, 'ArrowUp')).toBe(front[front.length - 1].id);
    expect(nextRegionIdForKey(regions, front[0].id, 'ArrowRight')).toBe(front[1].id);
    expect(nextRegionIdForKey(regions, front[5].id, 'Home')).toBe(front[0].id);
    expect(nextRegionIdForKey(regions, front[5].id, 'End')).toBe(front[front.length - 1].id);
  });

  it('retains the mobile reflow, internal scrolling, safe-area, and compact toolbar contracts', () => {
    const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(styles).toContain('@media (max-width: 660px)');
    expect(styles).toContain('height: min(72dvh, 640px)');
    expect(styles).toContain('max-height: calc(min(72dvh, 640px) - 68px)');
    expect(styles).toContain('overflow-y: auto');
    expect(styles).toContain('env(safe-area-inset-bottom)');
    expect(styles).toContain('@media (max-width: 1180px)');
    expect(styles).toContain('.tool-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }');
  });
});
