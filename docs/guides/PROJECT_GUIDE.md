# 📘 NIFTY Options Trading Bot — Complete Project Guide (v4.0 AI)

## Project Overview

An institutional-grade automated intraday options trading system for NIFTY 50 that:
- Runs high-speed **Python AI Inferencing** (XGBoost Ensemble)
- Orchestrates data flow via **n8n** (Cloud automation messenger)
- Trades NIFTY options using **Dhan API** (orders) + **Angel One** (candle data)
- Processes **57 unique market features** including Gamma Exposure (GEX) and IV Skew
- Logs institutional-grade datasets to **Google Sheets** for continuous training
- Displays real-time intelligence on a **React Command Center**

---

## 🏗️ Architecture (v4.0 Decoupled)

```
                     ┌─────────────────────────┐
                     │   n8n  (Data Messenger)  │
                     │                         │
  Angel One API ────►│  Candle Data (5-min)     │      ┌──────────────────────┐
  TradingView  ────►│  Spot Price + VIX        │─────►│  Python AI Backend   │
  Dhan API     ────►│  Option Chain            │      │  (FastAPI + XGBoost) │
                     │                         │      └──────────┬───────────┘
                     │  Dhan API Orders ◄──────│◄───────────────┘
                     └──────────┬──────────────┘
                                │
                                ▼
                         Google Sheets ───────► React Dashboard
                         (AI Dataset Sheet)     (Live Command Center)
```

---

## 📁 Project File Structure (v4.0)

```
project/
├── api/                ← 🧠 THE BRAIN (Python Microservice)
│   ├── engine/
│   │   ├── indicators.py     ← Native Pandas math (RSI, EMA, etc)
│   │   ├── writers_zone.py   ← Greeks (GEX, IV Skew, Max Pain)
│   │   ├── preprocessor.py   ← 57-Feature Engineering
│   │   ├── rule_engine.py    ← v3.0 Logic Fallback (Rules)
│   │   └── signal_engine.py  ← AI Orchestrator (XGBoost)
│   ├── scripts/
│   │   └── train_model.py    ← ML Training Pipeline
│   └── start_server.bat      ← Start the local API server
├── src/                ← 🖥️ THE FRONTEND (React Dashboard)
│   ├── services/
│   │   └── sheetsApi.ts      ← Fetches AI Insights from G-Sheets
│   └── index.css             ← Glassmorphism Design System
├── n8n/                ← 🎡 THE PIPELINE (Automation)
│   └── workflows/
│       └── v4.0_AI_TEST.json ← Parallel Messenger Workflow
└── docs/               ← 📚 THE KNOWLEDGE BASE
    └── guides/
        ├── PYTHON_AI_MODEL_ARCHITECTURE.md
        └── LOCAL_AI_OPERATIONS_GUIDE.md
```

---

## 🚀 Setup Guide

### Step 1: Start the Python AI Engine
The logic no longer lives in n8n. You must run the local server:
1. Open terminal in `api/` folder.
2. Run `./start_server.bat`.
3. Go to `http://localhost:8000/health` to confirm the engine is in `RULES_FALLBACK` mode.

### Step 2: Set Up the AI Dataset Sheet
The AI requires more data than the old version.
1. Use the new dedicated sheet: `1NILZ2uOrbBMQ1sw...`
2. Ensure the headers include: `gammaExposure`, `ivSkew`, `candlePatterns`, `PA_Type`, `MACD_status`.
3. The dashboard reads directly from this sheet via CSV export.

### Step 3: Run the Dashboard
```bash
npm install
npm run dev
```
Open: **http://localhost:5173** (Ensure `sheetsApi.ts` points to the new Sheet ID).

---

## 🧠 How the AI Engine Thinks (v4.0)

### 1. Feature Engineering (The 57 Eyes)
Instead of just looking at RSI, the AI analyzes **57 different inputs** simultaneously:
- **GEX (Gamma Exposure):** Is the market pinned by dealers or ready for a squeeze?
- **IV Skew:** Are institutions panicking (buying Puts) or complacent?
- **Volume Profile:** Is price near the Point of Control (Fair Value)?
- **SMC (Smart Money):** Are we breaking out of an institutional Order Block?

### 2. Dual-Brain Decision Path
- **Brain A (AI):** If `xgboost_model.pkl` exists, it uses machine learning to find high-probability patterns.
- **Brain B (Rules):** If no model is trained, it falls back to the strict 25-step v3.0 logic.
- **Confidence:** Both engines output a confidence score (0-100%). Trades only fire above **60% AI confidence** or **+25 Rule threshold**.

### 3. Emergency Kill-Switch
If the AI is behaving weirdly during a news event:
1. Open `api/.env`.
2. Set `FORCE_RULES=true`.
3. Restart the server. The AI is instantly bypassed for the safe ruleset.

---

## 📈 System Health Checklist

- [ ] **Python Health:** `localhost:8000/health` shows "status: ok".
- [ ] **n8n Connectivity:** HTTP Request node in n8n shows "Success (200)".
- [ ] **Google Sheets:** Columns `gammaExposure` and `ivSkew` are logging numbers.
- [ ] **Dashboard:** "AI Insights" column shows the engine's reasoning for setiap WAIT signal.
- [ ] **Training:** You have collected at least 1,500 rows before running `train_model.py`.

---

## � Key Resources

| Resource | Link |
|----------|------|
| **AI Architecture Guide** | [Read More](./PYTHON_AI_MODEL_ARCHITECTURE.md) |
| **Local Operations** | [Read More](./LOCAL_AI_OPERATIONS_GUIDE.md) |
| **Dhan Console** | https://developer.dhan.co |
| **Angel SmartAPI** | https://smartapi.angelbroking.com |

---
*Version 4.0.0 | AI Signal Engine v4.0 | Last Updated: 09 March 2026*
