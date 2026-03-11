# NIFTY ALPHA Project Analysis, Guide, PRD, and Blindspots

Date: 2026-03-03
Author: Codex (repository audit)
Scope: Full repository review (frontend, n8n workflows/scripts, Python APIs, docs, archive layout)

## 1. Executive Summary

This project is a semi-automated intraday options trading platform focused on NIFTY, with an n8n workflow as the execution brain, Google Sheets as the operational datastore, and a React dashboard for observability and validation.

Current maturity: advanced prototype / pre-production system. It has strong momentum, real implementation depth, and useful diagnostics, but it is not yet fully production-safe for unattended live trading because core controls are fragmented, workflow versions are inconsistent, and several operational risks remain unresolved.

## 2. Project Description (Detailed)

### 2.1 What the system does

The system runs a scheduled signal pipeline (5-minute cadence during market hours), computes technical features, generates a directional signal (CE/PE/WAIT/AVOID), and can place orders through broker APIs. It logs all signal/trade states to Google Sheets and visualizes current + historical behavior in a frontend dashboard.

### 2.2 Core business goal

Create a rules-driven intraday options execution system that:
- Generates high-quality entry signals
- Enforces risk gates (VIX, regime, SL/Target)
- Logs everything for traceability
- Allows fast validation through a dashboard before scaling to real capital

### 2.3 Key modules

- Frontend (`src/`): Vite + React + TypeScript dashboard with routes for Overview, Signals, Trades, History, Analytics, Validation, Backtest, Settings.
- Workflow engine (`n8n/workflows/` + `n8n/fixed_nodes/`): orchestration, signal logic, order prep, SL/Target, and exit handling snippets.
- AI/sentiment APIs (`api/`): Flask services for ML-style signal classification and market sentiment enrichment.
- Documentation (`docs/`, `AGENT_DOCUMENT.md`): high-volume operational playbooks and audit notes.

## 3. Architecture and Data Flow

### 3.1 Runtime architecture

1. n8n cron triggers every 5 minutes (`*/5 9-15 * * 1-5`).
2. n8n fetches spot/VIX/candles/option chain/sentiment.
3. Signal logic node computes confidence and final signal.
4. Signals get written to Google Sheets.
5. If signal qualifies, order is prepared and sent to broker.
6. Entry fill is checked, SL/Target legs are created.
7. Trades and order lifecycle updates are logged to Google Sheets.
8. React app polls sheets and renders operational + performance dashboards.

### 3.2 Data model reality

Primary storage is Google Sheets with three key tabs:
- Signals (`gid=0`)
- Active trades (`gid=773018112`)
- Trade summary (`gid=2086062684`)

Frontend service: `src/services/sheetsApi.ts` parses CSV export from public sheet links and maps rows into typed objects.

## 4. Codebase Findings by Layer

### 4.1 Frontend

Strengths:
- Rich operational UI with clear sections and meaningful KPIs.
- Good data parsing fallback in `sheetsApi.ts` (e.g., Indian timestamp normalization).
- Useful validation page and basic reporting export.
- Backtest page is substantial and uses both historical signals and trade summary alignment.

Risks:
- `useTrading()` is invoked in `AppContent` and again inside each page; this causes duplicate polling and repeated network load.
- Settings are local-only (`localStorage`) and do not propagate to n8n automatically.
- Market live data path relies on TradingView scanner call from browser, but CORS fallback frequently downgrades to sheet spot price.

### 4.2 n8n workflows and fixed nodes

Strengths:
- Workflow exports are present and mature.
- Risk concepts exist: VIX gating, confidence filtering, SL/Target placement.
- Fixed node scripts show effort toward operational correctness.

Risks:
- Multiple workflow files with conflicting states; `current_working_workflow.json` has `0` nodes (high confusion risk).
- Node naming mismatch risk (scripts reference names with `1` suffix while workflow exports may differ).
- `n8n/fixed_nodes/exit_monitor_cancel_logic.js` contains a concrete defect: `orderIdToCancel` is used without declaration while `orderToCancel` is declared but unused.

