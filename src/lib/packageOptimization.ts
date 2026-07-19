export type PackageRecommendation = {
  packages: number[];
  totalGrams: number;
  excessGrams: number;
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
  const usable = [...new Set(sizes.filter((size) => size > 0))].sort((a, b) => b - a);
  if (requirementGrams <= 0 || usable.length === 0) {
    return { packages: [], totalGrams: 0, excessGrams: Math.max(0, -requirementGrams) };
  }

  const units = usable.map((size) => Math.round(size * 10));
  const requiredUnits = Math.ceil(requirementGrams * 10 - 1e-9);
  const maxUnit = Math.max(...units);
  const searchLimit = requiredUnits + maxUnit;
  const best: Array<number[] | undefined> = new Array(searchLimit + 1);
  best[0] = [];

  for (let total = 1; total <= searchLimit; total += 1) {
    let candidate: number[] | undefined;
    units.forEach((unit, index) => {
      if (unit <= total && best[total - unit]) {
        const next = [...best[total - unit]!, usable[index]];
        if (!candidate || next.length < candidate.length) candidate = next;
      }
    });
    best[total] = candidate;
  }

  let bestCombination: PackageRecommendation | undefined;
  for (let total = requiredUnits; total <= searchLimit; total += 1) {
    if (best[total]) {
      const packages = best[total]!.sort((a, b) => b - a);
      const totalGrams = total / 10;
      bestCombination = { packages, totalGrams, excessGrams: Math.max(0, totalGrams - requirementGrams) };
      break;
    }
  }

  const smallestSingle = [...usable].reverse().find((size) => size >= requirementGrams);
  const practicalExcessLimit = Math.min(30, Math.max(20, requirementGrams * 0.2));
  if (smallestSingle !== undefined) {
    const single = { packages: [smallestSingle], totalGrams: smallestSingle, excessGrams: smallestSingle - requirementGrams };
    if (!bestCombination || bestCombination.packages.length === 1 || single.excessGrams <= practicalExcessLimit) return single;
  }

  const bestSameSize = usable
    .map((size) => {
      const count = Math.ceil(requirementGrams / size);
      const totalGrams = count * size;
      return {
        packages: Array.from({ length: count }, () => size),
        totalGrams,
        excessGrams: totalGrams - requirementGrams,
      };
    })
    .sort((a, b) => a.excessGrams - b.excessGrams || a.packages.length - b.packages.length)[0];

  if (
    bestSameSize
    && bestSameSize.excessGrams <= practicalExcessLimit
    && (!bestCombination || bestSameSize.packages.length <= bestCombination.packages.length)
  ) return bestSameSize;

  if (bestCombination) return bestCombination;

  const largest = usable[0];
  const count = Math.ceil(requirementGrams / largest);
  const packages = Array.from({ length: count }, () => largest);
  const totalGrams = count * largest;
  return { packages, totalGrams, excessGrams: totalGrams - requirementGrams };
}
