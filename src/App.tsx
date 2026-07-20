import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw } from 'lucide-react';
import { AnatomyPainter } from './components/AnatomyPainter';
import { PatientSizePanel } from './components/PatientSizePanel';
import { RegimenPanel } from './components/RegimenPanel';
import { PackageSelector } from './components/PackageSelector';
import { HandprintOverride } from './components/HandprintOverride';
import { ResultsPanel } from './components/ResultsPanel';
import { ReferencePanel } from './components/ReferencePanel';
import { BODY_REGION_REFERENCE_NOTE, createBodyRegions } from './data/bodyRegions';
import { createPackageSizes } from './data/packageSizes';
import { PROTOCOL_PRESETS } from './data/protocolPresets';
import { ADULT_FTU_REFERENCE_GROUPS, CLINICAL_REFERENCE_LINKS } from './data/clinicalReferences';
import type { DisplayUnit, DurationUnit, Formulation, FrequencyId, PatientMode, PediatricStage, ProtocolPreset } from './types/calculator';
import { CLINICAL_CONSTANTS, getPediatricBsaFallback, pediatricStageForAge } from './config/clinical';
import { calculateMostellerBsa } from './lib/bsa';
import { calculateFtu } from './lib/ftuCalculations';
import { FREQUENCIES, getSchedule } from './lib/schedule';
import { quantityWarnings, validateInputs } from './lib/validation';
import { formatNumber, formatOunces } from './lib/unitConversions';
import './styles.css';

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

  const regionHandprints = useMemo(() => regions.reduce((sum, region) => sum + region.adultHandprints * region.selectedFraction, 0), [regions]);
  const selectedHandprints = handprintOverrideEnabled ? quickHandprints : regionHandprints;
  const calculatedBsa = calculateMostellerBsa(heightCm, weightKg);
  const enteredAge = age.trim() === '' ? undefined : Number(age);
  const pediatricBsaDefault = patientMode === 'child'
    ? getPediatricBsaFallback(pediatricStage, Number.isFinite(enteredAge) ? enteredAge : undefined)
    : undefined;
  const effectiveBsa = calculatedBsa ?? pediatricBsaDefault?.bsa;
  const usingPediatricBsaDefault = patientMode === 'child' && calculatedBsa === undefined;

  useEffect(() => {
    setApplyBsa(Boolean(effectiveBsa && effectiveBsa > 0));
  }, [effectiveBsa]);
  const schedule = getSchedule(frequency, customApplications, durationValue, durationUnit);
  const enabledPackageSizes = packageSizes.filter((item) => item.enabled).map((item) => item.grams);
  const inputs = useMemo(() => ({
    selectedHandprints,
    formulation,
    formulationFactor,
    applyFormulationFactor,
    heightCm,
    weightKg,
    patientBsa: effectiveBsa,
    referenceBsa,
    applyBsaAdjustment: applyBsa,
    applicationsPerDay: schedule.applicationsPerDay,
    applicationsPerWeek: schedule.applicationsPerWeek,
    durationDays: schedule.durationDays,
    allowancePercent,
    enabledPackageSizes,
  }), [selectedHandprints, formulation, formulationFactor, applyFormulationFactor, heightCm, weightKg, effectiveBsa, referenceBsa, applyBsa, schedule.applicationsPerDay, schedule.applicationsPerWeek, schedule.durationDays, allowancePercent, enabledPackageSizes.join('|')]);
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
    setPainterClearSignal((current) => current + 1);
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
        <div className="brand"><img className="brand-logo" src="/FTU-Calc/dermdose-wordmark.png" alt="DermDose" /><div><h1>Topical Quantity Calculator</h1></div></div>
        <section key={`${result.suggestedDispensedGrams}-${result.finalRequiredGrams}`} className="header-estimate quantity-updated" aria-live="polite" aria-label="Live dispensing estimate">
          <div className="header-estimate-main"><span>Suggested dispense</span><strong>{displayQuantity(result.suggestedDispensedGrams, true)}</strong><small>{suggestedPackageLabel}</small></div>
          <div className="header-estimate-exact"><span>Exact need</span><strong>{displayQuantity(result.finalRequiredGrams)}</strong></div>
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
              <div className="area-live"><span>{handprintOverrideEnabled ? 'Manual override' : 'Selected area'}</span><strong>{formatNumber(selectedHandprints, 2)} <small>handprints</small></strong><em>{formatNumber(result.approximateBsaPercent, 2)}% estimated BSA</em></div>
            </div>
            <ReferencePanel onPreset={applyPreset} activePresetIds={activePresetIds} />
            <AnatomyPainter regions={regions} patientMode={patientMode} pediatricStage={pediatricStage} heightCm={heightCm} weightKg={weightKg} modelBsa={effectiveBsa} clearSignal={painterClearSignal} mirrorFrontBack={mirrorFrontBack} onMirrorFrontBackChange={setMirrorFrontBack} onChange={updateRegion} onClear={clearPaintedArea} />
            <p className="reference-note"><CheckCircle2 size={15} /> {BODY_REGION_REFERENCE_NOTE}</p>
          </section>
        </div>

        <div className="controls-stack">
          <div className="workflow-middle">
            <RegimenPanel frequency={frequency} customApplications={customApplications} durationValue={durationValue} durationUnit={durationUnit} allowancePercent={allowancePercent} totalApplications={schedule.totalApplications} daysPerMonth={CLINICAL_CONSTANTS.daysPerMonth} onFrequencyChange={setFrequency} onCustomApplicationsChange={setCustomApplications} onDurationValueChange={setDurationValue} onDurationUnitChange={setDurationUnit} onAllowanceChange={setAllowancePercent} />
            <PatientSizePanel patientMode={patientMode} pediatricStage={pediatricStage} pediatricBsaDefault={pediatricBsaDefault} age={age} heightCm={heightCm} weightKg={weightKg} referenceBsa={referenceBsa} applyBsa={applyBsa} onPatientModeChange={setPatientMode} onPediatricStageChange={setPediatricStage} onAgeChange={updateAge} onHeightChange={setHeightCm} onWeightChange={setWeightKg} onReferenceBsaChange={setReferenceBsa} onApplyBsaChange={setApplyBsa} />
          </div>
          <div className="workflow-right">
            <ResultsPanel result={result} displayUnit={displayUnit} regions={handprintOverrideEnabled ? [] : regions} selectedHandprints={selectedHandprints} areaDescription={areaDescription} activePresetLabels={activePresetLabels} patientMode={patientMode} pediatricStage={pediatricStage} heightCm={heightCm} weightKg={weightKg} effectiveBsa={effectiveBsa} applyBsa={applyBsa} frequencyLabel={frequencyLabel} durationLabel={durationLabel} allowancePercent={allowancePercent} warnings={warnings} usingPediatricBsaDefault={usingPediatricBsaDefault} pediatricBsaDefault={pediatricBsaDefault} />
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
            <article><h3>What is a handprint?</h3><p>The palmar surface of an adult hand and fingers is approximately 0.8% BSA and requires about 0.25 g per application. The digital body model uses standardized adult region proportions, so its output is an estimate.</p></article>
            <article><h3>How are grams calculated?</h3><p>Selected handprint equivalents × 0.25 g gives the base amount per application. An optional BSA adjustment is applied before multiplying by the exact number of applications.</p></article>
            <article><h3>Patient BSA adjustment</h3><p>The Mosteller formula is √[(height in cm × weight in kg) ÷ 3600]. When a child’s measurements are unavailable, the estimate uses representative age-based BSA anchors and scales between them; entering an age refines the fallback. Measured height and weight take priority. Patient BSA is divided by the configurable 1.73 m² adult reference.</p></article>
            <article><h3>Why round up?</h3><p>A dispensing recommendation must cover the mathematical requirement. One package or matching package sizes are preferred within a practical excess allowance: 20% of need, with a 20 g floor and 30 g cap. Otherwise the recommendation minimizes excess and then container count. Actual use may vary with thickness, body site, hair, dressings, skin surface, and adherence.</p></article>
            <article className="reference-basis"><h3>Adult regional reference basis</h3><p>Practical values use the rounded consensus totals: {ADULT_FTU_REFERENCE_GROUPS.map((item) => `${item.label} ${item.ftu} FTU`).join('; ')}. Painter subdivisions are approximate, but each combined surface sums to its cited total. The 0.5 g/FTU convention is retained as a conservative standard estimate.</p><ul>{CLINICAL_REFERENCE_LINKS.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a><span>{reference.note}</span></li>)}</ul></article>
          </div>
        </details>
      </section>

      <footer><p>This calculator provides an estimate based on fingertip-unit and handprint methods. Actual topical medication use may vary by product, vehicle, body site, skin condition, and application technique. Verify the prescribed regimen and available package sizes before dispensing.</p><span>a LokTin Labs tool</span></footer>

      <div className="mobile-total"><div><span>Estimated requirement</span><strong>{formatNumber(result.finalRequiredGrams, 2)} g {displayUnit !== 'g' && `· ${formatOunces(result.finalRequiredGrams)}`}</strong></div><div><span>Suggested dispense</span><strong>{formatNumber(result.suggestedDispensedGrams, 1)} g</strong></div></div>
    </div>
  );
}
