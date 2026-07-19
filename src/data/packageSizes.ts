import { DEFAULT_PACKAGE_SIZES } from '../config/clinical';
import type { PackageSize } from '../types/calculator';

export const createPackageSizes = (): PackageSize[] => DEFAULT_PACKAGE_SIZES.map((grams, index) => ({
  id: `package-${index}-${grams}`,
  grams,
  enabled: ![7.5, 225].includes(grams),
}));
