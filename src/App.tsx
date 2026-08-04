import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, HelpCircle, RotateCcw } from 'lucide-react';
import { AnatomyPainter } from './components/AnatomyPainter';
import { AnatomyRegionList } from './components/AnatomyRegionList';
import { PatientSizePanel } from './components/PatientSizePanel';
import { RegimenPanel } from './components/RegimenPanel';
import { PackageSelector } from './components/PackageSelector';
import { HandprintOverride } from './components/HandprintOverride';
import { ResultsPanel } from './components/ResultsPanel';
import { MobileResultsDrawer } from './components/MobileResultsDrawer';
import { ReferencePanel } from './components/ReferencePanel';
import { BODY_REGION_REFERENCE_NOTE, createBodyRegions } from './data/bodyRegions';
import { createPackageSizes } from './data/packageSizes';
import { PROTOCOL_PRESETS } from './data/protocolPresets';
import { CLINICAL_REFERENCE_LINKS } from './data/clinicalReferences';
import { assessSelectedPediatricFtu, resolvePediatricFtuReference } from './data/pediatricFtu';
import type { DisplayUnit, DurationUnit, Formulation, FrequencyId, PatientMode, PediatricStage, ProtocolPreset } from './types/calculator';
import { CLINICAL_CONSTANTS, getPediatricBsaFallback, pediatricStageForAge } from './config/clinical';
import { assessPatientSize } from './lib/bsa';
import { calculateFtu } from './lib/ftuCalculations';
import { assessAnatomicalBsaPercent } from './lib/anatomicalBsa';
import { durationValueForUnitChange, FREQUENCIES, getSchedule } from './lib/schedule';
import { formatNumber, formatOunces } from './lib/unitConversions';
import { buildConciseResultAnnouncement, shouldShowMobileResults, type ResultPresentation } from './lib/resultPresentation';
import { hasMeaningfulResetState } from './lib/resetState';
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
  const [ageMonths, setAgeMonths] = useState('');
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

  const enteredAge = age.trim() === '' ? undefined : Number(age);
  const enteredAgeMonths = ageMonths.trim() === '' ? undefined : Number(ageMonths);
  const resolvedPediatricAgeYears = Number.isFinite(enteredAgeMonths)
    ? enteredAgeMonths! / 12
    : Number.isFinite(enteredAge) ? enteredAge : undefined;
  const patientSizeAssessment = assessPatientSize(heightCm, weightKg, {
    patientMode,
    ageYears: Number.isFinite(enteredAge) ? enteredAge : undefined,
    ageMonths: Number.isFinite(enteredAgeMonths) ? enteredAgeMonths : undefined,
  });
  const calculatedBsa = patientSizeAssessment.bsa;
  const pediatricBsaDefault = patientMode === 'child'
    ? getPediatricBsaFallback(pediatricStage, resolvedPediatricAgeYears)
    : undefined;
  const pediatricReferenceAge = Number.isFinite(resolvedPediatricAgeYears)
    ? Math.max(0, Math.min(10, resolvedPediatricAgeYears!))
    : pediatricStage === 'infant' ? 1 : pediatricStage === 'younger' ? 4 : 8;
  const pediatricAgeResolution = resolvePediatricFtuReference(
    pediatricStage,
    Number.isFinite(enteredAge) ? enteredAge : undefined,
    Number.isFinite(enteredAgeMonths) ? enteredAgeMonths : undefined,
  );
  const pediatricFtuReference = pediatricAgeResolution.reference;
  const pediatricAdjustmentReference = pediatricFtuReference.id === 'adult'
    ? { bsa: referenceBsa, assumedAge: 'adult reference', ageRange: 'over 10 yr', isAgeSpecific: true }
    : pediatricBsaDefault;
  const adultRegionFtu = useMemo(() => regions.reduce((sum, region) => sum + (region.adultHandprints / 2) * region.selectedFraction, 0), [regions]);
  const pediatricSelection = assessSelectedPediatricFtu(regions, pediatricFtuReference);
  const anatomicalBsaAssessment = assessAnatomicalBsaPercent(
    regions,
    patientMode === 'child' && pediatricFtuReference.id === 'adult' ? 'adult' : patientMode,
    pediatricReferenceAge,
  );
  const regionFtu = patientMode === 'child' ? pediatricSelection.ftu : adultRegionFtu;
  const selectedFtu = handprintOverrideEnabled ? quickHandprints / 2 : regionFtu;
  const selectedHandprints = handprintOverrideEnabled ? quickHandprints : selectedFtu * 2;
  const selectedBsaPercent = handprintOverrideEnabled
    ? quickHandprints * CLINICAL_CONSTANTS.bsaPercentPerHandprint
    : anatomicalBsaAssessment.percent;
  const modelBsa = calculatedBsa ?? pediatricAdjustmentReference?.bsa;
  const calculationReferenceBsa = patientMode === 'child' ? (pediatricAdjustmentReference?.bsa ?? referenceBsa) : referenceBsa;

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
    upstreamIssues: [
      ...patientSizeAssessment.issues,
      ...schedule.issues,
      ...(patientMode === 'child' ? pediatricAgeResolution.issues : []),
      ...(!handprintOverrideEnabled && patientMode === 'child' ? pediatricSelection.issues : []),
      ...(!handprintOverrideEnabled ? anatomicalBsaAssessment.issues : []),
    ],
  }), [selectedHandprints, selectedFtu, selectedBsaPercent, formulation, formulationFactor, applyFormulationFactor, heightCm, weightKg, calculatedBsa, calculationReferenceBsa, applyBsa, schedule.applicationsPerDay, schedule.applicationsPerWeek, schedule.totalApplications, schedule.durationDays, schedule.issues, allowancePercent, enabledPackageSizes.join('|'), patientSizeAssessment.issues, patientMode, pediatricAgeResolution.issues, pediatricSelection.issues, anatomicalBsaAssessment.issues, handprintOverrideEnabled]);
  const result = useMemo(() => calculateFtu(inputs), [inputs]);

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
  const durationLabel = durationValue > 0 ? `${formatNumber(durationValue, 2)} ${durationUnit}` : 'an unspecified duration';
  const suggestedPackageLabel = result.status.isBlocking
    ? 'Recommendation blocked'
    : result.suggestedPackages.length ? result.suggestedPackages.map((grams) => `${formatNumber(grams, 1)} g`).join(' + ') : 'No package configured';
  const displayQuantity = (grams: number, practical = false) => {
    const gramText = `${formatNumber(grams, practical ? 1 : 2)} g`;
    if (displayUnit === 'g') return gramText;
    if (displayUnit === 'oz') return formatOunces(grams);
    return `${gramText} / ${formatOunces(grams)}`;
  };
  const updateAge = (value: string) => {
    setAge(value);
    setAgeMonths('');
    if (value.trim() === '') return;
    const ageYears = Number(value);
    if (Number.isFinite(ageYears) && ageYears >= 0) setPediatricStage(pediatricStageForAge(ageYears));
  };
  const updateAgeMonths = (value: string) => {
    setAgeMonths(value);
    setAge('');
    if (value.trim() === '') return;
    const months = Number(value);
    if (Number.isFinite(months) && months >= 0) setPediatricStage(pediatricStageForAge(months / 12));
  };
  const changePatientMode = (mode: PatientMode) => {
    if (mode === patientMode) return;
    setPatientMode(mode);
    setAge('');
    setAgeMonths('');
    setHeightCm(undefined);
    setWeightKg(undefined);
    setApplyBsa(false);
    if (mode === 'child') setPediatricStage('younger');
  };
  const changeDurationUnit = (unit: DurationUnit) => {
    setDurationValue(durationValueForUnitChange(durationValue, durationUnit, unit));
    setDurationUnit(unit);
  };

  const patientSizeProps = {
    patientMode,
    pediatricStage,
    pediatricBsaDefault: pediatricAdjustmentReference,
    pediatricFtuReference,
    age,
    ageMonths,
    heightCm,
    weightKg,
    referenceBsa: calculationReferenceBsa,
    adultReferenceBsa: referenceBsa,
    applyBsa,
    onPatientModeChange: changePatientMode,
    onPediatricStageChange: (stage: PediatricStage) => { setPediatricStage(stage); setAge(''); setAgeMonths(''); },
    onAgeChange: updateAge,
    onAgeMonthsChange: updateAgeMonths,
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
    onDurationUnitChange: changeDurationUnit,
    onAllowanceChange: setAllowancePercent,
  };
  const resultPresentation: ResultPresentation = {
    result,
    regions: handprintOverrideEnabled ? [] : regions,
    selectedHandprints,
    areaDescription,
    activePresetLabels,
    patientMode,
    pediatricStage,
    heightCm,
    weightKg,
    effectiveBsa: calculatedBsa,
    referenceBsa: calculationReferenceBsa,
    applyBsa,
    frequencyLabel,
    durationLabel,
    allowancePercent,
    pediatricFtuReference,
  };
  const showMobileResults = shouldShowMobileResults(resultPresentation);
  const issueAnnouncement = result.status.issues.map((issue) => `${issue.severity === 'blocking' ? 'Blocking issue' : 'Warning'}: ${issue.message}`).join(' ');
  const resultAnnouncement = buildConciseResultAnnouncement(resultPresentation);

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
    setAgeMonths('');
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

  const requestReset = () => {
    const shouldConfirm = hasMeaningfulResetState({
      patientMode,
      selectedRegionCount: selectedRegions.length,
      handprintOverrideEnabled,
      quickHandprints,
      mirrorFrontBack,
      activePresetCount: activePresetIds.length,
      age,
      ageMonths,
      heightCm,
      weightKg,
      referenceBsa,
      defaultReferenceBsa: CLINICAL_CONSTANTS.referenceBsa,
      applyBsa,
      frequency,
      customApplications,
      durationValue,
      durationUnit,
      allowancePercent,
      packageSizes,
      defaultPackageSizes: createPackageSizes(),
    });
    if (shouldConfirm && !window.confirm('Reset the treatment area, patient information, regimen, and package changes?')) return;
    reset();
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
    <div className={`app-shell${showMobileResults ? ' has-mobile-result-dock' : ''}${result.status.issues.length ? ' has-mobile-result-issues' : ''}`}>
      <div className="sr-only" role="alert" aria-atomic="true">{issueAnnouncement}</div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{resultAnnouncement}</div>
      <header className="topbar">
        <div className="brand"><img className="brand-logo" src="/FTU-Calc/quantiderm-logo.png" alt="QuantiDerm — topical quantity calculator" /><span className="beta-badge" title="QuantiDerm is currently in beta">Beta v0.9</span><h1 className="sr-only">QuantiDerm topical quantity calculator, beta version 0.9</h1></div>
        <section key={`${result.suggestedDispensedGrams}-${result.finalRequiredGrams}`} className="header-estimate quantity-updated" aria-label="Current dispensing estimate">
          <div className="header-estimate-main"><span>Suggested dispense</span><strong>{result.status.isBlocking ? 'Review inputs' : displayQuantity(result.suggestedDispensedGrams, true)}</strong><small>{suggestedPackageLabel}</small></div>
          <div className="header-estimate-exact"><span>Calculated need</span><strong>{displayQuantity(result.finalRequiredGrams)}</strong></div>
          <div className="segmented compact-toggle header-unit-toggle" role="group" aria-label="Display units">
            <button className={displayUnit === 'g' ? 'active' : ''} onClick={() => setDisplayUnit('g')} aria-pressed={displayUnit === 'g'}>Grams</button>
            <button className={displayUnit === 'oz' ? 'active' : ''} onClick={() => setDisplayUnit('oz')} aria-pressed={displayUnit === 'oz'}>Ounces</button>
            <button className={displayUnit === 'both' ? 'active' : ''} onClick={() => setDisplayUnit('both')} aria-pressed={displayUnit === 'both'}>Both</button>
          </div>
        </section>
        <div className="header-controls">
          <button type="button" className="reset-button" onClick={requestReset}><RotateCcw size={17} /> Reset</button>
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
              ? `Child quantities use the ${pediatricFtuReference.label} broad-region FTU table. Every smaller painter subdivision is a proportional allocation of its cited broad-region total; scalp and genital values are additional proportional estimates because those surfaces are not listed separately.`
              : BODY_REGION_REFERENCE_NOTE}</p>
          </section>
        </div>

        <div className="controls-stack">
          <div className="workflow-middle">
            <RegimenPanel {...regimenProps} />
            <PatientSizePanel {...patientSizeProps} />
          </div>
          <div className="workflow-right">
            <ResultsPanel presentation={resultPresentation} displayUnit={displayUnit} />
            <HandprintOverride enabled={handprintOverrideEnabled} handprints={quickHandprints} onChange={(value) => { setQuickHandprints(value); setHandprintOverrideEnabled(true); setActivePresetIds([]); }} onClear={() => setHandprintOverrideEnabled(false)} />
            <PackageSelector packages={packageSizes} onChange={setPackageSizes} />
          </div>
        </div>

      </main>

      <section className="methodology card">
        <details>
          <summary><span><HelpCircle size={20} /> Methodology &amp; help</span><small>FTUs, handprints, adjustments, and rounding</small></summary>
          <div className="method-grid">
            <article><h3>What is an FTU?</h3><p>One fingertip unit is a line of topical medication expressed from a standard 5 mm nozzle, from the distal index-finger joint to the fingertip. QuantiDerm uses the conventional 1 FTU = 0.5 g estimate. Actual mass varies with product, vehicle, nozzle, and the applying finger.</p></article>
            <article><h3>What is a handprint?</h3><p>The independent handprint/BSA override uses 1 adult handprint = 0.8% BSA = 0.25 g and replaces the painter. Regional FTU tables are independently rounded clinical guidance, so the painter and a 100% BSA override are not expected to reconcile.</p></article>
            <article><h3>How are grams calculated?</h3><p>FTUs per application × 0.5 g gives the estimated amount per application. Adult regions use the standard regional FTU table. Child regions use age-band, body-region FTUs expressed with an adult finger.</p></article>
            <article><h3>Patient BSA adjustment</h3><p>The Mosteller formula is √[(height in cm × weight in kg) ÷ 3600]. Adjustment stays off until explicitly enabled. Pediatric regional FTUs provide the baseline; measured BSA is compared with the age reference. Extreme ratios are blocked, and Mosteller estimates require added caution in neonates and infants.</p></article>
            <article><h3>Why round up?</h3><p>A recommendation must cover the mathematical requirement. One package or matching sizes may be preferred when excess is within 20% of need, with a 20 g floor and 30 g cap. Otherwise the rule minimizes excess, then container count. Actual use may vary with product, thickness, site, hair, dressings, surface, and adherence.</p></article>
          </div>
        </details>
        <nav className="clinical-basis" aria-label="Clinical source material">
          <span className="clinical-basis-label"><BookOpen size={15} /> Resources</span>
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

      <footer><p>Beta estimate only. Actual topical medication use may vary by product, vehicle, body site, skin condition, and application technique. Independently verify the inputs, calculation, prescribed regimen, and available package sizes before prescribing or dispensing. QuantiDerm does not replace clinical judgment or product-specific guidance.</p><span>QuantiDerm v0.9 beta · clinical references reviewed July 2026 · a LokTin Labs tool</span></footer>

      {showMobileResults && <MobileResultsDrawer presentation={resultPresentation} displayUnit={displayUnit} onDisplayUnitChange={setDisplayUnit} />}
    </div>
  );
}
