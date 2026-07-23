import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Brush, CalendarDays, Eraser, PaintBucket, RotateCcw, SlidersHorizontal, Undo2 } from 'lucide-react';
import type { BodyRegion, BodyView, PatientMode, PediatricStage } from '../types/calculator';
import { CLINICAL_CONSTANTS } from '../config/clinical';
import { calculateBodyMorph, type BodyMorph } from '../lib/bodyMorph';
import { getPairedRegionId, mirrorSegmentIndex, resizePaintedSegments } from '../lib/anatomyPairing';
import { formatNumber } from '../lib/unitConversions';
import type { PediatricFtuReference } from '../data/pediatricFtu';
import { pediatricRegionFtu } from '../data/pediatricFtu';

type Tool = 'paint' | 'erase' | 'whole';

type Props = {
  regions: BodyRegion[];
  patientMode: PatientMode;
  pediatricStage: PediatricStage;
  pediatricFtuReference: PediatricFtuReference;
  heightCm?: number;
  weightKg?: number;
  modelBsa?: number;
  clearSignal: number;
  mobilePatientPanel?: ReactNode;
  mobileSchedulePanel?: ReactNode;
  mirrorFrontBack: boolean;
  onMirrorFrontBackChange: (enabled: boolean) => void;
  onChange: (id: string, fraction: number, paintedSegments?: number[]) => void;
  onClear: () => void;
};

const SEGMENT_COUNT = 5;
const ALL_SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, index) => index);

type FigureTransforms = {
  head: string;
  neck: string;
  upperTorso: string;
  abdomen: string;
  pelvis: string;
  canvasLeftArm: string;
  canvasRightArm: string;
  canvasLeftLeg: string;
  canvasRightLeg: string;
  buttocks: string;
};

type FigurePathVariant = 'abdomen-contour-front' | 'abdomen-contour-back' | 'abdomen-seam-front' | 'abdomen-seam-back';
type FigurePath = { d: string; part: keyof FigureTransforms; variant?: FigurePathVariant };

type CentralTorsoGeometry = { fill: string; contour: string; seam: string };

const getCentralTorsoGeometry = (morph: BodyMorph, view: BodyView): CentralTorsoGeometry => {
  const topY = view === 'front' ? 148 : 153;
  const topCurveY = view === 'front' ? 155 : 160;
  const bottomY = 217;
  const bottomCurveY = 223;
  const pelvisLeft = view === 'front' ? 62 : 61;
  const pelvisRight = view === 'front' ? 98 : 99;
  const topLeft = 80 + (57 - 80) * (morph.shoulderWidth / morph.torsoWidth);
  const topRight = 160 - topLeft;
  const bottomLeft = 80 + (pelvisLeft - 80) * (morph.pelvisWidth / morph.torsoWidth);
  const bottomRight = 160 - bottomLeft;
  const centralGain = Math.max(0, morph.torsoWidth - morph.shoulderWidth);
  const midLeft = 57 - centralGain * 2.5;
  const midRight = 160 - midLeft;

  return {
    fill: `M${topLeft} ${topY} Q80 ${topCurveY} ${topRight} ${topY} C${midRight} 174 ${midRight - 1} 198 ${bottomRight} ${bottomY} Q80 ${bottomCurveY} ${bottomLeft} ${bottomY} C${midLeft + 1} 198 ${midLeft} 174 ${topLeft} ${topY} Z`,
    contour: `M${topLeft} ${topY} C${midLeft} 174 ${midLeft + 1} 198 ${bottomLeft} ${bottomY} M${topRight} ${topY} C${midRight} 174 ${midRight - 1} 198 ${bottomRight} ${bottomY}`,
    seam: `M${topLeft} ${topY} Q80 ${topCurveY} ${topRight} ${topY}`,
  };
};

const ADULT_FIGURE_TRANSFORMS: FigureTransforms = {
  head: 'matrix(1.3 0 0 .95 -24 7.4)',
  neck: 'matrix(1.1 0 0 1 -8 3)',
  upperTorso: 'matrix(1.22 0 0 1 -17.6 0)',
  abdomen: 'matrix(1.22 0 0 1 -17.6 0)',
  pelvis: 'matrix(1.22 0 0 1 -17.6 0)',
  canvasLeftArm: 'matrix(1.18 0 -.04 1 -8.68 0)',
  canvasRightArm: 'matrix(1.18 0 .04 1 -20.12 0)',
  canvasLeftLeg: 'matrix(1.28 0 -.025 1 -15.045 0)',
  canvasRightLeg: 'matrix(1.28 0 .025 1 -29.755 0)',
  buttocks: 'matrix(1.22 0 0 1 -17.6 0)',
};

