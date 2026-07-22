import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Clipboard, ExternalLink, HelpCircle, RotateCcw } from 'lucide-react';
import { AnatomyPainter } from './components/AnatomyPainter';
import { AnatomyRegionList } from './components/AnatomyRegionList';
import { PatientSizePanel } from './components/PatientSizePanel';
import { RegimenPanel } from './components/RegimenPanel';
import { PackageSelector } from './components/PackageSelector';
import { HandprintOverride } from './components/HandprintOverride';
import { ResultsPanel } from './components/ResultsPanel';
import { ReferencePanel } from './components/ReferencePanel';
import { BODY_REGION_REFERENCE_NOTE, createBodyRegions } from './data/bodyRegions';
import { createPackageSizes } from './data/packageSizes';
import { PROTOCOL_PRESETS } from './data/protocolPresets';
import { CLINICAL_REFERENCE_LINKS } from './data/clinicalReferences';
import { pediatricFtuReferenceFor, selectedPediatricFtu } from './data/pediatricFtu';
import type { CalculatorResult, DisplayUnit, DurationUnit, Formulation, FrequencyId, PatientMode, PediatricStage, ProtocolPreset } from './types/calculator';
import { CLINICAL_CONSTANTS, getPediatricBsaFallback, pediatricStageForAge } from './config/clinical';
import { calculateMostellerBsa } from './lib/bsa';
import { calculateFtu } from './lib/ftuCalculations';
import { anatomicalBsaPercent } from './lib/anatomicalBsa';
import { FREQUENCIES, getSchedule } from './lib/schedule';
import { quantityWarnings, validateInputs } from './lib/validation';
import { formatNumber, formatOunces } from './lib/unitConversions';
import './styles.css';

function MobileResultsDrawer({ result, displayUnit, onDisplayUnitChange, summary }: { result: CalculatorResult; displayUnit: DisplayUnit; onDisplayUnitChange: (unit: DisplayUnit) => void; summary: string }) {
  const [copied, setCopied] = useState(false);
  const quantity = (grams: number, practical = false) => {
    const gramText = `${formatNumber(grams, practical ? 1 : 2)} g`;
    if (displayUnit === 'g') return gramText;
    if (displayUnit === 'oz') return formatOunces(grams);
    return `${gramText} / ${formatOunces(grams)}`;
  };
  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <details className="mobile-result-drawer">
    <summary>
      <span><small>Suggested dispense</small><strong>{quantity(result.suggestedDispensedGrams, true)}</strong></span>
      <span><small>Calculated need</small><strong>{quantity(result.finalRequiredGrams)}</strong></span>
    </summary>
    <div className="mobile-result-content">
      <div className="segmented compact-toggle" role="group" aria-label="Display units">
        <button className={displayUnit === 'g' ? 'active' : ''} onClick={() => onDisplayUnitChange('g')} aria-pressed={displayUnit === 'g'}>Grams</button>
        <button className={displayUnit === 'oz' ? 'active' : ''} onClick={() => onDisplayUnitChange('oz')} aria-pressed={displayUnit === 'oz'}>Ounces</button>
        <button className={displayUnit === 'both' ? 'active' : ''} onClick={() => onDisplayUnitChange('both')} aria-pressed={displayUnit === 'both'}>Both</button>
      </div>
      <div className="mobile-result-metrics">
        <div><span>Per application</span><strong>{quantity(result.formulationAdjustedGramsPerApplication)}</strong><small>{formatNumber(result.ftuPerApplication, 2)} FTU</small></div>
        <div><span>Calculated need</span><strong>{quantity(result.finalRequiredGrams)}</strong><small>{formatNumber(result.totalApplications, 2)} applications</small></div>
      </div>
      <button type="button" className="mobile-copy-button" onClick={copy}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? 'Copied' : 'Copy summary'}</button>
    </div>
  </details>;
}

