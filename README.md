# FTU Calculator

A responsive, entirely client-side clinical calculator for estimating how much topical cream, ointment, lotion, gel, or other formulation is required for a treatment course.

## Highlights

- Interactive front/back adult and child anatomy models with five spatial 20% paint zones per region, targeted erase, whole-region, touch, and keyboard controls
- Familiar restroom-icon silhouette in an open pose, with the detailed clinical region divisions preserved
- Additive anatomical presets that remain synchronized with the painter, plus a compact handprint/BSA override
- Mosteller BSA calculation with clearly labeled representative pediatric fallbacks (0.48 m² at 1 year, 0.78 m² at 5 years, and 1.12 m² at 10 years); measured height and weight take priority
- Fractional daily and weekly regimens with an optional extra-supply buffer
- Editable package sizes and deterministic package optimization
- Transparent calculation breakdown, copyable summary, and additive area presets
- No login, analytics, cookies, network submission, or local patient-data persistence

## Clinical defaults

Editable constants live in `src/config/clinical.ts`. Anatomical references, package sizes, and protocol presets live in `src/data/`.

- 1 adult handprint = 0.8% BSA = 0.25 g per application
- 2 handprints = 1 FTU = 0.5 g
- Reference adult BSA = 1.73 m²
- 1 month = 30.4375 days
- 1 avoirdupois ounce = 28.3495 g

Adult anatomical totals use the rounded consensus FTU table: face and neck 2.5 FTU; scalp 3; anterior trunk 7; posterior trunk including buttocks 7; one arm excluding the hand 3; one hand 1; one leg excluding the foot 6; one foot 2; and genital region 0.5. The painter's smaller visual subdivisions are approximate but are tested to sum back to those combined totals. At 44 FTU, selecting every separately defined surface is conservatively close to the commonly published whole-body check of approximately 40 FTU; the difference reflects summing independently rounded regional guidance, including separately selectable scalp and genital surfaces.

Clinical reference links and notes are maintained in `src/data/clinicalReferences.ts` and displayed inside Methodology & help. The principal sources are Long and Finlay's 1991 measured FTU study, the 2025 NHS Shropshire/Telford/Wrekin topical-preparations guide, and DermNet's dermatologist-reviewed FTU guide. FPNotebook quantities remain visible only as a clearly labelled legacy table; its 3.5-FTU trunk figure was not used because it conflicts with the 6.7 anterior and 6.8 posterior FTU means in the primary study it cites.

Package optimization prefers a single package or matching package sizes within a practical excess allowance: 20% of the requirement, with a 20 g floor and 30 g cap. Outside that allowance it minimizes excess, followed by container count. A same-size option cannot win by using more containers than the least-excess option. This keeps 120 g + 90 g for a 196 g requirement when 100 g is unavailable, while preferring 2 × 100 g when that size is enabled.

The default package list includes the supplied sizes, with 7.5 g and 225 g initially disabled. The 100 g size is enabled for larger treatment areas.

## Local development

Requirements: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Tests

```bash
pnpm test
```

The suite covers the supplied FTU/handprint examples, BID course quantities, BSA ratios, allowance math, schedule conversions, imperial units, and package safeguards.

## Production build

```bash
pnpm build
```

The static production output is created in `dist/`.

## Static deployment

Deploy the contents of `dist/` to any static host, including GitHub Pages, Netlify, Cloudflare Pages, Azure Static Web Apps, or an S3-compatible site. No server runtime or environment variables are required. Configure the host with:

- Build command: `pnpm build`
- Publish directory: `dist`

## Privacy and data lifecycle

All state exists only in React memory for the active browser tab. The app does not write height, weight, anatomical selections, regimen information, or calculation results to cookies, local storage, session storage, a server, or analytics service. Copying happens only after a user action.

## Important use note

This calculator produces an estimate based on fingertip-unit and handprint methods, not a patient-specific dose. Actual topical medication use may vary with product, vehicle, body site, skin condition, application thickness, hair, dressings, technique, and adherence. Verify the prescribed regimen and available package sizes before dispensing.
