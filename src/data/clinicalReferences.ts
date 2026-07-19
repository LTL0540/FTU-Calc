export const ADULT_FTU_REFERENCE_GROUPS = [
  { label: 'Face + neck', ftu: 2.5, handprints: 5 },
  { label: 'Scalp', ftu: 3, handprints: 6 },
  { label: 'Anterior trunk (chest + abdomen)', ftu: 7, handprints: 14 },
  { label: 'Posterior trunk (back + buttocks)', ftu: 7, handprints: 14 },
  { label: 'One arm, excluding hand', ftu: 3, handprints: 6 },
  { label: 'One hand, both surfaces', ftu: 1, handprints: 2 },
  { label: 'One leg, excluding foot', ftu: 6, handprints: 12 },
  { label: 'One foot, both surfaces', ftu: 2, handprints: 4 },
  { label: 'Genital region', ftu: 0.5, handprints: 1 },
] as const;

export const CLINICAL_REFERENCE_LINKS = [
  {
    label: 'Long & Finlay (1991), original FTU study',
    url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1365-2230.1991.tb01232.x',
    note: 'Measured adult means: front trunk 6.7 FTU, back 6.8, arm/forearm 3.3, hand 1.2, leg/thigh 5.8, and foot 1.8.',
  },
  {
    label: 'NHS Shropshire, Telford and Wrekin (2025)',
    url: 'https://www.shropshiretelfordandwrekin.nhs.uk/wp-content/uploads/Good-Practice-Guidance-Administration-of-Topical-Preparations-in-Care-Settings-002.pdf',
    note: 'Practical rounded adult table, including back with buttocks, scalp, genitalia, and an approximately 40-FTU whole-body check.',
  },
  {
    label: 'DermNet fingertip-unit guide (reviewed 2023)',
    url: 'https://dermnetnz.org/topics/fingertip-unit',
    note: 'Independent clinical reference agreeing on 2.5/3/1/6/2 regional values and 14 FTU for front plus back of trunk.',
  },
] as const;