export default function App() {
  const [patientMode, setPatientMode] = useState<PatientMode>('adult');
  const [pediatricStage, setPediatricStage] = useState<PediatricStage>('younger');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('both');
  const [regions, setRegions] = useState(createBodyRegions);
  const [quickHandprints, setQuickHandprints] = useState(0);
  const [handprintOverrideEnabled, setHandprintOverrideEnabled] = useState(false);
  const [mirrorFrontBack, setMirrorFrontBack] = useState(false);
  const [painterClearSignal, setPainterClearSignal] = useState(0);
  const [activePresetIds, setActivePresetIds] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState<number>();
  const [weightKg, setWeightKg] = useState<number>();
  const [referenceBsa, setReferenceBsa] = useState<number>(CLINICAL_CONSTANTS.referenceBsa);
  const [applyBsa, setApplyBsa] = useState(false);
  const formulation: Formulation = 'Cream';
  const formulationFactor = 1;
  const applyFormulationFactor = false;
  const [frequency, setFrequency] = useState<FrequencyId>('bid');
  const [customApplications, setCustomApplications] = useState(3);
  const [durationValue, setDurationValue] = useState(14);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [allowancePercent, setAllowancePercent] = useState(0);
  const [packageSizes, setPackageSizes] = useState(createPackageSizes);

  const calculatedBsa = calculateMostellerBsa(heightCm, weightKg);
  const enteredAge = age.trim() === '' ? undefined : Number(age);
  const pediatricBsaDefault = patientMode === 'child'
    ? getPediatricBsaFallback(pediatricStage, Number.isFinite(enteredAge) ? enteredAge : undefined)
    : undefined;
  const pediatricReferenceAge = Number.isFinite(enteredAge)
    ? Math.max(0, Math.min(10, enteredAge!))
    : pediatricStage === 'infant' ? 1 : pediatricStage === 'younger' ? 4 : 8;
  const pediatricFtuReference = pediatricFtuReferenceFor(pediatricStage, Number.isFinite(enteredAge) ? enteredAge : undefined);
  const pediatricAdjustmentReference = pediatricFtuReference.id === 'adult'
    ? { bsa: referenceBsa, assumedAge: 'adult reference', ageRange: 'over 10 yr', isAgeSpecific: true }
    : pediatricBsaDefault;
  const adultRegionFtu = useMemo(() => regions.reduce((sum, region) => sum + (region.adultHandprints / 2) * region.selectedFraction, 0), [regions]);
  const regionFtu = patientMode === 'child' ? selectedPediatricFtu(regions, pediatricFtuReference) : adultRegionFtu;
  const selectedFtu = handprintOverrideEnabled ? quickHandprints / 2 : regionFtu;
  const selectedHandprints = handprintOverrideEnabled ? quickHandprints : selectedFtu * 2;
  const selectedBsaPercent = handprintOverrideEnabled
    ? quickHandprints * CLINICAL_CONSTANTS.bsaPercentPerHandprint
    : anatomicalBsaPercent(regions, patientMode === 'child' && pediatricFtuReference.id === 'adult' ? 'adult' : patientMode, pediatricReferenceAge);
  const modelBsa = calculatedBsa ?? pediatricAdjustmentReference?.bsa;
  const calculationReferenceBsa = patientMode === 'child' ? (pediatricAdjustmentReference?.bsa ?? referenceBsa) : referenceBsa;

  useEffect(() => {
    setApplyBsa(Boolean(calculatedBsa && calculatedBsa > 0));
  }, [calculatedBsa]);
  const schedule = getSchedule(frequency, customApplications, durationValue, durationUnit);
  const enabledPackageSizes = packageSizes.filter((item) => item.enabled).map((item) => item.grams);
  const inputs = useMemo(() => ({
    selectedHandprints,
    selectedFtu,
    selectedBsaPercent,
    formulation,
    formulationFactor,
    applyFormulationFactor,
    heightCm,
    weightKg,
    patientBsa: calculatedBsa,
    referenceBsa: calculationReferenceBsa,
    applyBsaAdjustment: applyBsa,
    applicationsPerDay: schedule.applicationsPerDay,
    applicationsPerWeek: schedule.applicationsPerWeek,
    totalApplications: schedule.totalApplications,
    durationDays: schedule.durationDays,
    allowancePercent,
    enabledPackageSizes,
  }), [selectedHandprints, selectedFtu, selectedBsaPercent, formulation, formulationFactor, applyFormulationFactor, heightCm, weightKg, calculatedBsa, calculationReferenceBsa, applyBsa, schedule.applicationsPerDay, schedule.applicationsPerWeek, schedule.totalApplications, schedule.durationDays, allowancePercent, enabledPackageSizes.join('|')]);
  const result = useMemo(() => calculateFtu(inputs), [inputs]);
  const warnings = [...validateInputs(inputs), ...quantityWarnings(result.finalRequiredGrams)];

  const selectedRegions = regions.filter((region) => region.selectedFraction > 0);
  const selectedPresets = PROTOCOL_PRESETS.filter((preset) => activePresetIds.includes(preset.id));
  const effectivePresets = selectedPresets.filter((preset) => !selectedPresets.some((other) =>
    other.id !== preset.id && preset.regionIds.every((regionId) => other.regionIds.includes(regionId))
  ));
  const activePresetLabels = effectivePresets.map((preset) => preset.label);
  const presetRegionIds = new Set(effectivePresets.flatMap((preset) => preset.regionIds));
  const additionalRegions = selectedRegions.filter((region) => !presetRegionIds.has(region.id));
  const describedAreas = [...activePresetLabels.map((label) => label.toLowerCase()), ...additionalRegions.map((region) => region.label.toLowerCase())];
  const formatAreaList = (areas: string[]) => areas.length <= 1
    ? areas[0]
    : areas.length === 2
      ? areas.join(' and ')
      : `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`;
  const areaDescription = handprintOverrideEnabled
    ? `${formatNumber(selectedHandprints, 2)} handprint equivalents (${formatNumber(result.approximateBsaPercent, 2)}% BSA)`
    : describedAreas.length === 0
      ? 'no area selected'
      : describedAreas.length <= 3
        ? formatAreaList(describedAreas)
        : `affected areas, including ${formatAreaList(describedAreas.slice(0, 3))}`;
  const frequencyLabel = FREQUENCIES.find((item) => item.id === frequency)?.label ?? frequency;
  const durationLabel = `${formatNumber(durationValue, 2)} ${durationUnit}`;
  const suggestedPackageLabel = result.suggestedPackages.length ? result.suggestedPackages.map((grams) => `${formatNumber(grams, 1)} g`).join(' + ') : 'No package configured';
  const displayQuantity = (grams: number, practical = false) => {
    const gramText = `${formatNumber(grams, practical ? 1 : 2)} g`;
    if (displayUnit === 'g') return gramText;
    if (displayUnit === 'oz') return formatOunces(grams);
    return `${gramText} / ${formatOunces(grams)}`;
  };
  const updateAge = (value: string) => {
    setAge(value);
    if (value.trim() === '') return;
    const ageYears = Number(value);
    if (Number.isFinite(ageYears) && ageYears >= 0) setPediatricStage(pediatricStageForAge(ageYears));
  };

  const patientSizeProps = {
    patientMode,
    pediatricStage,
    pediatricBsaDefault: pediatricAdjustmentReference,
    pediatricFtuReference,
    age,
    heightCm,
    weightKg,
    referenceBsa: calculationReferenceBsa,
    adultReferenceBsa: referenceBsa,
    applyBsa,
    onPatientModeChange: setPatientMode,
    onPediatricStageChange: (stage: PediatricStage) => { setPediatricStage(stage); setAge(''); },
    onAgeChange: updateAge,
    onHeightChange: setHeightCm,
    onWeightChange: setWeightKg,
    onReferenceBsaChange: setReferenceBsa,
    onApplyBsaChange: setApplyBsa,
  };
  const regimenProps = {
    frequency,
    customApplications,
    durationValue,
    durationUnit,
    allowancePercent,
    totalApplications: schedule.totalApplications,
    daysPerMonth: CLINICAL_CONSTANTS.daysPerMonth,
    onFrequencyChange: setFrequency,
    onCustomApplicationsChange: setCustomApplications,
    onDurationValueChange: setDurationValue,
    onDurationUnitChange: setDurationUnit,
    onAllowanceChange: setAllowancePercent,
  };
  const mobileSummary = `Apply to ${areaDescription} ${frequencyLabel.toLowerCase()} for ${durationLabel}. Estimated amount per application: ${formatNumber(result.ftuPerApplication, 2)} FTU (${formatNumber(result.formulationAdjustedGramsPerApplication, 2)} g). Estimated treatment requirement: ${formatNumber(result.finalRequiredGrams, 2)} g. Suggested quantity to dispense: ${suggestedPackageLabel}.`;

  const updateRegion = (id: string, fraction: number, paintedSegments?: number[]) => {
    const segments = paintedSegments
      ? [...new Set(paintedSegments.filter((segment) => segment >= 0 && segment < 5))].sort((a, b) => a - b)
      : Array.from({ length: Math.round(Math.max(0, Math.min(1, fraction)) * 5) }, (_, index) => index);
    setRegions((current) => current.map((region) => region.id === id ? { ...region, selectedFraction: segments.length / 5, paintedSegments: segments } : region));
    setHandprintOverrideEnabled(false);
    if (segments.length < 5) {
      setActivePresetIds((current) => current.filter((presetId) => {
        const preset = PROTOCOL_PRESETS.find((item) => item.id === presetId);
        return !preset?.regionIds.includes(id);
      }));
    }
  };

  const clearPaintedArea = () => {
    setRegions(createBodyRegions());
    setHandprintOverrideEnabled(false);
    setActivePresetIds([]);
  };

  const reset = () => {
    setPatientMode('adult');
    setPediatricStage('younger');
    setDisplayUnit('both');
    setRegions(createBodyRegions());
    setQuickHandprints(0);
    setHandprintOverrideEnabled(false);
    setMirrorFrontBack(false);
    setActivePresetIds([]);
    setAge('');
    setHeightCm(undefined);
    setWeightKg(undefined);
    setReferenceBsa(CLINICAL_CONSTANTS.referenceBsa);
    setApplyBsa(false);
    setFrequency('bid');
    setCustomApplications(3);
    setDurationValue(14);
    setDurationUnit('days');
    setAllowancePercent(0);
    setPackageSizes(createPackageSizes());
    setPainterClearSignal((current) => current + 1);
  };

  const applyPreset = (preset: ProtocolPreset) => {
    const selectedIds = new Set(preset.regionIds);
    setRegions((current) => current.map((region) => selectedIds.has(region.id)
      ? { ...region, selectedFraction: 1, paintedSegments: [0, 1, 2, 3, 4] }
      : region));
    setHandprintOverrideEnabled(false);
    setActivePresetIds((current) => current.includes(preset.id) ? current : [...current, preset.id]);
    setFrequency('bid');
    setDurationValue(14);
    setDurationUnit('days');
    setAllowancePercent(0);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><img className="brand-logo" src="/FTU-Calc/quantiderm-logo.png" alt="QuantiDerm — topical quantity calculator" /><h1 className="sr-only">QuantiDerm topical quantity calculator</h1></div>
        <section key={`${result.suggestedDispensedGrams}-${result.finalRequiredGrams}`} className="header-estimate quantity-updated" aria-live="polite" aria-label="Live dispensing estimate">
          <div className="header-estimate-main"><span>Suggested dispense</span><strong>{displayQuantity(result.suggestedDispensedGrams, true)}</strong><small>{suggestedPackageLabel}</small></div>
          <div className="header-estimate-exact"><span>Calculated need</span><strong>{displayQuantity(result.finalRequiredGrams)}</strong></div>
          <div className="segmented compact-toggle header-unit-toggle" role="group" aria-label="Display units">
            <button className={displayUnit === 'g' ? 'active' : ''} onClick={() => setDisplayUnit('g')} aria-pressed={displayUnit === 'g'}>Grams</button>
            <button className={displayUnit === 'oz' ? 'active' : ''} onClick={() => setDisplayUnit('oz')} aria-pressed={displayUnit === 'oz'}>Ounces</button>
            <button className={displayUnit === 'both' ? 'active' : ''} onClick={() => setDisplayUnit('both')} aria-pressed={displayUnit === 'both'}>Both</button>
          </div>
        </section>
        <div className="header-controls">
          <button className="reset-button" onClick={reset}><RotateCcw size={17} /> Reset</button>
        </div>
      </header>

      <main className="workspace">
        <div className="left-stack">
          <section className="card area-card" id="area-section">
            <div className="area-heading">
              <div><span className="step-label">01 · Treatment area</span><h2>Where will it be applied?</h2><p>Select entire regions or estimate the affected portion.</p></div>
              <div className="area-live"><span>{handprintOverrideEnabled ? 'Manual override' : 'Selected area'}</span><strong>{formatNumber(result.ftuPerApplication, 2)} <small>FTU</small></strong><em>{formatNumber(result.approximateBsaPercent, 2)}% estimated BSA</em></div>
            </div>
            <ReferencePanel onPreset={applyPreset} activePresetIds={activePresetIds} patientMode={patientMode} pediatricFtuReference={pediatricFtuReference} />
            <AnatomyPainter regions={regions} patientMode={patientMode} pediatricStage={pediatricStage} pediatricFtuReference={pediatricFtuReference} heightCm={heightCm} weightKg={weightKg} modelBsa={modelBsa} clearSignal={painterClearSignal} mobilePatientPanel={<PatientSizePanel {...patientSizeProps} />} mobileSchedulePanel={<RegimenPanel {...regimenProps} />} mirrorFrontBack={mirrorFrontBack} onMirrorFrontBackChange={setMirrorFrontBack} onChange={updateRegion} onClear={clearPaintedArea} />
            <details className="text-region-entry"><summary>Text-based region entry</summary><AnatomyRegionList regions={regions} patientMode={patientMode} pediatricFtuReference={pediatricFtuReference} onChange={updateRegion} onClear={() => { clearPaintedArea(); setPainterClearSignal((current) => current + 1); }} /></details>
            <p className="reference-note"><CheckCircle2 size={15} /> {patientMode === 'child'
              ? `Child quantities use the ${pediatricFtuReference.label} regional FTU table. Scalp and genital values are proportional estimates because those surfaces are not listed separately in the pediatric table.`
              : BODY_REGION_REFERENCE_NOTE}</p>
          </section>
        </div>

        <div className="controls-stack">
          <div className="workflow-middle">
            <RegimenPanel {...regimenProps} />
            <PatientSizePanel {...patientSizeProps} />
          </div>
          <div className="workflow-right">
            <ResultsPanel result={result} displayUnit={displayUnit} regions={handprintOverrideEnabled ? [] : regions} selectedHandprints={selectedHandprints} areaDescription={areaDescription} activePresetLabels={activePresetLabels} patientMode={patientMode} pediatricStage={pediatricStage} heightCm={heightCm} weightKg={weightKg} effectiveBsa={calculatedBsa} applyBsa={applyBsa} frequencyLabel={frequencyLabel} durationLabel={durationLabel} allowancePercent={allowancePercent} warnings={warnings} pediatricFtuReference={pediatricFtuReference} />
            <HandprintOverride enabled={handprintOverrideEnabled} handprints={quickHandprints} onChange={(value) => { setQuickHandprints(value); setHandprintOverrideEnabled(true); setActivePresetIds([]); }} onClear={() => setHandprintOverrideEnabled(false)} />
            <PackageSelector packages={packageSizes} onChange={setPackageSizes} />
          </div>
        </div>

      </main>

      <section className="methodology card">
        <details>
          <summary><span><HelpCircle size={20} /> Methodology &amp; help</span><small>FTUs, handprints, adjustments, and rounding</small></summary>
          <div className="method-grid">
            <article><h3>What is an FTU?</h3><p>One fingertip unit is a line of topical medication expressed from a standard 5 mm nozzle, from the distal index-finger joint to the fingertip. The commonly used convention is 1 FTU = 0.5 g, covering two adult handprints.</p></article>
            <article><h3>What is a handprint?</h3><p>The palmar surface of an adult hand and fingers averages about 0.8% BSA. Handprint entry is a quick area estimate; the anatomical painter uses body-region surface proportions, so the two measures are not forced to be identical.</p></article>
            <article><h3>How are grams calculated?</h3><p>FTUs per application × 0.5 g gives the estimated amount per application. Adult regions use the standard regional FTU table. Child regions use age-band, body-region FTUs expressed with an adult finger.</p></article>
            <article><h3>Patient BSA adjustment</h3><p>The Mosteller formula is √[(height in cm × weight in kg) ÷ 3600]. Pediatric regional FTUs provide the baseline child estimate. If measured height and weight are entered, the optional size adjustment compares measured BSA with the representative BSA for the selected pediatric age—not with an adult baseline.</p></article>
            <article><h3>Why round up?</h3><p>A dispensing recommendation must cover the mathematical requirement. One package or matching package sizes are preferred within a practical excess allowance: 20% of need, with a 20 g floor and 30 g cap. Otherwise the recommendation minimizes excess and then container count. Actual use may vary with thickness, body site, hair, dressings, skin surface, and adherence.</p></article>
          </div>
        </details>
        <nav className="clinical-basis" aria-label="Clinical source material">
          <span className="clinical-basis-label"><BookOpen size={15} /> Clinical basis</span>
          <div className="clinical-basis-links">
            {CLINICAL_REFERENCE_LINKS.map((reference) => (
              <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" title={reference.note}>
                <span>{reference.label}<small>{reference.topic}</small></span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </nav>
      </section>

      <footer><p>This calculator provides an estimate based on fingertip-unit and handprint methods. Actual topical medication use may vary by product, vehicle, body site, skin condition, and application technique. Verify the prescribed regimen and available package sizes before dispensing.</p><span>QuantiDerm 1.1 · clinical references reviewed July 2026 · a LokTin Labs tool</span></footer>

      <MobileResultsDrawer result={result} displayUnit={displayUnit} onDisplayUnitChange={setDisplayUnit} summary={mobileSummary} />
    </div>
  );
}
