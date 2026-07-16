# The City Ledger: NYC Government Spending & Grant Analysis

**The City Ledger** is an interactive, high-fidelity data analytics application designed to query, explore, and audit New York City Council Discretionary Funding across two decades. Developed in collaboration with **DSSG-NYC** and organized by **Data Diplomats**, the app turns complex municipal budget records into a modern, responsive, and accessible open-data dashboard.

---

## 🎯 Project Objectives

1. **Democratic Transparency**: Unlock over 20 years of City Council discretionary funding data (compiled from BetaNYC's Open Data repository) to show where public tax dollars go.
2. **Agency & Borough Audits**: Enable civic researchers and community members to track funding distribution across key agencies (DYCD, DCLA, DOHMH, HRA, DFTA) and the five boroughs of New York City.
3. **Historical Context**: Provide an interactive timeline of aggregate funding growth from **FY2010 to FY2027 (Est)**, with specialized drill-downs into nonprofit sector trends.
4. **Interactive Audit Desk**: Offer a sandbox environment to search, filter, and run simulated queries against council-member-specific resolutions, historical initiatives, and organization awards.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React 18+ with TypeScript, bundled via Vite.
- **Styling**: Tailored Tailwind CSS matching the **DSSG-NYC** classic editorial design system (featuring DSSG Navy `#003B71` and Accent Orange `#F27D26`).
- **Data Visualization**: Rich interactive charts built with **Recharts** (Line Charts, Bar Charts, and Pie Charts) that support fluid resizing and deep data exploration.
- **Component Design**: Modular structure with strict separation of logic (under `src/data/budgetData.ts`) and presentation (under `src/components/BudgetAnalytics.tsx`).

---

## 📊 Quality Assurance: Source Data & Methodology

For quality assurance and peer review, here is the direct trace of our active dataset metrics as defined in `src/data/budgetData.ts`:

### 1. The 5,200 Grants Metric (Across all 5 NYC Boroughs)
- **Code Reference**: Defined in `NYC_BUDGET_OVERVIEW.totalAllocations` (set to `5200`).
- **Data Origin & Formulation**: 
  - This is a composite, compiled total representing the cumulative number of individual discretionary grant allocations across all 5 participating agencies (DYCD, DCLA, DOHMH, HRA, DFTA) in the FY25/FY26 Adopted Operating Budget.
  - In our schema:
    - **DYCD** (Department of Youth & Community Development) accounts for **1,850** allocations.
    - **DCLA** (Department of Cultural Affairs) accounts for **1,120** allocations.
    - **DOHMH** (Department of Health and Mental Hygiene) accounts for **940** allocations.
    - **HRA** (Human Resources Administration) accounts for **760** allocations.
    - **DFTA / Aging** (Department for the Aging) accounts for **530** allocations.
    - **Total Cumulative Sum**: `1,850 + 1,120 + 940 + 760 + 530 = 5,200` total individual grants awarded across the city.

### 2. Food Security & Emergency Pantries Trend ($16.5M in FY2020 to $35.4M in FY2026)
- **Code Reference**: Stored in the `TRENDING_TOPICS_DATA` array (under `src/data/budgetData.ts`, lines 454–464).
- **Data Trend Trace**:
  - **FY2020**: `$16.5M`
  - **FY2022**: `$24.2M`
  - **FY2024**: `$31.0M`
  - **FY2026**: `$35.4M`
  - **Cumulative Growth**: **+114.5%**
- **Methodology & Context**:
  - These values are derived from BetaNYC's historical PDF extraction analysis of council-member-designated discretionary initiatives. 
  - Specifically, they track the growth of direct allocations under the **Emergency Food Assistance Program (EFAP)** and local community pantries. 
  - The rapid growth reflects the municipal policy pivot during and immediately after the COVID-19 pandemic to bolster direct neighborhood supply nets and food delivery logistics.

---

## 🚀 Running the Project

### Dev Mode
To run the local development server:
```bash
npm run dev
```

### Build & Compilation
To generate a production-ready build:
```bash
npm run build
```

The compiled assets will be bundled into the `/dist` directory. All TypeScript type configurations are validated strictly via the linter (`npm run lint`).

---

## 🤖 Live AI Agent — BetaNYC NYC-Budget MCP

The **Budget Agent** tab and the server-side grounding for the **Grant Matcher** and **Drafting Assistant** are powered by BetaNYC's official [`@betanyc/nyc-budget-mcp`](https://github.com/BetaNYC/New-York-City-Budget/tree/main/mcp) Model Context Protocol server. Rather than relying on the model's memory, the app spawns this MCP server as a stdio subprocess (`mcpClient.ts`) and lets the LLM call its 7 real, data-backed tools:

| Tool | Purpose |
|---|---|
| `search_awards` | Schedule C awards by EIN / org / program / member / year / category / initiative (FY2015–FY2027) |
| `get_awards_by_ein` | Every award for an EIN across all years, with per-year totals |
| `search_capital_projects` | §254 capital by agency / year / sponsor / title |
| `search_transparency_resolutions` | Post-adoption designations, rescissions, purpose changes |
| `get_terms_conditions` | Reporting mandates by year / agency |
| `get_legistar_link` | Legistar matter / URL / adoption date for a source document |
| `list_available_fiscal_years` | Exact per-dataset coverage (the parse-gap honesty guard) |

The MCP ships a prebuilt SQLite index built directly from the same BetaNYC CSVs the analytics dashboard traces to, so **every figure the agent reports is grounded in the source data.**

- **Budget Agent** (`/api/agent/chat`) runs an agentic tool-use loop — Google Gemini (primary) or Anthropic Claude (fallback) — and returns the answer plus the exact tool calls it made (visible under "MCP data lookups" in the UI).
- **Grant Matcher** (`/api/grant/match`) and **Drafting Assistant** (`/api/grant/draft`) pre-fetch real, matching FY2027 awards for the organization's focus area and inject them into the prompt before generating recommendations.
- **Diagnostics:** open **`/api/health/mcp`** on the deployment to confirm the MCP subprocess spawns and lists its tools live.

> **Deployment note:** the MCP runs as a Node subprocess with a native `better-sqlite3` binary, so the API must run on Vercel's Node.js runtime (not Edge). `vercel.json` uses `includeFiles` to bundle the MCP package and its native dependency into the serverless function. Because the package's SQLite index ships in WAL mode and serverless `node_modules` is mounted read-only (a WAL open needs to create a `-shm` file, which fails with `SQLITE_CANTOPEN` there), `mcpClient.ts` stages the server into the writable `/tmp` dir at cold start and converts the copied database out of WAL mode before spawning it. No extra API key is required for the MCP itself; the LLM keys (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) drive the agent.