### 4.3 Python APIs

Strengths:
- Flask endpoints for prediction/retrain/health and sentiment enrichment are straightforward and deployable.

Risks:
- ML model is bootstrapped from synthetic/random sample data, so predictive validity for live trading is weak unless retrained on real labeled outcomes.
- No model versioning, drift checks, or evaluation report in repo.

### 4.4 Documentation quality

Strengths:
- Documentation coverage is broad and pragmatic.
- Operational guides are already available for setup and handover.

Risks:
- Single source of truth is not stable; multiple docs/files claim “final” status.
- Visible encoding/mojibake artifacts in several docs and UI strings reduce reliability/readability.

## 5. My Point of View (Technical Assessment)

This is a serious builder’s system with real execution intent, not a toy dashboard. The core strength is velocity plus practical instrumentation. The main weakness is systems discipline: version control of workflows, strict runtime contracts, and production hardening are lagging behind feature growth.

Verdict:
- Product potential: High
- Current production readiness for unattended live capital: Medium-low
- Fastest path to real robustness: consolidate workflow truth, enforce test harnesses, and unify config across n8n + frontend.

## 6. Detailed Project Guide

### 6.1 Recommended source-of-truth files

Use these as canonical until reorganized:
- Workflow: `n8n/workflows/NEWN8NFINAL.JSON`
- Signal/order fix snippets: `n8n/fixed_nodes/*.js`
- Frontend data contract: `src/services/sheetsApi.ts`
- Operational baseline doc: `AGENT_DOCUMENT.md`

### 6.2 Setup guide (developer)

1. Install frontend dependencies from repo root:
   - `npm install`
2. Run frontend:
   - `npm run dev`
3. Import n8n workflow:
   - `n8n/workflows/NEWN8NFINAL.JSON`
4. Paste relevant fixed node code into matching n8n Code nodes.
5. Confirm Google Sheet sharing permissions are read-accessible for frontend CSV pulls.
6. For Python APIs, use `api/requirements*.txt` depending on endpoint set.

### 6.3 Operational workflow guide

1. During market session, cron triggers every 5 minutes.
2. Signal calculation computes confidence and regime.
3. Signal is always logged.
4. Order path should continue only for eligible, non-blocked signals.
5. Entry execution must be verified before SL/Target placement.
6. Exit monitor must cancel opposite leg to prevent unintended residual positions.
7. Dashboard should be treated as monitoring, not source of execution truth.

### 6.4 Recommended engineering standards (immediate)

- Standardize one active workflow file and archive all others clearly.
- Add a workflow-node-name contract document (exact node IDs/names expected by scripts).
- Introduce simple CI checks for TypeScript compile and lint.
- Add smoke tests for CSV parser and timestamp parser.
- Create a config bridge so Settings can export/import n8n-compatible JSON deterministically.

## 7. Product Requirements Document (PRD)

## 7.1 Product title

NIFTY ALPHA Automated Intraday Options Execution Platform

## 7.2 Problem statement

Manual intraday options trading is inconsistent, cognitively heavy, and difficult to audit. Users need a rules-based engine that can generate, validate, and optionally execute signals while preserving complete traceability.

## 7.3 Target users

- Primary: independent intraday options trader running NIFTY strategy
- Secondary: technically capable operator managing workflow, broker connectivity, and analytics

## 7.4 Goals

- G1: Generate deterministic signals every 5 minutes during market hours.
- G2: Enforce risk controls before order placement.
- G3: Maintain full event log for signals and trades.
- G4: Provide real-time and historical observability via dashboard.
- G5: Support safe migration path from paper mode to live mode.

## 7.5 Non-goals

- Portfolio-level multi-asset optimization in current phase.
- Fully autonomous ML strategy replacement.
- Broker-agnostic abstraction layer in current phase.

## 7.6 Functional requirements

