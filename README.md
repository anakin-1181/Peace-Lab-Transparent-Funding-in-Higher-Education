# Peace Lab - UCL Transparent Funding

Interactive transparency dashboard for University College London (UCL), using official HESA finance tables.

## Overview

Peace Lab - UCL Transparent Funding is a production-ready web dashboard for exploring UCL finance data from HESA tables.
It focuses on clear flow visualization, exact source values (no extrapolation), and transparent drill-downs across income, expenditure, tuition, and research activity.

## Features

- Main overview Sankey based on Table 1 with year selection from available source years.
- Drill-down modal charts from the overview for:
- Tuition fee composition (Table 6).
- Research grant source composition (Table 5).
- Expenditure composition (Table 8).
- Department analysis page with:
- Cross-department comparison (pie + ranking bar).
- Department-specific Sankey deep dive.
- Data Reference page with table descriptions, key columns, and HESA context.
- Embedded light LLM chatbot for data-grounded Q&A with safety filtering and response guardrails.

## 1) Project Repository Breakdown

```text

├── Data/                      # Local raw CSV source files (gitignored in normal deployment flow)
├── dashboard/                 # Frontend app + serverless chat endpoint
│   ├── api/                   # Vercel serverless API routes (chat backend)
│   ├── public/                # Static assets and generated dataset (ucl-data.json)
│   ├── scripts/               # Data build/transform scripts
│   ├── src/                   # React + TypeScript application source
│   │   ├── components/        # Reusable UI components (charts, layout, chat widget, etc.)
│   │   ├── pages/             # Route-level pages (Overview, Departments, Data Reference)
│   │   ├── lib/               # Chart shaping, formatting, chatbot helpers, data reference metadata
│   │   ├── data/              # Client-side data loading hooks
│   │   └── styles/            # Global styling
│   ├── package.json           # Scripts/dependencies
│   └── vite.config.ts         # Build/dev configuration
├── .gitignore                 # Includes Data folder and local env files
└── README.md                  # Project overview (this file)
```

Key roles:
- `dashboard/scripts/build-data.mjs`: Parses HESA CSV files, filters UCL (`UKPRN 10007784`), writes `dashboard/public/ucl-data.json`.
- `dashboard/src/lib/charts.ts`: Converts loaded data into chart-ready structures.
- `dashboard/src/pages/*`: Defines what appears on each dashboard tab.
- `dashboard/api/chat.js`: Server-side chatbot orchestration and safety controls.

## 2) Data Processing Method (Without Uploading `/Data` to GitHub)

Data pipeline:
- Raw CSVs stay local in `/Data` (outside app folder).
- Run `npm run build:data` in `dashboard/`.
- Script reads `../Data`, transforms tables, and outputs `dashboard/public/ucl-data.json`.
- Dashboard UI loads only `/ucl-data.json` at runtime.

Why this works with `/Data` in `.gitignore`:
- `/Data` is not required at runtime in production if `public/ucl-data.json` is committed.
- Build script has a fallback: if `/Data` is missing but `public/ucl-data.json` exists, it uses the prebuilt dataset and exits successfully.
- This supports GitHub/Vercel deployment without uploading raw data files.

Practical workflow:
- Local refresh with new source files: `npm run build:data`.
- Validate app: `npm run check` and `npm run build`.
- Commit code + `dashboard/public/ucl-data.json`, but keep `/Data` private/local.

## 3) Chatbot: Architecture, Context, and Guardrails

Architecture:
- Frontend widget: `dashboard/src/components/ChatWidget.tsx`.
- Client request builder: `dashboard/src/lib/llmChat.ts`.
- Server endpoint: `dashboard/api/chat.js`.
- Model provider: OpenRouter (`OPENROUTER_API_KEY` + selected model).

Context sent to the model:
- Provider identity (`UCL`, `UKPRN`).
- Data reference metadata (HESA organization, portal links, table definitions).
- Table snapshots from loaded dataset (`table1`, `table5`, `table6`, `table8`).
- `table1`, `table6`, `table8` are provided as `years` + `byYear`; `table5` includes `years`, `latestYear`, research total, and top departments summary.
- Recent chat history window (last 8 messages).

Guardrails:
- Input moderation/sanitization: inappropriate terms are masked/redacted before model processing.
- Constrained system instruction: model is told to use only provided data context and not invent values.
- Explicit fallback behavior: if value is missing, response should say it is not available in loaded dataset.
- Transport safety: JSON parsing is defensive for empty/invalid responses.
- Operational resilience: retries/fallback models for temporary upstream failures (e.g., 502/503), plus timeout handling.
- Low creativity configuration (`temperature` kept low) to reduce hallucination risk.