const PEDIATRIC_FIGURE_TRANSFORMS: Record<PediatricStage, FigureTransforms> = {
  older: {
    head: 'matrix(1.5 0 0 1.05 -40 1.6)',
    neck: 'matrix(1.1 0 0 1 -8 6)',
    upperTorso: 'matrix(1.3 0 0 1 -24 8)',
    abdomen: 'matrix(1.3 0 0 1 -24 8)',
    pelvis: 'matrix(1.3 0 0 1 -24 8)',
    canvasLeftArm: 'matrix(1.22 0 -.045 1 -10.68 6)',
    canvasRightArm: 'matrix(1.22 0 .045 1 -24.52 6)',
    canvasLeftLeg: 'matrix(1.38 0 -.025 .96 -19.3 17.04)',
    canvasRightLeg: 'matrix(1.38 0 .025 .96 -41.6 17.04)',
    buttocks: 'matrix(1.3 0 0 1 -24 8)',
  },
  younger: {
    head: 'matrix(1.8 0 0 1.18 -64 12.8)',
    neck: 'matrix(1.2 0 0 .78 -16 48)',
    upperTorso: 'matrix(1.55 0 0 .88 -44 40)',
    abdomen: 'matrix(1.55 0 0 .88 -44 40)',
    pelvis: 'matrix(1.55 0 0 .88 -44 40)',
    canvasLeftArm: 'matrix(1.4 0 -.055 .95 -23.7 30)',
    canvasRightArm: 'matrix(1.4 0 .055 .95 -40.3 30)',
    canvasLeftLeg: 'matrix(1.75 0 -.03 .88 -44.7 40)',
    canvasRightLeg: 'matrix(1.75 0 .03 .88 -75.3 40)',
    buttocks: 'matrix(1.55 0 0 .88 -44 40)',
  },
  infant: {
    head: 'matrix(2.15 0 0 1.3 -92 26.6)',
    neck: 'matrix(1.3 0 0 .55 -24 92.6)',
    upperTorso: 'matrix(1.9 0 0 .68 -72 81.5)',
    abdomen: 'matrix(1.9 0 0 .68 -72 81.5)',
    pelvis: 'matrix(1.9 0 0 .68 -72 81.5)',
    canvasLeftArm: 'matrix(1.65 0 -.065 .68 -39.15 80.7)',
    canvasRightArm: 'matrix(1.65 0 .065 .68 -64.85 80.7)',
    canvasLeftLeg: 'matrix(2.05 0 -.04 .72 -63.7 72.3)',
    canvasRightLeg: 'matrix(2.05 0 .04 .72 -104.3 72.3)',
    buttocks: 'matrix(1.9 0 0 .68 -72 81.5)',
  },
};

const morphTransform = (base: string, width: number, length: number, anchorY: number) =>
  `translate(80 ${anchorY}) scale(${width} ${length}) translate(-80 ${-anchorY}) ${base}`;

const applyBodyMorph = (base: FigureTransforms, morph: BodyMorph): FigureTransforms => ({
  head: morphTransform(base.head, morph.headWidth, 1, 52),
  neck: morphTransform(base.neck, morph.neckWidth, 1, 90),
  upperTorso: morphTransform(base.upperTorso, morph.shoulderWidth, morph.torsoLength, 94),
  abdomen: morphTransform(base.abdomen, morph.torsoWidth, morph.torsoLength, 94),
  pelvis: morphTransform(base.pelvis, morph.pelvisWidth, morph.torsoLength, 94),
  canvasLeftArm: morphTransform(base.canvasLeftArm, morph.armWidth, morph.armLength, 95),
  canvasRightArm: morphTransform(base.canvasRightArm, morph.armWidth, morph.armLength, 95),
  canvasLeftLeg: morphTransform(base.canvasLeftLeg, morph.legWidth, morph.legLength, 255),
  canvasRightLeg: morphTransform(base.canvasRightLeg, morph.legWidth, morph.legLength, 255),
  buttocks: morphTransform(base.buttocks, morph.buttockWidth, morph.buttockRoundness * (1 + (morph.torsoLength - 1) * 0.4), 217),
});

