# Peace Lab - UCL Transparent Funding

An interactive transparency dashboard for University College London (UCL) finance data, built from official HESA finance tables.

## What This Dashboard Does

- Visualizes UCL income and expenditure flows with a main Sankey chart (Table 1).
- Supports drill-down exploration for:
  - tuition fee composition (Table 6),
  - research income sources (Table 5),
  - expenditure structure (Table 8).
- Provides a department analysis page with:
  - all-department comparison (pie + ranking bar),
  - single-department detailed Sankey flow.
- Includes a data assistant chat widget that:
  - answers questions grounded in loaded UCL data,
  - answers data-reference questions (for example, “What is HESA?”),
  - applies inappropriate-term masking/redaction before model processing.

## Data Background

### What Is HESA?

**HESA (Higher Education Statistics Agency)** is the UK authority for higher education data and analysis.

- Finance portal: https://www.hesa.ac.uk/data-and-analysis/finances

### Data Scope Used in This Dashboard

- Provider: **University College London (UCL)**
- UKPRN: **10007784**
- Units: values are shown in **£000s** (as reported in source files)
- Tables used:
  - **Table 1**: Consolidated statement of comprehensive income and expenditure
  - **Table 5**: Research grants and contracts by source and HESA cost centre
  - **Table 6**: Tuition fees and education contracts
  - **Table 8**: Expenditure breakdown by activity and cost centre

### Data Integrity Notes

- Dashboard values are shown directly from provided datasets; no synthetic extrapolation is used.
- Table 5 supports multi-year analysis in the included files.
- In the current provided files, Tables 1, 6, and 8 are represented by the latest UCL reporting row.
- HESA restatements/caveats are documented in the in-app **Data Reference** page.

## Use The Web App

Use the deployed **Peace Lab - UCL Transparent Funding** web app to explore the dashboard interactively.

- Start on **Overview** for high-level funding flow.
- Move to **Departments** for cross-department comparison and deep dives.
- Open **Data Reference** to understand table definitions, columns, and caveats.
