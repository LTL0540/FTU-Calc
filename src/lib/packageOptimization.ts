import { CALCULATION_LIMITS } from './validation';

export type PackageRecommendation = {
  packages: number[];
  totalGrams: number;
  excessGrams: number;
  valid: boolean;
  issue?: string;
};

/**
 * A single package, or repeated packages of one size, may be preferred when
 * its total excess stays within a practical allowance: 20% of the
 * requirement, with a 20 g floor and a 30 g cap.
 * Outside that practical allowance, the least-excess combination wins, with
 * fewer containers breaking ties. A same-size option never wins by adding
 * more containers than the least-excess option.
 *
 * Package values are converted to tenths of a gram so 7.5 g remains exact.
 */
export function optimizePackages(requirementGrams: number, sizes: number[]): PackageRecommendation {
  if (
    !Number.isFinite(requirementGrams)
    || requirementGrams < 0
    || requirementGrams > CALCULATION_LIMITS.maxTreatmentGrams
  ) {
    return {
      packages: [],
      totalGrams: 0,
      excessGrams: 0,
      valid: false,
      issue: `Package requirement must be finite, nonnegative, and no more than ${CALCULATION_LIMITS.maxTreatmentGrams} g.`,
    };
  }
  if (
    sizes.length > CALCULATION_LIMITS.maxPackageSizes
    || sizes.some((size) => !Number.isFinite(size) || size < 0.1 || size > CALCULATION_LIMITS.maxPackageSizeGrams)
  ) {
    return {
      packages: [],
      totalGrams: 0,
      excessGrams: 0,
      valid: false,
      issue: 'Package sizes contain an invalid value or exceed the supported optimization limits.',
    };
  }

  const usable = [...new Set(sizes)].sort((a, b) => b - a);
  if (requirementGrams === 0 || usable.length === 0) {
    return { packages: [], totalGrams: 0, excessGrams: 0, valid: true };
  }
  if (Math.ceil(requirementGrams / usable[0]) > 1_000) {
    return {
      packages: [],
      totalGrams: 0,
      excessGrams: 0,
      valid: false,
      issue: 'The required package count exceeds the supported maximum of 1000 containers.',
    };
  }

  const units = usable.map((size) => Math.round(size * 10));
  const requiredUnits = Math.ceil(requirementGrams * 10 - 1e-9);
  const maxUnit = Math.max(...units);
  const searchLimit = requiredUnits + maxUnit;
  const bestCount = new Int32Array(searchLimit + 1);
  const choice = new Int32Array(searchLimit + 1);
  bestCount.fill(-1);
  choice.fill(-1);
  bestCount[0] = 0;

  for (let total = 1; total <= searchLimit; total += 1) {
    units.forEach((unit, index) => {
      if (unit <= total && bestCount[total - unit] >= 0) {
        const candidateCount = bestCount[total - unit] + 1;
        if (bestCount[total] < 0 || candidateCount < bestCount[total]) {
          bestCount[total] = candidateCount;
          choice[total] = index;
        }
      }
    });
  }

  let bestCombination: PackageRecommendation | undefined;
  for (let total = requiredUnits; total <= searchLimit; total += 1) {
    if (bestCount[total] >= 0) {
      if (bestCount[total] > 1_000) {
        return {
          packages: [],
          totalGrams: 0,
          excessGrams: 0,
          valid: false,
          issue: 'The required package count exceeds the supported maximum of 1000 containers.',
        };
      }
      const packages: number[] = [];
      let remaining = total;
      while (remaining > 0) {
        const index = choice[remaining];
        if (index < 0) {
          return {
            packages: [],
            totalGrams: 0,
            excessGrams: 0,
            valid: false,
            issue: 'Package optimization could not reconstruct a safe recommendation.',
          };
        }
        packages.push(usable[index]);
        remaining -= units[index];
      }
      packages.sort((a, b) => b - a);
      const totalGrams = total / 10;
      bestCombination = { packages, totalGrams, excessGrams: Math.max(0, totalGrams - requirementGrams), valid: true };
      break;
    }
  }

  const smallestSingle = [...usable].reverse().find((size) => size >= requirementGrams);
  const practicalExcessLimit = Math.min(30, Math.max(20, requirementGrams * 0.2));
  if (smallestSingle !== undefined) {
    const single = { packages: [smallestSingle], totalGrams: smallestSingle, excessGrams: smallestSingle - requirementGrams, valid: true };
    if (!bestCombination || bestCombination.packages.length === 1 || single.excessGrams <= practicalExcessLimit) return single;
  }

  const bestSameSize = usable
    .map((size) => {
      const count = Math.ceil(requirementGrams / size);
      if (!Number.isFinite(count) || count <= 0 || count > 1_000) return undefined;
      const totalGrams = count * size;
      return {
        packages: Array.from({ length: count }, () => size),
        totalGrams,
        excessGrams: totalGrams - requirementGrams,
        valid: true,
      };
    })
    .filter((candidate): candidate is PackageRecommendation => candidate !== undefined)
    .filter((candidate) => candidate.excessGrams <= practicalExcessLimit)
    .sort((a, b) => a.packages.length - b.packages.length || a.excessGrams - b.excessGrams)[0];

  if (
    bestSameSize
    && (!bestCombination || bestSameSize.packages.length <= bestCombination.packages.length)
  ) return bestSameSize;

  if (bestCombination) return bestCombination;

  const largest = usable[0];
  const count = Math.ceil(requirementGrams / largest);
  if (!Number.isFinite(count) || count <= 0 || count > 1_000) {
    return {
      packages: [],
      totalGrams: 0,
      excessGrams: 0,
      valid: false,
      issue: 'The required package count exceeds the supported maximum of 1000 containers.',
    };
  }
  const packages = Array.from({ length: count }, () => largest);
  const totalGrams = count * largest;
  return { packages, totalGrams, excessGrams: totalGrams - requirementGrams, valid: true };
}
