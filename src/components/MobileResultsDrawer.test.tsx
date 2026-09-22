import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { resolvePediatricFtuReference } from '../data/pediatricFtu';
import type { CalculatorResult, ClinicalIssue } from '../types/calculator';
import {
  buildCalculationSummary,
  shouldShowMobileResults,
  type ResultPresentation,
} from '../lib/resultPresentation';
import { MobileResultsDrawer } from './MobileResultsDrawer';
import { ResultsPanel } from './ResultsPanel';

const baseResult: CalculatorResult = {
  approximateBsaPercent: 8.4,
  ftuPerApplication: 3.5,
  baseGramsPerApplication: 1.75,
  bsaRatio: 0.92,
  sizeAdjustedGramsPerApplication: 1.61,
  formulationAdjustedGramsPerApplication: 1.61,
  totalApplications: 28,
  exactTreatmentGrams: 45.08,
  allowanceGrams: 4.51,
  finalRequiredGrams: 49.59,
  finalRequiredOunces: 1.75,
  suggestedPackages: [30, 20],
  suggestedDispensedGrams: 50,
  excessGrams: 0.41,
  status: { isBlocking: false, issues: [] },
};

const pediatricReference = resolvePediatricFtuReference('younger', 4, undefined).reference;

function presentation(result = baseResult): ResultPresentation {
  return {
    result,
    regions: [],
    selectedHandprints: 7,
    selectedFtu: 3.5,
    selectedBsaPercent: 8.4,
    plannedApplications: 28,
    areaDescription: 'the anterior trunk',
    activePresetLabels: ['Anterior trunk'],
    patientMode: 'child',
    pediatricStage: 'younger',
    heightCm: 102,
    weightKg: 16,
    effectiveBsa: 0.69,
    referenceBsa: 0.75,
    applyBsa: true,
    frequencyLabel: 'Twice daily',
    durationLabel: '14 days',
    allowancePercent: 10,
    pediatricFtuReference: pediatricReference,
  };
}

describe('mobile result safety presentation', () => {
  it('places warnings before the recommendation and includes complete context', () => {
    const warning: ClinicalIssue = { code: 'test.warning', severity: 'warning', message: 'Verify the selected pediatric age band.' };
    const value = presentation({ ...baseResult, status: { isBlocking: false, issues: [warning] } });
    const html = renderToStaticMarkup(<MobileResultsDrawer presentation={value} displayUnit="both" onDisplayUnitChange={() => undefined} />);

    expect(html.indexOf(warning.message)).toBeLessThan(html.indexOf('Suggested dispense'));
    expect(html).toContain('30 g + 20 g');
    expect(html).toContain(pediatricReference.label);
    expect(html).toContain('0.920×');
    expect(html).toContain('Twice daily');
    expect(html).toContain('10%');
    expect(html).toContain('estimate only');
    expect(html).toContain('Equivalent copy summary');
  });

  it('blocks recommendation and copy controls when the calculation is blocking', () => {
    const issue: ClinicalIssue = { code: 'area.bsa.invalid', severity: 'blocking', message: 'Estimated treatment area must be no greater than 100% BSA.' };
    const blocked = presentation({
      ...baseResult,
      suggestedPackages: [],
      suggestedDispensedGrams: 0,
      finalRequiredGrams: 0,
      status: { isBlocking: true, issues: [issue] },
    });
    const html = renderToStaticMarkup(<MobileResultsDrawer presentation={blocked} displayUnit="g" onDisplayUnitChange={() => undefined} />);

    expect(html).toContain('Recommendation blocked');
    expect(html).toContain('Review inputs');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*Resolve issues to copy/);
  });

  it('prioritizes a blocking issue over earlier warnings in the collapsed mobile strip', () => {
    const warning: ClinicalIssue = { code: 'patient.check', severity: 'warning', message: 'Check the patient measurements.' };
    const blocker: ClinicalIssue = { code: 'area.invalid', severity: 'blocking', message: 'Estimated treatment area is invalid.' };
    const blocked = presentation({
      ...baseResult,
      suggestedPackages: [],
      suggestedDispensedGrams: 0,
      finalRequiredGrams: 0,
      status: { isBlocking: true, issues: [warning, blocker] },
    });
    const html = renderToStaticMarkup(<MobileResultsDrawer presentation={blocked} displayUnit="g" onDisplayUnitChange={() => undefined} />);
    const collapsedStrip = html.slice(0, html.indexOf('<details'));

    expect(collapsedStrip).toContain('Recommendation blocked');
    expect(collapsedStrip).toContain(blocker.message);
    expect(collapsedStrip).not.toContain(warning.message);
  });

  it('uses the same copy summary on desktop and mobile', () => {
    const value = presentation();
    const summary = buildCalculationSummary(value);
    const mobile = renderToStaticMarkup(<MobileResultsDrawer presentation={value} displayUnit="both" onDisplayUnitChange={() => undefined} />);
    const desktop = renderToStaticMarkup(<ResultsPanel presentation={value} displayUnit="both" />);

    expect(mobile).toContain(summary);
    expect(desktop).toContain(summary);
  });

  it('keeps the patient band and regimen visible in the collapsed result summary', () => {
    const html = renderToStaticMarkup(<MobileResultsDrawer presentation={presentation()} displayUnit="g" onDisplayUnitChange={() => undefined} />);
    const collapsed = html.slice(html.indexOf('<summary'), html.indexOf('</summary>'));
    expect(collapsed).toContain(pediatricReference.label);
    expect(collapsed).toContain('BSA adjustment on');
    expect(collapsed).toContain('Twice daily · 14 days · 10% extra');
  });

  it('preserves known input metrics instead of rendering the blocked zero outputs', () => {
    const value = presentation({ ...baseResult, ftuPerApplication: 0, approximateBsaPercent: 0, totalApplications: 0, bsaRatio: 1,
      status: { isBlocking: true, issues: [{code: 'patient.height.invalid', severity: 'blocking', message: 'Check height.'}] } });
    const mobile = renderToStaticMarkup(<MobileResultsDrawer presentation={value} displayUnit="g" onDisplayUnitChange={() => undefined} />);
    const desktop = renderToStaticMarkup(<ResultsPanel presentation={value} displayUnit="g" />);
    for (const html of [mobile, desktop]) {
      expect(html).toContain('3.5 FTU selected');
      expect(html).toContain('28 applications');
      expect(html).toContain('8.4% BSA');
      expect(html).not.toContain('0 applications');
      expect(html).toContain('adjustment unavailable while blocked');
      expect(html).not.toContain('1.000×');
    }
  });

  it('does not present an unknown schedule as zero applications', () => {
    const value = { ...presentation({ ...baseResult, status: { isBlocking: true, issues: [] } }), plannedApplications: undefined };
    const html = renderToStaticMarkup(<ResultsPanel presentation={value} displayUnit="g" />);
    expect(html).not.toContain('0 applications');
    expect(html).not.toContain('28 applications');
  });

  it('keeps the zero-result dock hidden until it has an estimate or issue', () => {
    const zero = presentation({
      ...baseResult,
      approximateBsaPercent: 0,
      ftuPerApplication: 0,
      status: { isBlocking: false, issues: [] },
    });
    expect(shouldShowMobileResults(zero)).toBe(false);
    expect(shouldShowMobileResults(presentation())).toBe(true);
    expect(shouldShowMobileResults({ ...zero, result: { ...zero.result, status: { isBlocking: true, issues: [{ code: 'x', severity: 'blocking', message: 'Fix input.' }] } } })).toBe(true);
  });
});
