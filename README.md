# Peace Lab - UCL Transparent Funding

A production-oriented interactive dashboard that visualizes University College London (UCL) finance data using official HESA finance tables.

## Overview

This project presents transparent, drill-down finance views for UCL using:

- **Table 1**: Consolidated income and expenditure flow
- **Table 5**: Research grants and contracts by source and cost centre
- **Table 6**: Tuition fees and education contracts breakdown
- **Table 8**: Expenditure breakdown by activity

The dashboard is built as a React + TypeScript app with charting powered by ECharts.

## Data Source

Data comes from **HESA (Higher Education Statistics Agency)** finance releases:

- Portal: https://www.hesa.ac.uk/data-and-analysis/finances

This project filters to:

- **Provider**: University College London
- **UKPRN**: `10007784`

All chart values are displayed in **£000s** as provided in source files.

## Key Features

- Modern multi-page dashboard UI
- Main Sankey flow for income and expenditure (Table 1)
- Click-based modal drill-downs on overview charts
- Department comparison page with:
  - all-department pie share
  - all-department bar ranking
  - single-department detailed Sankey
- Data Reference page documenting tables, columns, caveats, and official links



## Important Data Notes

- Table 5 supports multi-year UCL analysis in the provided data (2015/16 to 2023/24).
- Tables 1, 6, and 8 contain a single UCL row in the current provided files (2023/24).
- Dashboard values are shown directly from provided datasets; no synthetic extrapolation is used.