const FIGURE_CONTOURS: Record<BodyView, FigurePath[]> = {
  front: [
    { part: 'head', d: 'M80 18 C68 18 61 25 59.5 37 C58.5 48 60 63 63 72 C66 82 72 87 80 88 C88 87 94 82 97 72 C100 63 101.5 48 100.5 37 C99 25 92 18 80 18 Z' },
    { part: 'neck', d: 'M73 88 L70 96 M87 88 L90 96' },
    { part: 'upperTorso', d: 'M70 94 Q64 91 60 94 C56 108 55 128 57 148 M90 94 Q96 91 100 94 C104 108 105 128 103 148' },
    { part: 'abdomen', variant: 'abdomen-contour-front', d: '' },
    { part: 'pelvis', d: 'M62 217 C60 230 62 244 66 252 M98 217 C100 230 98 244 94 252' },
    { part: 'canvasLeftArm', d: 'M58 96 C49 93 42 98 39 107 C36 132 39 153 43 171 C44 191 45 211 47 229 C43 242 43 256 51 268 C58 257 59 245 57 228 C56 207 55 188 55 169 C55 141 56 115 60 99' },
    { part: 'canvasRightArm', d: 'M102 96 C111 93 118 98 121 107 C124 132 121 153 117 171 C116 191 115 211 113 229 C117 242 117 256 109 268 C102 257 101 245 103 228 C104 207 105 188 105 169 C105 141 104 115 100 99' },
    { part: 'canvasLeftLeg', d: 'M66 251 C61 276 60 305 63 332 C63 358 64 387 66 411 L57 427 Q56 433 62 435 L75 434 Q79 430 76 411 L74 332 L78 260' },
    { part: 'canvasRightLeg', d: 'M94 251 C99 276 100 305 97 332 C97 358 96 387 94 411 L103 427 Q104 433 98 435 L85 434 Q81 430 84 411 L86 332 L82 260' },
  ],
  back: [
    { part: 'head', d: 'M80 18 C68 18 61 25 59.5 37 C58.5 48 60 63 63 72 C66 82 72 87 80 88 C88 87 94 82 97 72 C100 63 101.5 48 100.5 37 C99 25 92 18 80 18 Z' },
    { part: 'neck', d: 'M73 88 L70 96 M87 88 L90 96' },
    { part: 'upperTorso', d: 'M70 94 Q64 91 60 94 C56 109 55 131 57 153 M90 94 Q96 91 100 94 C104 109 105 131 103 153' },
    { part: 'abdomen', variant: 'abdomen-contour-back', d: '' },
    { part: 'pelvis', d: 'M61 217 C60 231 62 245 66 252 M99 217 C100 231 98 245 94 252' },
    { part: 'canvasLeftArm', d: 'M58 96 C49 93 42 98 39 107 C36 132 39 153 43 171 C44 191 45 211 47 229 C43 242 43 256 51 268 C58 257 59 245 57 228 C56 207 55 188 55 169 C55 141 56 115 60 99' },
    { part: 'canvasRightArm', d: 'M102 96 C111 93 118 98 121 107 C124 132 121 153 117 171 C116 191 115 211 113 229 C117 242 117 256 109 268 C102 257 101 245 103 228 C104 207 105 188 105 169 C105 141 104 115 100 99' },
    { part: 'canvasLeftLeg', d: 'M66 251 C61 276 60 305 63 332 C63 358 64 387 66 411 L57 427 Q56 433 62 435 L75 434 Q79 430 76 411 L74 332 L78 260' },
    { part: 'canvasRightLeg', d: 'M94 251 C99 276 100 305 97 332 C97 358 96 387 94 411 L103 427 Q104 433 98 435 L85 434 Q81 430 84 411 L86 332 L82 260' },
  ],
};

const LIMB_SEAMS: FigurePath[] = [
  { part: 'canvasLeftArm', d: 'M58 96 Q59 94 60 99' },
  { part: 'canvasRightArm', d: 'M102 96 Q101 94 100 99' },
  { part: 'canvasLeftArm', d: 'M43 171 Q49 174 55 169' },
  { part: 'canvasLeftArm', d: 'M47 229 Q52 232 57 228' },
  { part: 'canvasRightArm', d: 'M105 169 Q111 174 117 171' },
  { part: 'canvasRightArm', d: 'M103 228 Q108 232 113 229' },
  { part: 'canvasLeftLeg', d: 'M66 251 Q72 255 78 260' },
  { part: 'canvasRightLeg', d: 'M82 260 Q88 255 94 251' },
  { part: 'canvasLeftLeg', d: 'M63 332 Q68 336 74 332' },
  { part: 'canvasLeftLeg', d: 'M66 411 Q71 415 76 411' },
  { part: 'canvasRightLeg', d: 'M86 332 Q92 336 97 332' },
  { part: 'canvasRightLeg', d: 'M84 411 Q89 415 94 411' },
];

const FIGURE_SEAMS: Record<BodyView, FigurePath[]> = {
  front: [
    { part: 'head', d: 'M60 46 Q80 51 100 46' },
    { part: 'neck', d: 'M70 96 Q80 101 90 96' },
    { part: 'abdomen', variant: 'abdomen-seam-front', d: '' },
    { part: 'pelvis', d: 'M62 217 Q80 223 98 217' },
    ...LIMB_SEAMS,
  ],
  back: [
    { part: 'neck', d: 'M73 88 Q80 92 87 88' },
    { part: 'neck', d: 'M70 96 Q80 101 90 96' },
    { part: 'abdomen', variant: 'abdomen-seam-back', d: '' },
    { part: 'pelvis', d: 'M61 217 Q80 223 99 217' },
    ...LIMB_SEAMS,
  ],
};

