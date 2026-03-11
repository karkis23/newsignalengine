# 🏙️ ZENITH: The Complete Terminal Specification

> **Version:** 1.3 (Institutional Standard)
> **Revision Date:** 2026-03-11
> **Author:** Zenith Engineering Group

---

## Executive Summary
ZENITH is a high-fidelity market analysis and automated execution terminal. It represents the pinnacle of retail trading technology, bridging the gap between discretionary analysis and algorithmic execution. By leveraging Python-based intelligence hubs and a sophisticated glassmorphic interface, ZENITH provides traders with an institutional-grade environment for NIFTY options operations.

---

## 1. System Vision
The primary objective of ZENITH is to eliminate the "Discretionary Gap"—the space where human emotion and fatigue lead to poor execution.

### The Five Pillars of Zenith
1.  **Objective Intelligence:** Directions are calculated by the Intelligence Hub, not human intuition.
2.  **Visual Transparency:** Every KPI and logic trigger is exposed in the Terminal Interface.
3.  **Risk Isolation:** Capital is managed through automated Stop-Loss and Target parameters.
4.  **Operational Consistency:** Decisions occur on fixed 5-minute schedules, removing timing bias.
5.  **Audit Fidelity:** Every market engagement is recorded in the Persistent Ledger (Google Sheets).

---

## 2. Component Architecture

### A. Intelligence Hub (Python Microservice)
- **Role:** Feature engineering and signal generation.
- **Engine:** XGBoost with Rules-Based Fallback logic.
- **Vectors:** ADX, RSI, SuperTrend, IV Skew, Put-Call Ratio, and Volume Profiling.
- **Protocol:** FastAPI REST endpoint for low-latency inference.

### B. Operational Matrix (n8n Orchestrator)
- **Role:** Pipeline management and state persistence.
- **Logic:** Fetches market ticks from Angel One, processes orders via Dhan HQ, and manages the trade lifecycle.
- **Polling:** Triggered every 5 minutes during market hours.

### C. Terminal Interface (React Dashboard)
- **Role:** Monitoring and system control.
- **Visuals:** Zen Midnight Design System (Glassmorphic, Slate-toned).
- **Controls:** Real-time refresh, polling toggle, and manual signal override.

---

## 3. The Professional Terminal Design
The ZENITH interface is designed for "Extended Mission Monitoring."

### Layout Hierarchy
1.  **Header:** Global system health, market status (NIFTY/VIX), and primary controls.
2.  **Sidebar:** Navigation through Terminal Hubs (Overview, Signals, Positions, etc.).
3.  **Active Workspace:** The primary data area, featuring fading transitions and slide-up animations for smooth state updates.

### Design Tokens
- **Background:** Midnight Slate (`#020617`).
- **Surface:** Glassmorphic translucent overlays.
- **Typography:** Inter (Standard) / JetBrains Mono (Numeric/Financial Data).
- **Accents:** Azure Blue (`#3b82f6`) for system highlights, Emerald/Red for market direction.

---

## 4. Normalization of Nomenclature
To maintain institutional standards, the following terms are used exclusively:

| Category | Preferred Term | Avoid |
|---|---|---|
| Main Dashboard | **Overview** | Dashboard |
| Current Signal | **Market Logic** | Prediction |
| Open Trades | **Active Positions** | Open Orders |
| Historical Data | **Trade Ledger** | Past Trades |
| AI Scoring | **Confidence Vector** | AI Percent |
| Market State | **Regime** | Environment |

---

## 5. Risk Controls & Protocols
- **Volatility Guard:** The system monitors the VIX. If risk exceeds the internal threshold (18+), signals are automatically suppressed.
- **Regime Filtering:** Signals are only active in identified "Trended" regimes. "Sideways" regimes trigger a "Wait" state.
- **Emergency Suspension:** The Global Pause function in the Header terminates all polling cycles instantly.

---
*Zenith Project Documentation | "Precision Execution. Institutional Vision."*
