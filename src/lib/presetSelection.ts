import type { BodyRegion, ProtocolPreset } from '../types/calculator';

export function addTreatmentAreaPreset(
  regions: BodyRegion[],
  activePresetIds: string[],
  preset: ProtocolPreset,
): { regions: BodyRegion[]; activePresetIds: string[] } {
  const selectedIds = new Set(preset.regionIds);
  return {
    regions: regions.map((region) => selectedIds.has(region.id)
      ? { ...region, selectedFraction: 1, paintedSegments: [0, 1, 2, 3, 4] }
      : region),
    activePresetIds: activePresetIds.includes(preset.id) ? activePresetIds : [...activePresetIds, preset.id],
  };
}
