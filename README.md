# SFD & BMD Calculator

Interactive shear force diagram (SFD) and bending moment diagram (BMD) calculator for beams — built for civil and structural engineers.

Everything runs in the browser: no server, no API, no telemetry. The analysis engine is a self-contained statics solver.

## Features

- **Beam types** — simply supported, cantilever (clamped left or right), and overhanging.
- **Loads** — point loads (with any inclination from horizontal), uniformly distributed loads (UDL), triangular/varying loads (UVL), and concentrated moments. Loads can be placed anywhere on the span.
- **Live diagrams** — the beam loading sketch, the SFD and the BMD are drawn from the same sampled solution and share one horizontal scale.
- **Results table** — support reactions and the extreme shear and moment values, each with the abscissa where it occurs.
- **Metric / imperial units** — switch at any time; every value is converted, not just relabelled.
- **Light / dark / system theme** — persisted in `localStorage`, applied before first paint to avoid a flash.

## Sign conventions

- x increases to the right; y is upwards.
- Downward loads are positive magnitudes.
- Bending moment is **sagging-positive** (tension on the underside); hogging moments are negative.
- Applied concentrated moments are **counter-clockwise positive**; the fixed-end reaction moment is reported with the same convention.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script          | Purpose                                    |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start the dev server                       |
| `npm run build` | Production build                           |
| `npm start`     | Serve the production build                 |
| `npm run lint`  | ESLint                                     |
| `npm test`      | Unit tests for the analysis engine         |

## Project structure

```
src/
├── app/            # App Router entry points, global styles
├── components/     # UI and SVG diagram rendering
└── lib/
    ├── analysis.js # Statically determinate beam solver (SI units internally)
    ├── scale.js    # Shared chart geometry and axis tick generation
    └── units.js    # Unit systems, conversion factors and number formatting
tests/
└── analysis.test.js
```

The solver works in SI units internally; the display layer converts on the way in and on the way out. `lib/units.js` holds the single source of truth for the conversion factors.

## How the analysis works

`lib/analysis.js` samples the shear and moment functions at every event point (supports, load positions, load extents) and subdivides each span between them. At each sample the value is obtained from the free body to the left of the cut, with one-sided limits used at discontinuities so that a point load produces a step in the shear but not a spurious step in the moment.

`tests/analysis.test.js` covers the classical results — central point load, full-span UDL and UVL, applied couples, overhanging beams, inclined loads, and both cantilever orientations — and asserts that the bending moment is continuous across a clamped end.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · no runtime dependencies beyond the framework.

## Disclaimer

This tool is intended for study, checking and preliminary design work. Verify results with a full structural analysis before using them for design.
