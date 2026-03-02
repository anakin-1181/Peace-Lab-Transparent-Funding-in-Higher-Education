# UCL Finance Flow Dashboard

Interactive, production-ready dashboard for University College London finance flows using HESA/OfS Tables 1, 5, 6, and 8.

## Run

```bash
cd dashboard
npm install
npm run dev
```

## Build

```bash
npm run build
```

`npm run build` runs `npm run build:data` first, which streams raw CSVs from `../Data/` and generates:

- `public/ucl-data.json`

## Pages

- `/` Overview
  - Single-year Sankey from Table 1 exact values (`2023/24` in provided data)
  - Main Sankey: Income -> Total income -> Expenditure
  - Drill-down modals:
    - Tuition (Table 6): UK vs Non-UK + other fee components
    - Research grants (Table 5 for the same overview year)
    - Expenditure (Table 8)
- `/departments`
  - Year + department dropdown
  - All-department comparison first (pie share + bar ranking)
  - Single department Sankey (Table 5 exact values only)

## Data Notes

- Provider is strictly filtered to `University College London` (`UKPRN: 10007784`).
- Table 5 includes multi-year rows (2015/16 to 2023/24 for UCL in provided files).
- Table 1/6/8 each contain one UCL row in the provided files (`2023/24` baseline), and the dashboard shows those exact values without extrapolation.
