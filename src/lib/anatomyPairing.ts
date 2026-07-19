import type { BodyRegion } from '../types/calculator';

const FRONT_BACK_PAIRS = [
  ['front-scalp', 'posterior-scalp'],
  ['anterior-neck', 'posterior-neck'],
  ['left-upper-arm-front', 'left-upper-arm-back'],
  ['right-upper-arm-front', 'right-upper-arm-back'],
  ['left-forearm-front', 'left-forearm-back'],
  ['right-forearm-front', 'right-forearm-back'],
  ['left-hand-front', 'left-hand-back'],
  ['right-hand-front', 'right-hand-back'],
  ['upper-chest', 'upper-back'],
  ['abdomen', 'lower-back'],
  ['left-thigh-front', 'left-thigh-back'],
  ['right-thigh-front', 'right-thigh-back'],
  ['left-lower-leg-front', 'left-lower-leg-back'],
  ['right-lower-leg-front', 'right-lower-leg-back'],
  ['left-foot-front', 'left-foot-back'],
  ['right-foot-front', 'right-foot-back'],
] as const;

const pairedRegionIds = new Map<string, string>(
  FRONT_BACK_PAIRS.flatMap(([frontId, backId]) => [[frontId, backId], [backId, frontId]]),
);

export const getPairedRegionId = (regionId: string) => pairedRegionIds.get(regionId);

export const mirrorSegmentIndex = (
  source: Pick<BodyRegion, 'paintAxis'>,
  target: Pick<BodyRegion, 'paintAxis'>,
  segment: number,
  segmentCount = 5,
) => source.paintAxis === 'horizontal' && target.paintAxis === 'horizontal'
  ? segmentCount - 1 - segment
  : segment;

export const resizePaintedSegments = (segments: number[], requestedCount: number, segmentCount = 5) => {
  const targetCount = Math.max(0, Math.min(segmentCount, Math.round(requestedCount)));
  const selected = new Set(segments.filter((segment) => segment >= 0 && segment < segmentCount));

  while (selected.size < targetCount) {
    const next = Array.from({ length: segmentCount }, (_, index) => index).find((index) => !selected.has(index));
    if (next === undefined) break;
    selected.add(next);
  }

  while (selected.size > targetCount) {
    const last = [...selected].sort((a, b) => b - a)[0];
    if (last === undefined) break;
    selected.delete(last);
  }

  return [...selected].sort((a, b) => a - b);
};
