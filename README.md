# FTU Calculator

A responsive clinical tool for estimating the quantity of topical medication
needed for a prescribed treatment course.

**[Open FTU Calculator](https://ltl0540.github.io/FTU-Calc/)**

## Features

- Paint affected areas on accessible front and back anatomical figures
- Separate adult and pediatric views with optional patient-size adjustment
- Quick regional presets and handprint or body-surface-area entry
- Flexible application frequencies, treatment durations, and supply buffers
- Live estimates in grams, ounces, or both
- Suggested dispensing quantities based on available package sizes
- Clear calculation summary suitable for copying into dispensing notes
- Touch-friendly and keyboard-accessible controls
- No login, patient identifiers, analytics, or saved patient information

## Using the calculator

1. Select or paint the areas being treated.
2. Enter the application frequency and treatment duration.
3. Optionally enter patient measurements and enable size adjustment.
4. Review the estimated amount per application, treatment requirement, and
   suggested quantity to dispense.
5. Copy the concise summary if needed.

## Clinical approach

The calculator uses established fingertip-unit and handprint conventions to
produce an estimate. Patient-size adjustment is optional and clearly shown
when active. A transparent calculation breakdown and supporting references are
available within the application's **Methodology & help** section.

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

The automated suite checks the calculator's clinical conversions, scheduling,
patient-size adjustment, and package recommendations.

## Production build

```bash
pnpm build
```

The static production output is created in `dist/`.

## Static deployment

Deploy the contents of `dist/` to any static host, including GitHub Pages, Netlify, Cloudflare Pages, Azure Static Web Apps, or an S3-compatible site. No server runtime or environment variables are required. Configure the host with:

- Build command: `pnpm build`
- Publish directory: `dist`

The included `.github/workflows/deploy-pages.yml` workflow tests, builds, and
deploys the app to GitHub Pages after each push to `main`. In the repository's
**Settings → Pages**, set **Source** to **GitHub Actions**. The deployed project
URL is <https://ltl0540.github.io/FTU-Calc/>.

## Privacy and data lifecycle

Calculations remain in the current browser session. The tool does not submit or
retain height, weight, anatomical selections, regimen information, or results,
and it does not use cookies or analytics.

## Important use note

This calculator produces an estimate based on fingertip-unit and handprint methods, not a patient-specific dose. Actual topical medication use may vary with product, vehicle, body site, skin condition, application thickness, hair, dressings, technique, and adherence. Verify the prescribed regimen and available package sizes before dispensing.

## License

Copyright © 2026 LokTin Labs. Licensed under the
[PolyForm Noncommercial License 1.0.0](LICENSE). Noncommercial use,
modification, and redistribution are permitted under its terms; commercial
use requires separate permission from LokTin Labs.
