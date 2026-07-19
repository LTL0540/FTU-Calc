import type { BodyRegion } from '../types/calculator';

type RegionSeed = Omit<BodyRegion, 'selectedFraction' | 'paintedSegments'>;

const frontRegions: RegionSeed[] = [
  { id: 'front-scalp', label: 'Scalp', side: 'midline', view: 'front', adultHandprints: 3, paintAxis: 'horizontal', path: 'M80 18 C68 18 61 25 59.5 37 C59 40 59.5 43 60 46 Q80 51 100 46 C100.5 43 101 40 100.5 37 C99 25 92 18 80 18 Z', bounds: { x: 59, y: 18, width: 42, height: 33 } },
  { id: 'face', label: 'Face', side: 'midline', view: 'front', adultHandprints: 4, paintAxis: 'horizontal', path: 'M60 46 Q80 51 100 46 C101 54 100 64 97 72 C94 82 88 87 80 88 C72 87 66 82 63 72 C60 64 59 54 60 46 Z', bounds: { x: 59, y: 46, width: 42, height: 42 } },
  { id: 'anterior-neck', label: 'Anterior neck', side: 'midline', view: 'front', adultHandprints: 0.5, path: 'M73 88 Q80 92 87 88 L90 96 Q80 101 70 96 Z', bounds: { x: 70, y: 88, width: 20, height: 13 } },
  { id: 'left-upper-arm-front', label: 'Left upper arm', side: 'left', view: 'front', adultHandprints: 2, path: 'M102 94 C111 93 118 97 121 105 C124 124 121 149 117 171 C113 174 108 172 105 168 C106 141 105 113 102 94 Z', bounds: { x: 102, y: 93, width: 22, height: 81 } },
  { id: 'right-upper-arm-front', label: 'Right upper arm', side: 'right', view: 'front', adultHandprints: 2, path: 'M58 94 C49 93 42 97 39 105 C36 124 39 149 43 171 C47 174 52 172 55 168 C54 141 55 113 58 94 Z', bounds: { x: 36, y: 93, width: 22, height: 81 } },
  { id: 'left-forearm-front', label: 'Left forearm', side: 'left', view: 'front', adultHandprints: 1, path: 'M105 169 C109 173 113 174 117 171 C116 191 115 211 113 229 C110 232 106 231 103 227 C104 209 105 189 105 169 Z', bounds: { x: 103, y: 169, width: 14, height: 63 } },
  { id: 'right-forearm-front', label: 'Right forearm', side: 'right', view: 'front', adultHandprints: 1, path: 'M55 169 C51 173 47 174 43 171 C44 191 45 211 47 229 C50 232 54 231 57 227 C56 209 55 189 55 169 Z', bounds: { x: 43, y: 169, width: 14, height: 63 } },
  { id: 'left-hand-front', label: 'Left hand (palm)', side: 'left', view: 'front', adultHandprints: 1, path: 'M103 228 C107 231 111 232 114 229 L116 247 C116 257 113 264 109 268 C105 263 102 255 102 248 Z', bounds: { x: 102, y: 228, width: 14, height: 40 } },
  { id: 'right-hand-front', label: 'Right hand (palm)', side: 'right', view: 'front', adultHandprints: 1, path: 'M57 228 C53 231 49 232 46 229 L44 247 C44 257 47 264 51 268 C55 263 58 255 58 248 Z', bounds: { x: 44, y: 228, width: 14, height: 40 } },
  { id: 'upper-chest', label: 'Upper chest', side: 'midline', view: 'front', adultHandprints: 7, paintAxis: 'horizontal', path: 'M60 92 Q80 84 100 92 C106 107 105 127 103 146 Q80 154 57 146 C55 127 54 107 60 92 Z', bounds: { x: 54, y: 84, width: 52, height: 70 } },
  { id: 'abdomen', label: 'Abdomen', side: 'midline', view: 'front', adultHandprints: 7, paintAxis: 'horizontal', path: 'M57 148 Q80 155 103 148 C102 173 102 196 98 216 Q80 223 62 216 C58 196 58 173 57 148 Z', bounds: { x: 54, y: 148, width: 52, height: 75 } },
  { id: 'groin', label: 'Groin / genital region', side: 'midline', view: 'front', adultHandprints: 1, paintAxis: 'vertical', path: 'M62 217 Q80 223 98 217 C100 229 98 243 94 252 L82 260 Q80 262 78 260 L66 252 C62 243 60 229 62 217 Z', bounds: { x: 60, y: 217, width: 40, height: 45 } },
  { id: 'left-thigh-front', label: 'Left thigh', side: 'left', view: 'front', adultHandprints: 4, path: 'M82 260 Q88 255 94 251 C99 276 100 305 97 331 Q92 335 86 331 Z', bounds: { x: 82, y: 251, width: 18, height: 84 } },
  { id: 'right-thigh-front', label: 'Right thigh', side: 'right', view: 'front', adultHandprints: 4, path: 'M78 260 Q72 255 66 251 C61 276 60 305 63 331 Q68 335 74 331 Z', bounds: { x: 60, y: 251, width: 18, height: 84 } },
  { id: 'left-lower-leg-front', label: 'Left lower leg', side: 'left', view: 'front', adultHandprints: 2, path: 'M86 332 Q92 336 97 332 C97 358 96 387 94 410 Q89 414 84 410 Z', bounds: { x: 84, y: 332, width: 13, height: 82 } },
  { id: 'right-lower-leg-front', label: 'Right lower leg', side: 'right', view: 'front', adultHandprints: 2, path: 'M74 332 Q68 336 63 332 C63 358 64 387 66 410 Q71 414 76 410 Z', bounds: { x: 63, y: 332, width: 13, height: 82 } },
  { id: 'left-foot-front', label: 'Left foot', side: 'left', view: 'front', adultHandprints: 2, path: 'M84 411 Q89 415 94 411 L103 427 Q104 433 98 435 L85 434 Q81 430 84 411 Z', bounds: { x: 81, y: 411, width: 23, height: 24 } },
  { id: 'right-foot-front', label: 'Right foot', side: 'right', view: 'front', adultHandprints: 2, path: 'M76 411 Q71 415 66 411 L57 427 Q56 433 62 435 L75 434 Q79 430 76 411 Z', bounds: { x: 56, y: 411, width: 23, height: 24 } },
];

