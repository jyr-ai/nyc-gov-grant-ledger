# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**The City Ledger** — an interactive dashboard for NYC Council Schedule C discretionary funding (FY2009–FY2027), plus three AI-backed tools for non-profits seeking that funding (grant matcher, proposal drafter, prequalification/filing guide). Single-page React app served by an Express server, deployed to Vercel as a serverless function. Originally scaffolded in Google AI Studio.

## Commands

```bash
npm run dev      # Express + Vite middleware (dev), http://localhost:3000
npm run build    # vite build (client) + esbuild bundle server.ts -> dist/server.cjs
npm start        # node dist/server.cjs (production, expects NODE_ENV=production)
npm run lint     # tsc --noEmit — the ONLY type/quality gate; there is no ESLint/Prettier
npm run clean    # rm -rf dist server.js
```

There is **no test suite** and no test runner configured. `npm run lint` (bare `tsc --noEmit`) is the sole automated check — run it after any TypeScript change.

## Architecture

**One Express app, two runtime shapes.** `server.ts` builds and exports the Express `app`. Locally, `startServer()` runs it with Vite in middleware mode (SPA). On Vercel, `startServer()` is skipped (guarded by `process.env.VERCEL`); instead `api/index.ts` re-exports the same `app` as the serverless handler, and `vercel.json` rewrites `/api/:path*` to it. So all API code lives in `server.ts` and runs identically in both environments — edit endpoints there, not in `api/`.

**AI provider chain (server-side only).** `generateAIContent()` in `server.ts` is the single choke point for all LLM calls. Primary engine is **Google Gemini** (`gemini-2.5-flash`); **Anthropic Claude** (`CLAUDE_MODEL` constant) is an automatic fallback used only when Gemini is unconfigured or errors. Keys come from `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`; a key equal to its placeholder (`MY_GEMINI_API_KEY` etc.) counts as unconfigured. API keys never reach the client — the browser only calls `/api/*`.

**Diagnostics endpoints.** `/api/health` (basic), `/api/health/gemini` (live provider auth test, drives the "Test AI Connection" button), and `/api/debug` (masked key presence + live tests for both providers). `/api/debug` is intentionally safe to expose — it never returns full secret values. Reach for these first when AI calls fail on a deployment.

**Client error handling.** `src/lib/apiError.ts` (`fetchApi`) is the mandatory way the frontend calls the API. It exists because Vercel returns **plain-text** error pages (e.g. "A server error has occurred", `FUNCTION_INVOCATION_TIMEOUT`) that break naive `response.json()`. `fetchApi` reads bodies defensively and `classify()` maps HTTP status + body into human-readable `ApiErrorReport`s. Use `fetchApi` for new API calls rather than raw `fetch`.

**Frontend.** `src/App.tsx` is a tab shell (`analytics | matcher | drafter | prequal`) with shared prefill state that bridges the Matcher → Drafter. One component per tab under `src/components/`. React 19 + `motion` for transitions, `recharts` for charts, `lucide-react` icons, Tailwind CSS v4 (via `@tailwindcss/vite`, configured in `src/index.css`, not a `tailwind.config.js`). The `@/*` path alias maps to the repo root.

## Data pipeline (important)

All budget figures are **real, sourced, and traceable** — do not fabricate or estimate numbers here.

- `src/data/budgetData.ts` — the app's runtime data (overview totals, agency ledger, focus areas, historical trend, initiatives, council roster). Imported directly by `server.ts` (note the `.js` extension in the import — required for Node ESM resolution on Vercel; it resolves to the `.ts` source). Read the header comment before touching any figure.
- `data/schedule-c-reconciliation/` — the audit trail: `fyNN.json` (parsed per-year tables) + `raw/fyNN.txt` (original BetaNYC reconciliation text) + `index.json` (headline figures per year). Every number in `budgetData.ts` should trace back to a committed file here.

Data conventions that must be preserved:
- **Adopted-budget totals use the `printed` column**, never `initiatives` (working-paper), which differ by reconciliation variance in some years.
- **Award/agency/EIN-level data exists only FY2015+.** FY2009–FY2014 are "early-era" filings with category-level totals only — leave award counts / agency breakdowns `undefined` for those years, never estimated.
- The Agency Ledger panel **excludes** the large untagged dollar pool (awards with no agency tag) rather than showing an "Unattributed" row.
- Schedule C has **no borough field**; the "Capital Budget by Borough" panel uses the FY27 capital file — a different budget instrument, labeled as such.
- `sector-category-mapping.json` is **editorial classification, not sourced from BetaNYC** — our own 5-bucket grouping of raw category names (including BetaNYC's original typos/renames).

## Notes

- `README.md` says "React 18"; the project is actually on **React 19**.
- Vite HMR/file-watching is disabled when `DISABLE_HMR=true` (set by AI Studio to prevent flicker during agent edits) — see `vite.config.ts`.
