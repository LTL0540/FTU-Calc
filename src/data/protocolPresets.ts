import type { ProtocolPreset } from '../types/calculator';

export const PROTOCOL_PRESETS: ProtocolPreset[] = [
  { id: 'face-neck', label: 'Face and neck', regionIds: ['face', 'anterior-neck', 'posterior-neck'], handprints: 5, ftu: 2.5, gramsPerApplication: 1.25, bid14Grams: 35 },
  { id: 'anterior-trunk', label: 'Anterior trunk', regionIds: ['upper-chest', 'abdomen'], handprints: 14, ftu: 7, gramsPerApplication: 3.5, bid14Grams: 98 },
  { id: 'posterior-trunk', label: 'Posterior trunk + buttocks', regionIds: ['upper-back', 'lower-back', 'buttocks'], handprints: 14, ftu: 7, gramsPerApplication: 3.5, bid14Grams: 98 },
  { id: 'entire-trunk', label: 'Entire trunk', regionIds: ['upper-chest', 'abdomen', 'upper-back', 'lower-back', 'buttocks'], handprints: 28, ftu: 14, gramsPerApplication: 7, bid14Grams: 196 },
  { id: 'one-arm', label: 'One arm', regionIds: ['left-upper-arm-front', 'left-forearm-front', 'left-upper-arm-back', 'left-forearm-back'], handprints: 6, ftu: 3, gramsPerApplication: 1.5, bid14Grams: 42 },
  { id: 'one-hand', label: 'One hand and fingers', regionIds: ['left-hand-front', 'left-hand-back'], handprints: 2, ftu: 1, gramsPerApplication: 0.5, bid14Grams: 14 },
  { id: 'one-leg', label: 'One leg', regionIds: ['left-thigh-front', 'left-lower-leg-front', 'left-thigh-back', 'left-lower-leg-back'], handprints: 12, ftu: 6, gramsPerApplication: 3, bid14Grams: 84 },
  { id: 'one-foot', label: 'One foot', regionIds: ['left-foot-front', 'left-foot-back'], handprints: 4, ftu: 2, gramsPerApplication: 1, bid14Grams: 28 },
];