const backRegions: RegionSeed[] = [
  { id: 'posterior-scalp', label: 'Posterior scalp', side: 'midline', view: 'back', adultHandprints: 3, paintAxis: 'horizontal', path: 'M80 18 C68 18 61 25 59.5 37 C58.5 48 60 63 63 72 C66 82 72 87 80 88 C88 87 94 82 97 72 C100 63 101.5 48 100.5 37 C99 25 92 18 80 18 Z', bounds: { x: 58, y: 18, width: 44, height: 70 } },
  { id: 'posterior-neck', label: 'Posterior neck', side: 'midline', view: 'back', adultHandprints: 0.5, path: 'M73 88 Q80 92 87 88 L90 96 Q80 101 70 96 Z', bounds: { x: 70, y: 88, width: 20, height: 13 } },
  { id: 'left-upper-arm-back', label: 'Left upper arm', side: 'left', view: 'back', adultHandprints: 2, path: 'M58 94 C49 93 42 97 39 105 C36 124 39 149 43 171 C47 174 52 172 55 168 C54 141 55 113 58 94 Z', bounds: { x: 36, y: 93, width: 22, height: 81 } },
  { id: 'right-upper-arm-back', label: 'Right upper arm', side: 'right', view: 'back', adultHandprints: 2, path: 'M102 94 C111 93 118 97 121 105 C124 124 121 149 117 171 C113 174 108 172 105 168 C106 141 105 113 102 94 Z', bounds: { x: 102, y: 93, width: 22, height: 81 } },
  { id: 'left-forearm-back', label: 'Left forearm', side: 'left', view: 'back', adultHandprints: 1, path: 'M55 169 C51 173 47 174 43 171 C44 191 45 211 47 229 C50 232 54 231 57 227 C56 209 55 189 55 169 Z', bounds: { x: 43, y: 169, width: 14, height: 63 } },
  { id: 'right-forearm-back', label: 'Right forearm', side: 'right', view: 'back', adultHandprints: 1, path: 'M105 169 C109 173 113 174 117 171 C116 191 115 211 113 229 C110 232 106 231 103 227 C104 209 105 189 105 169 Z', bounds: { x: 103, y: 169, width: 14, height: 63 } },
  { id: 'left-hand-back', label: 'Left hand (back)', side: 'left', view: 'back', adultHandprints: 1, path: 'M57 228 C53 231 49 232 46 229 L44 247 C44 257 47 264 51 268 C55 263 58 255 58 248 Z', bounds: { x: 44, y: 228, width: 14, height: 40 } },
  { id: 'right-hand-back', label: 'Right hand (back)', side: 'right', view: 'back', adultHandprints: 1, path: 'M103 228 C107 231 111 232 114 229 L116 247 C116 257 113 264 109 268 C105 263 102 255 102 248 Z', bounds: { x: 102, y: 228, width: 14, height: 40 } },
  { id: 'upper-back', label: 'Upper back', side: 'midline', view: 'back', adultHandprints: 3, paintAxis: 'horizontal', path: 'M60 92 Q80 84 100 92 C106 107 105 129 103 151 Q80 159 57 151 C55 129 54 107 60 92 Z', bounds: { x: 54, y: 84, width: 52, height: 75 } },
  { id: 'lower-back', label: 'Lower back', side: 'midline', view: 'back', adultHandprints: 3, paintAxis: 'horizontal', path: 'M57 153 Q80 160 103 153 C102 177 102 197 99 216 Q80 223 61 216 C58 197 58 177 57 153 Z', bounds: { x: 54, y: 153, width: 52, height: 70 } },
  { id: 'buttocks', label: 'Buttocks', side: 'bilateral', view: 'back', adultHandprints: 8, paintAxis: 'horizontal', path: 'M61 217 Q80 223 99 217 C100 231 98 245 94 252 Q87 258 80 254 Q73 258 66 252 C62 245 60 231 61 217 Z', bounds: { x: 60, y: 217, width: 40, height: 41 } },
  { id: 'left-thigh-back', label: 'Left posterior thigh', side: 'left', view: 'back', adultHandprints: 4, path: 'M78 260 Q72 255 66 251 C61 276 60 305 63 331 Q68 335 74 331 Z', bounds: { x: 60, y: 251, width: 18, height: 84 } },
  { id: 'right-thigh-back', label: 'Right posterior thigh', side: 'right', view: 'back', adultHandprints: 4, path: 'M82 260 Q88 255 94 251 C99 276 100 305 97 331 Q92 335 86 331 Z', bounds: { x: 82, y: 251, width: 18, height: 84 } },
  { id: 'left-lower-leg-back', label: 'Left lower leg', side: 'left', view: 'back', adultHandprints: 2, path: 'M74 332 Q68 336 63 332 C63 358 64 387 66 410 Q71 414 76 410 Z', bounds: { x: 63, y: 332, width: 13, height: 82 } },
  { id: 'right-lower-leg-back', label: 'Right lower leg', side: 'right', view: 'back', adultHandprints: 2, path: 'M86 332 Q92 336 97 332 C97 358 96 387 94 410 Q89 414 84 410 Z', bounds: { x: 84, y: 332, width: 13, height: 82 } },
  { id: 'left-foot-back', label: 'Left foot', side: 'left', view: 'back', adultHandprints: 2, path: 'M76 411 Q71 415 66 411 L57 427 Q56 433 62 435 L75 434 Q79 430 76 411 Z', bounds: { x: 56, y: 411, width: 23, height: 24 } },
  { id: 'right-foot-back', label: 'Right foot', side: 'right', view: 'back', adultHandprints: 2, path: 'M84 411 Q89 415 94 411 L103 427 Q104 433 98 435 L85 434 Q81 430 84 411 Z', bounds: { x: 81, y: 411, width: 23, height: 24 } },
];

export const createBodyRegions = (): BodyRegion[] => [...frontRegions, ...backRegions].map((region) => ({ ...region, selectedFraction: 0, paintedSegments: [] }));

export const BODY_REGION_REFERENCE_NOTE = 'Painter subdivisions are approximate. Combined surfaces reproduce the adult FTU references: face + neck 2.5; scalp 3; front trunk 7; back + buttocks 7; arm excluding hand 3; hand 1; leg excluding foot 6; foot 2; genital region 0.5.';
