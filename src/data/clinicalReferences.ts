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
    label: 'Long & Finlay · 1991',
    topic: 'FTU origin',
    url: 'https://doi.org/10.1111/j.1365-2230.1991.tb01232.x',
    note: 'The original fingertip-unit study: a line expressed from a standard 5 mm nozzle, with measured adult regional quantities.',
  },
  {
    label: 'Amirsheybani et al. · 2001',
    topic: 'Hand area',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11304598/',
    note: 'Measured 800 participants and found the adult palmar surface of the hand and fingers averaged 0.78% of body surface area.',
  },
  {
    label: 'NHS STW · 2025',
    topic: 'Regional FTUs',
    url: 'https://www.shropshiretelfordandwrekin.nhs.uk/wp-content/uploads/Good-Practice-Guidance-Administration-of-Topical-Preparations-in-Care-Settings-002.pdf',
    note: 'Current clinical guidance supporting the 0.5 g adult FTU convention and the rounded adult body-region FTU table.',
  },
  {
    label: 'DermNet · reviewed 2023',
    topic: 'Weight & coverage',
    url: 'https://dermnetnz.org/topics/fingertip-unit',
    note: 'Dermatologist-reviewed guidance supporting 0.5 g per adult male FTU and the commonly used regional quantities.',
  },
  {
    label: 'Newcastle Hospitals NHS',
    topic: 'Two-hand coverage',
    url: 'https://www.newcastle-hospitals.nhs.uk/services/dermatology/patient-dermatology-information-leaflets/eczema/',
    note: 'Patient guidance describing one fingertip unit as sufficient for an area equal to two adult handprints.',
  },
  {
    label: 'Leeds Teaching Hospitals NHS',
    topic: 'Pediatric regional FTUs',
    url: 'https://www.leedsth.nhs.uk/patients/resources/management-of-atopic-eczema-a-parents-guide/',
    note: 'Age- and body-region-specific pediatric FTU table, citing Long C, A Guide to Finger Tip Units for Children (British Journal of Dermatology, 1998).',
  },
  {
    label: 'Dudley Group NHS',
    topic: 'Pediatric FTU table',
    url: 'https://www.dgft.nhs.uk/pil/treatments-used-in-eczema/',
    note: 'Independent NHS publication of the same pediatric age-band FTU quantities for face and neck, limbs, and trunk.',
  },
  {
    label: 'Australian enHealth / ICRP',
    topic: 'Age-specific body proportions',
    url: 'https://www.cdc.gov.au/system/files/2025-10/enhealth-guidance-australian-exposure-factor-guide_0.pdf',
    note: 'Reference BSA anchors and age-specific head, trunk, upper-extremity, and lower-extremity surface-area proportions used for painter coverage estimates.',
  },
] as const;