- FR1: Scheduled workflow execution (`*/5` market-hour cadence).
- FR2: Pull and compute technical indicators and contextual metrics.
- FR3: Produce `finalSignal`, `confidence`, `regime`, and reason trail.
- FR4: Block trading on unsafe regimes/volatility conditions.
- FR5: Place entry order for eligible signals.
- FR6: Place linked SL and target legs post fill.
- FR7: Cancel opposite leg when one exit leg executes.
- FR8: Persist all signals, active trades, and trade summaries.
- FR9: Dashboard pages for Signals, Trades, History, Analytics, Validation, Backtest, Settings.
- FR10: Export validation report CSV.

## 7.7 Non-functional requirements

- NFR1: UI refresh within 30 seconds during market hours.
- NFR2: Parser robustness for locale-formatted timestamps.
- NFR3: Deterministic behavior for threshold-based signal logic.
- NFR4: Clear operational audit trail for every decision edge.
- NFR5: Fail-safe behavior when market data fetch fails.

## 7.8 Success metrics

- Signal pipeline uptime during market window (% successful cycles).
- Trade lifecycle integrity (% trades with correct entry+exit logging).
- Error rate in workflow runs per day.
- Median dashboard data freshness lag.
- Strategy KPIs (win rate, PF, drawdown) tracked but not sole reliability metric.

## 7.9 Milestones

- M1: Consolidate workflow source of truth and naming contract.
- M2: Harden risk controls and exit-cancel logic.
- M3: Add test + CI baseline for parser, signal transforms, and UI compile.
- M4: Add config synchronization between settings UI and n8n runtime.
- M5: Controlled live rollout with circuit breakers and alerts.

## 7.10 Dependencies

- n8n runtime stability
- Broker API auth/token health
- Google Sheets availability and schema consistency
- Optional APIs (sentiment, live quote endpoints)

## 7.11 Risks and mitigations

- Broker/API outage: automatic no-trade failover + alerts.
- Schema drift in sheet columns: schema validator before parsing.
- Duplicate polling overhead: centralized shared state or context provider.
- Workflow/script mismatch: enforce node-name contract and pre-flight checks.

## 8. Blindspots (Prioritized)

### Critical blindspots

1. Workflow source-of-truth fragmentation.
   - Multiple “final/current/enhanced” JSONs can cause accidental deployment of stale logic.

2. Exit cancel logic defect in fixed node script.
   - `orderIdToCancel` undeclared in `exit_monitor_cancel_logic.js` can break cancellation behavior.

3. Frontend poll fan-out.
   - Repeated `useTrading()` calls likely produce redundant requests and inconsistent UI snapshots.

4. Secret/config exposure risk.
   - Hardcoded identifiers (sheet ID, client IDs) and public sheet dependency increase operational risk.

### High blindspots

5. Config split-brain.
   - Settings UI is local-only; n8n execution config is separate and manual, enabling drift.

6. Incomplete production data governance for ML APIs.
   - Model training defaults to synthetic data and lacks quality gates.

7. Node naming coupling risk.
   - Code snippets assume exact n8n node names; rename breaks runtime silently.

### Medium blindspots

8. Encoding/character corruption in docs and UI strings.
   - Makes runbook quality weaker and can hide semantic errors.

9. No automated regression safety net.
   - Missing unit/integration tests for parser, scoring, and workflow contract assumptions.

10. Observability not unified.
   - Dashboard indicates status but no single incident/error timeline across workflow + APIs + broker.

## 9. Recommended Next Actions

1. Consolidate and freeze one workflow file as canonical; archive the rest with explicit status tags.
2. Fix `exit_monitor_cancel_logic.js` variable bug and re-validate end-to-end exit handling.
3. Refactor frontend data fetching to shared singleton/context polling to eliminate duplicate calls.
4. Implement schema contract checks for all Google Sheet tabs before parsing.
5. Introduce CI with: `eslint`, `tsc --noEmit`, parser tests, and one smoke test for route rendering.
6. Add a secure config layer (`.env` + docs) to remove hardcoded runtime identifiers.

## 10. Closing Assessment

The project is close to becoming a reliable operator-grade trading platform if engineering discipline catches up with feature progress. Most work required now is not new features; it is consolidation, correctness hardening, and operational safety.
