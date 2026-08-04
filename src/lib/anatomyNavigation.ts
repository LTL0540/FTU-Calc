import type { BodyRegion, BodyView } from '../types/calculator';

export type AnatomyNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

export function initialRovingRegionIds(regions: BodyRegion[]): Record<BodyView, string> {
  return {
    front: regions.find((region) => region.view === 'front')?.id ?? '',
    back: regions.find((region) => region.view === 'back')?.id ?? '',
  };
}

export function nextRegionIdForKey(regions: BodyRegion[], currentId: string, key: AnatomyNavigationKey): string {
  const current = regions.find((region) => region.id === currentId);
  if (!current) return currentId;
  const viewRegions = regions.filter((region) => region.view === current.view);
  const currentIndex = viewRegions.findIndex((region) => region.id === currentId);
  if (currentIndex < 0 || viewRegions.length === 0) return currentId;
  if (key === 'Home') return viewRegions[0].id;
  if (key === 'End') return viewRegions[viewRegions.length - 1].id;
  const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  return viewRegions[(currentIndex + direction + viewRegions.length) % viewRegions.length].id;
}