export function AnatomyPainter({ regions, patientMode, pediatricStage, pediatricFtuReference, heightCm, weightKg, modelBsa: suppliedModelBsa, clearSignal, mobilePatientPanel, mobileSchedulePanel, mirrorFrontBack, onMirrorFrontBackChange, onChange, onClear }: Props) {
  const [tool, setTool] = useState<Tool>('paint');
  const [isDragging, setIsDragging] = useState(false);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [mobileDrawer, setMobileDrawer] = useState<'size' | 'schedule' | null>(null);
  const [mobileView, setMobileView] = useState<BodyView>('front');
  const [historyDepth, setHistoryDepth] = useState(0);
  const lastBrushAt = useRef(0);
  const segmentMemory = useRef<Record<string, number[]>>({});
  const history = useRef<Array<{ segments: Record<string, number[]>; activeRegionId: string | null }>>([]);
  const activeRegion = regions.find((region) => region.id === activeRegionId);
  const bodyMorph = calculateBodyMorph({ patientMode, pediatricStage, heightCm, weightKg });
  const baseFigureTransforms = patientMode === 'adult' ? ADULT_FIGURE_TRANSFORMS : PEDIATRIC_FIGURE_TRANSFORMS[pediatricStage];
  const figureTransforms = applyBodyMorph(baseFigureTransforms, bodyMorph);
  const centralTorso = {
    front: getCentralTorsoGeometry(bodyMorph, 'front'),
    back: getCentralTorsoGeometry(bodyMorph, 'back'),
  };

  const getRegionDisplayPath = (region: BodyRegion) => {
    if (region.id === 'abdomen') return centralTorso.front.fill;
    if (region.id === 'lower-back') return centralTorso.back.fill;
    return region.path;
  };

  const getFigurePath = (item: FigurePath) => {
    if (item.variant === 'abdomen-contour-front') return centralTorso.front.contour;
    if (item.variant === 'abdomen-contour-back') return centralTorso.back.contour;
    if (item.variant === 'abdomen-seam-front') return centralTorso.front.seam;
    if (item.variant === 'abdomen-seam-back') return centralTorso.back.seam;
    return item.d;
  };

  useEffect(() => {
    regions.forEach((region) => {
      segmentMemory.current[region.id] = region.paintedSegments;
    });
  }, [regions]);

  useEffect(() => {
    setActiveRegionId(null);
    setIsDragging(false);
    setMobileDrawer(null);
    setMobileView('front');
    segmentMemory.current = {};
    history.current = [];
    setHistoryDepth(0);
  }, [clearSignal]);

  const pushHistory = () => {
    history.current.push({
      segments: Object.fromEntries(regions.map((region) => [region.id, [...(segmentMemory.current[region.id] ?? region.paintedSegments)]])),
      activeRegionId,
    });
    if (history.current.length > 50) history.current.shift();
    setHistoryDepth(history.current.length);
  };

  const undo = () => {
    const previous = history.current.pop();
    if (!previous) return;
    regions.forEach((region) => commitSegments(region, previous.segments[region.id] ?? []));
    setActiveRegionId(previous.activeRegionId);
    setHistoryDepth(history.current.length);
  };

  const nextSegmentsForTool = (region: BodyRegion, targetSegment?: number) => {
    const selected = new Set(segmentMemory.current[region.id] ?? region.paintedSegments);
    let changedSegment = targetSegment;
    if (tool === 'whole') {
      ALL_SEGMENTS.forEach((segment) => selected.add(segment));
    } else if (tool === 'paint') {
      const segment = targetSegment ?? ALL_SEGMENTS.find((index) => !selected.has(index));
      changedSegment = segment;
      if (changedSegment !== undefined) selected.add(changedSegment);
    } else {
      const segment = targetSegment ?? [...selected].sort((a, b) => b - a)[0];
      changedSegment = segment;
      if (changedSegment !== undefined) selected.delete(changedSegment);
    }
    return { nextSegments: [...selected].sort((a, b) => a - b), changedSegment };
  };

  const commitSegments = (region: BodyRegion, nextSegments: number[]) => {
    segmentMemory.current[region.id] = nextSegments;
    onChange(region.id, nextSegments.length / SEGMENT_COUNT, nextSegments);
  };

  const pairedRegionFor = (region: BodyRegion) => {
    if (!mirrorFrontBack) return undefined;
    const pairedId = getPairedRegionId(region.id);
    return pairedId ? regions.find((candidate) => candidate.id === pairedId) : undefined;
  };

  const applyTool = (region: BodyRegion, targetSegment?: number) => {
    const { nextSegments, changedSegment } = nextSegmentsForTool(region, targetSegment);
    const pairedRegion = pairedRegionFor(region);
    const pairedSegment = pairedRegion && changedSegment !== undefined
      ? mirrorSegmentIndex(region, pairedRegion, changedSegment, SEGMENT_COUNT)
      : undefined;
    const pairedSegments = pairedRegion ? nextSegmentsForTool(pairedRegion, pairedSegment).nextSegments : undefined;
    const currentSegments = segmentMemory.current[region.id] ?? region.paintedSegments;
    const changed = currentSegments.join(',') !== nextSegments.join(',') || (pairedRegion && (segmentMemory.current[pairedRegion.id] ?? pairedRegion.paintedSegments).join(',') !== pairedSegments?.join(','));
    if (!changed) return;
    pushHistory();
    commitSegments(region, nextSegments);
    if (pairedRegion) {
      commitSegments(pairedRegion, pairedSegments ?? []);
    }
    setActiveRegionId(region.id);
  };

  const setCoverage = (region: BodyRegion, zoneCount: number) => {
    const nextSegments = resizePaintedSegments(segmentMemory.current[region.id] ?? region.paintedSegments, zoneCount, SEGMENT_COUNT);
    const pairedRegion = pairedRegionFor(region);
    const pairedSegments = pairedRegion ? resizePaintedSegments(segmentMemory.current[pairedRegion.id] ?? pairedRegion.paintedSegments, zoneCount, SEGMENT_COUNT) : undefined;
    const changed = (segmentMemory.current[region.id] ?? region.paintedSegments).join(',') !== nextSegments.join(',') || (pairedRegion && (segmentMemory.current[pairedRegion.id] ?? pairedRegion.paintedSegments).join(',') !== pairedSegments?.join(','));
    if (!changed) return;
    pushHistory();
    commitSegments(region, nextSegments);
    if (pairedRegion) {
      commitSegments(pairedRegion, pairedSegments ?? []);
    }
  };

  const clearWithUndo = () => {
    if (regions.some((region) => region.paintedSegments.length > 0)) pushHistory();
    onClear();
    setActiveRegionId(null);
    setIsDragging(false);
  };

  const segmentFromPointer = (event: React.PointerEvent<SVGPathElement>, region: BodyRegion) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = region.paintAxis === 'horizontal'
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height;
    return Math.max(0, Math.min(SEGMENT_COUNT - 1, Math.floor(position * SEGMENT_COUNT)));
  };

  const getRegionPoseTransform = (region: BodyRegion) => {
    const centerX = region.bounds.x + region.bounds.width / 2;
    const isCanvasRight = centerX > 80;
    if (region.id.includes('scalp') || region.id === 'face') return figureTransforms.head;
    if (region.id.includes('neck')) return figureTransforms.neck;
    if (region.id === 'buttocks') return figureTransforms.buttocks;
    if (region.id === 'upper-chest' || region.id === 'upper-back') return figureTransforms.upperTorso;
    if (region.id === 'abdomen' || region.id === 'lower-back') return figureTransforms.abdomen;
    if (region.id === 'groin') return figureTransforms.pelvis;
    if (/upper-arm|forearm|hand/.test(region.id)) {
      return isCanvasRight ? figureTransforms.canvasRightArm : figureTransforms.canvasLeftArm;
    }
    if (/thigh|lower-leg|foot/.test(region.id)) {
      return isCanvasRight ? figureTransforms.canvasRightLeg : figureTransforms.canvasLeftLeg;
    }
    return figureTransforms.upperTorso;
  };

  const handleKey = (event: React.KeyboardEvent<SVGPathElement>, region: BodyRegion) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const viewRegions = regions.filter((item) => item.view === region.view);
      const currentIndex = viewRegions.findIndex((item) => item.id === region.id);
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? viewRegions.length - 1
          : (currentIndex + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + viewRegions.length) % viewRegions.length;
      const next = event.currentTarget.ownerSVGElement?.querySelector<SVGPathElement>(`[data-region-id="${viewRegions[nextIndex].id}"]`);
      next?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyTool(region);
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      setCoverage(region, 0);
    }
  };

  const BodyViewGraphic = ({ view }: { view: BodyView }) => {
    const viewRegions = regions.filter((region) => region.view === view);
    const modelLabel = patientMode === 'adult'
      ? 'Adult'
      : pediatricStage === 'older' ? 'Older child' : pediatricStage === 'younger' ? 'Younger child' : 'Infant';
    const modelBsa = suppliedModelBsa ?? CLINICAL_CONSTANTS.referenceBsa;
    const profileLabel = bodyMorph.measured
      ? `${bodyMorph.statureLabel} · ${bodyMorph.buildLabel.toLowerCase()} visual`
      : `${formatNumber(modelBsa, 2)} m² model`;
    const canvasHeight = 450 + Math.max(0, bodyMorph.legLength - 1) * 180;
    return (
      <div className={`body-view-card${mobileView === view ? ' mobile-view-active' : ' mobile-view-hidden'}`}>
        <div className="body-view-label">
          <span>{view === 'front' ? 'Front' : 'Back'}</span>
          <small title="Visual profile only; does not change the calculation">{profileLabel}</small>
        </div>
        <div className="scroll-gutter scroll-gutter-left" aria-hidden="true" />
        <div className="scroll-gutter scroll-gutter-right" aria-hidden="true" />
        <svg
          className={`body-svg ${patientMode}${patientMode === 'child' ? ` ${pediatricStage}` : ''}`}
          viewBox={`-5 0 170 ${canvasHeight}`}
          aria-label={`${modelLabel} ${view} body view. ${bodyMorph.measured ? `${bodyMorph.statureLabel}, ${bodyMorph.buildLabel.toLowerCase()} visual profile; visual only. ` : ''}Use arrow keys to move between regions and Space to apply the selected tool.`}
          onPointerLeave={() => setIsDragging(false)}
          onPointerUp={() => setIsDragging(false)}
        >
          <defs>
            <linearGradient id={`body-surface-${view}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f7faf9" />
              <stop offset=".52" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e8efed" />
            </linearGradient>
            {viewRegions.map((region) => (
              <clipPath key={region.id} id={`clip-${region.id}`} clipPathUnits="userSpaceOnUse">
                <path d={getRegionDisplayPath(region)} />
              </clipPath>
            ))}
          </defs>
          <g>
            <g className="body-joint-underlays" aria-hidden="true" pointerEvents="none" style={{ fill: `url(#body-surface-${view})` }}>
              <ellipse cx="80" cy="94" rx="10" ry="7" transform={figureTransforms.neck} />
              <ellipse cx="58" cy="101" rx="6" ry="8" transform={figureTransforms.canvasLeftArm} />
              <ellipse cx="102" cy="101" rx="6" ry="8" transform={figureTransforms.canvasRightArm} />
              <ellipse cx="49" cy="170" rx="6" ry="6" transform={figureTransforms.canvasLeftArm} />
              <ellipse cx="111" cy="170" rx="6" ry="6" transform={figureTransforms.canvasRightArm} />
              <ellipse cx="52" cy="229" rx="5" ry="6" transform={figureTransforms.canvasLeftArm} />
              <ellipse cx="108" cy="229" rx="5" ry="6" transform={figureTransforms.canvasRightArm} />
              <ellipse cx="72" cy="256" rx="7" ry="8" transform={figureTransforms.canvasLeftLeg} />
              <ellipse cx="88" cy="256" rx="7" ry="8" transform={figureTransforms.canvasRightLeg} />
              <ellipse cx="68.5" cy="332" rx="6" ry="6" transform={figureTransforms.canvasLeftLeg} />
              <ellipse cx="91.5" cy="332" rx="6" ry="6" transform={figureTransforms.canvasRightLeg} />
              <ellipse cx="71" cy="411" rx="5" ry="6" transform={figureTransforms.canvasLeftLeg} />
              <ellipse cx="89" cy="411" rx="5" ry="6" transform={figureTransforms.canvasRightLeg} />
            </g>
            {viewRegions.map((region) => {
              const horizontal = region.paintAxis === 'horizontal';
              const displayPath = getRegionDisplayPath(region);
              return (
                <g key={region.id} className="region-stack" transform={getRegionPoseTransform(region)}>
                  <path d={displayPath} className="anatomy-region-base" style={{ fill: `url(#body-surface-${view})` }} />
                  <g clipPath={`url(#clip-${region.id})`} pointerEvents="none">
                    {region.paintedSegments.map((segment) => (
                      <rect
                        key={`${region.id}-paint-${segment}`}
                        className="anatomy-segment-fill"
                        x={horizontal ? region.bounds.x + (region.bounds.width / SEGMENT_COUNT) * segment : region.bounds.x}
                        y={horizontal ? region.bounds.y : region.bounds.y + (region.bounds.height / SEGMENT_COUNT) * segment}
                        width={horizontal ? region.bounds.width / SEGMENT_COUNT : region.bounds.width}
                        height={horizontal ? region.bounds.height : region.bounds.height / SEGMENT_COUNT}
                      />
                    ))}
                    {ALL_SEGMENTS.slice(1).map((segment) => horizontal ? (
                      <line
                        key={`${region.id}-guide-${segment}`}
                        className="anatomy-segment-guide"
                        x1={region.bounds.x + (region.bounds.width / SEGMENT_COUNT) * segment}
                        x2={region.bounds.x + (region.bounds.width / SEGMENT_COUNT) * segment}
                        y1={region.bounds.y}
                        y2={region.bounds.y + region.bounds.height}
                      />
                    ) : (
                      <line
                        key={`${region.id}-guide-${segment}`}
                        className="anatomy-segment-guide"
                        x1={region.bounds.x}
                        x2={region.bounds.x + region.bounds.width}
                        y1={region.bounds.y + (region.bounds.height / SEGMENT_COUNT) * segment}
                        y2={region.bounds.y + (region.bounds.height / SEGMENT_COUNT) * segment}
                      />
                    ))}
                  </g>
                  <path
                    d={displayPath}
                    className={`anatomy-region${region.selectedFraction > 0 ? ' has-selection' : ''}${activeRegionId === region.id ? ' is-active' : ''}`}
                    role="button"
                    data-region-id={region.id}
                    tabIndex={0}
                    aria-label={`${region.label}, ${formatNumber(region.selectedFraction * 100, 0)}% treated, ${region.paintedSegments.length} of 5 paint zones selected, ${formatNumber((patientMode === 'child' ? pediatricRegionFtu(region.id, pediatricFtuReference) : region.adultHandprints / 2) * region.selectedFraction, 2)} FTU`}
                    onFocus={() => setActiveRegionId(region.id)}
                    onKeyDown={(event) => handleKey(event, region)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                      lastBrushAt.current = Date.now();
                      applyTool(region, segmentFromPointer(event, region));
                    }}
                    onPointerMove={(event) => {
                      if (isDragging && Date.now() - lastBrushAt.current > 35) {
                        lastBrushAt.current = Date.now();
                        applyTool(region, segmentFromPointer(event, region));
                      }
                    }}
                    onPointerEnter={(event) => {
                      if (isDragging) applyTool(region, segmentFromPointer(event, region));
                    }}
                  />
                </g>
              );
            })}
            <g className="figure-contours" aria-hidden="true" pointerEvents="none">
              {FIGURE_CONTOURS[view].map((item, index) => (
                <path
                  key={`contour-${index}`}
                  d={getFigurePath(item)}
                  transform={figureTransforms[item.part]}
                />
              ))}
            </g>
            <g className="figure-seams" aria-hidden="true" pointerEvents="none">
              {FIGURE_SEAMS[view].map((item, index) => (
                <path
                  key={`seam-${index}`}
                  d={getFigurePath(item)}
                  transform={figureTransforms[item.part]}
                />
              ))}
            </g>
            {view === 'back' && (
              <g className="body-shape-accent" transform={figureTransforms.buttocks} aria-hidden="true" pointerEvents="none">
                <path d="M61 217 C60 231 62 245 66 252 Q73 258 80 254 Q87 258 94 252 C98 245 100 231 99 217" />
                <path d="M80 224 Q78.5 241 80 254" />
              </g>
            )}
            {view === 'front' && bodyMorph.torsoWidth > 1.07 && (patientMode === 'adult' || pediatricStage === 'older') && (
              <g className="body-shape-accent pannus-accent" transform={figureTransforms.abdomen} aria-hidden="true" pointerEvents="none">
                <path d="M62 207 Q80 220 98 207" />
                {bodyMorph.torsoWidth > 1.16 && <path d="M66 214 Q80 225 94 214" />}
              </g>
            )}
            {view === 'front' && (
              <g
                className="face-details"
                transform={figureTransforms.head}
                aria-hidden="true"
                pointerEvents="none"
              >
                <ellipse cx="73.5" cy="63" rx="2.6" ry="3.3" />
                <ellipse cx="86.5" cy="63" rx="2.6" ry="3.3" />
                <circle className="eye-shine" cx="72.8" cy="62" r=".7" />
                <circle className="eye-shine" cx="85.8" cy="62" r=".7" />
              </g>
            )}
          </g>
          <text x="17" y={canvasHeight - 6} className="side-marker">{view === 'front' ? 'R' : 'L'}</text>
          <text x="139" y={canvasHeight - 6} className="side-marker">{view === 'front' ? 'L' : 'R'}</text>
        </svg>
      </div>
    );
  };

  return (
    <div className={`painter-shell tool-${tool}`}>
      <div className="tool-row" role="toolbar" aria-label="Anatomy selection tools">
        <button type="button" className={`mobile-workflow-button${mobileDrawer === 'size' ? ' active' : ''}`} onClick={() => setMobileDrawer((current) => current === 'size' ? null : 'size')} aria-expanded={mobileDrawer === 'size'}>
          <SlidersHorizontal size={17} /> Patient size
        </button>
        <button type="button" className={`mobile-workflow-button${mobileDrawer === 'schedule' ? ' active' : ''}`} onClick={() => setMobileDrawer((current) => current === 'schedule' ? null : 'schedule')} aria-expanded={mobileDrawer === 'schedule'}>
          <CalendarDays size={17} /> Treatment schedule
        </button>
        <button className={tool === 'paint' ? 'tool active' : 'tool'} onClick={() => setTool('paint')} aria-pressed={tool === 'paint'}>
          <Brush size={17} /> Paint
        </button>
        <label className={`mirror-toggle${mirrorFrontBack ? ' active' : ''}`} title="Apply paint, erase, and whole-region actions to the corresponding front and back surfaces">
          <input type="checkbox" checked={mirrorFrontBack} onChange={(event) => onMirrorFrontBackChange(event.target.checked)} />
          <span>{mirrorFrontBack ? 'Painting both sides' : 'Mirror both sides'}</span>
        </label>
        <button className="tool undo-tool" onClick={undo} disabled={historyDepth === 0} title="Undo the last painter change"><Undo2 size={17} /> Undo</button>
        <button className={tool === 'whole' ? 'tool active' : 'tool'} onClick={() => setTool('whole')} aria-pressed={tool === 'whole'}>
          <PaintBucket size={17} /> Whole region
        </button>
        <button className={tool === 'erase' ? 'tool active' : 'tool'} onClick={() => setTool('erase')} aria-pressed={tool === 'erase'}>
          <Eraser size={17} /> Erase
        </button>
        <button className="tool clear-tool" onClick={clearWithUndo}><RotateCcw size={17} /> Clear</button>
      </div>
      <p className="microcopy" aria-live="polite">
        <span className="tool-status">{tool === 'paint' ? 'Paint mode' : tool === 'erase' ? 'Erase mode' : 'Whole-region mode'}</span>
        Each paint or erase click changes one 20% region zone; figures stay zoomed for easy targeting.
        {mirrorFrontBack ? ' Paired front and back surfaces update together.' : ''}
      </p>
      <div className="mobile-painter-drawer">
        {mobileDrawer && <section className="mobile-drawer-panel" aria-label={mobileDrawer === 'size' ? 'Patient size controls' : 'Treatment schedule controls'}>
          {mobileDrawer === 'size' ? mobilePatientPanel : mobileSchedulePanel}
        </section>}
      </div>
      <div className="mobile-view-toggle segmented" role="group" aria-label="Anatomy view">
        <button type="button" className={mobileView === 'front' ? 'active' : ''} aria-pressed={mobileView === 'front'} onClick={() => setMobileView('front')}>Front</button>
        <button type="button" className={mobileView === 'back' ? 'active' : ''} aria-pressed={mobileView === 'back'} onClick={() => setMobileView('back')}>Back</button>
      </div>
      <div className="body-views" onPointerUp={() => setIsDragging(false)}>
        <BodyViewGraphic view="front" />
        <BodyViewGraphic view="back" />
      </div>
      <div className={`region-inspector${activeRegion ? '' : ' is-empty'}`} aria-live="polite">
        {activeRegion ? (
          <>
            <div>
              <span className="eyebrow">Active region</span>
              <strong>{activeRegion.label}</strong>
              <small>{formatNumber(patientMode === 'child' ? pediatricRegionFtu(activeRegion.id, pediatricFtuReference) : activeRegion.adultHandprints / 2, 2)} FTU when fully treated · {activeRegion.paintAxis === 'horizontal' ? 'side-to-side' : 'top-to-bottom'} zones</small>
            </div>
            <div className="coverage-field">
              <span>{formatNumber(activeRegion.selectedFraction * 100, 0)}% treated · {activeRegion.paintedSegments.length} of 5 zones</span>
              <div className="coverage-options" role="group" aria-label={`Coverage of ${activeRegion.label}`}>
                {Array.from({ length: SEGMENT_COUNT + 1 }, (_, zoneCount) => (
                  <button
                    key={zoneCount}
                    type="button"
                    className={activeRegion.paintedSegments.length === zoneCount ? 'active' : ''}
                    aria-pressed={activeRegion.paintedSegments.length === zoneCount}
                    onClick={() => setCoverage(activeRegion, zoneCount)}
                  >
                    {zoneCount * 20}%
                  </button>
                ))}
              </div>
              <input className="coverage-slider" aria-label={`Coverage of ${activeRegion.label}`} type="range" min="0" max={SEGMENT_COUNT} step="1" value={activeRegion.paintedSegments.length} onChange={(event) => setCoverage(activeRegion, Number(event.target.value))} />
              <div className="coverage-slider-marks" aria-hidden="true"><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span></div>
            </div>
            {(activeRegion.bounds.width < 25 || activeRegion.bounds.height < 35) && (
              <div className="region-focus-editor">
                <span>Focused region</span>
                <svg
                  viewBox={`${activeRegion.bounds.x - 5} ${activeRegion.bounds.y - 5} ${activeRegion.bounds.width + 10} ${activeRegion.bounds.height + 10}`}
                  aria-label={`Enlarged ${activeRegion.label} painting target`}
                >
                  <defs><clipPath id={`focus-${activeRegion.id}`}><path d={activeRegion.path} /></clipPath></defs>
                  <path d={activeRegion.path} className="anatomy-region-base focus-region-base" />
                  <g clipPath={`url(#focus-${activeRegion.id})`} pointerEvents="none">
                    {activeRegion.paintedSegments.map((segment) => (
                      <rect
                        key={`focus-${activeRegion.id}-${segment}`}
                        className="anatomy-segment-fill"
                        x={activeRegion.paintAxis === 'horizontal' ? activeRegion.bounds.x + (activeRegion.bounds.width / SEGMENT_COUNT) * segment : activeRegion.bounds.x}
                        y={activeRegion.paintAxis === 'horizontal' ? activeRegion.bounds.y : activeRegion.bounds.y + (activeRegion.bounds.height / SEGMENT_COUNT) * segment}
                        width={activeRegion.paintAxis === 'horizontal' ? activeRegion.bounds.width / SEGMENT_COUNT : activeRegion.bounds.width}
                        height={activeRegion.paintAxis === 'horizontal' ? activeRegion.bounds.height : activeRegion.bounds.height / SEGMENT_COUNT}
                      />
                    ))}
                  </g>
                  <path
                    d={activeRegion.path}
                    className="focus-region-hit"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      applyTool(activeRegion, segmentFromPointer(event, activeRegion));
                    }}
                  />
                </svg>
              </div>
            )}
          </>
        ) : <span>Select a body region to fine-tune the affected percentage.</span>}
      </div>
    </div>
  );
}
