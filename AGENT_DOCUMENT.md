# 🤖 AGENT DOCUMENT — NIFTY ALPHA Trading Bot v4.0 (AI Edition)

> **Purpose:** This document is the single source of truth for the project's current AI-driven state. Read this FIRST before modifying ANY file.
> **Last Updated:** 09 March 2026 (v4.0.0)

---

## 1. What This Project Is (v4.0 Architecture)

A hybrid institutional-grade trading system. We have transitioned from **n8n-hosted JavaScript** (v3.0) to a dedicated **Python AI Microservice** (v4.0).

| Component | Location | Status |
|---|---|---|
| **Python AI API** | `api/` | ✅ **FASTAPI** running on `localhost:8000` |
| **n8n Workflow** | `n8n/workflows/v4.0_AI_TEST.json` | ✅ Messenger mode (Decoupled from logic) |
| **Signal Logic (Fallback)** | `api/engine/rule_engine.py` | ✅ 1:1 Port of v3 rules logic |
| **Signal Logic (AI)** | `api/engine/signal_engine.py` | ✅ XGBoost Model loader (ready for inference) |
| **Indicators Engine** | `api/engine/indicators.py` | ✅ Pandas/NumPy calculator (v2.0 fixed indicators) |
| **Options Intelligence** | `api/engine/writers_zone.py` | ✅ **GEX**, **Max Pain**, and **IV Skew** added |
| **React Dashboard** | `src/` | ✅ Live at `localhost:5173` |
| **Google Sheets** | `1NILZ2uOrbBMQ1sw...` | ✅ Dedicated v4 Dataset Sheet |

---

## 2. Current State (The v4.0 Shift)

### ✅ DEPLOYED — High-Speed Python Microservice
- **Decoupled Architecture**: All indicator math and signal logic has moved out of n8n. n8n now simply fetches market data and "asks" the Python API for the decision.
- **Dual-Engine Strategy**: The API runs in `RULES_FALLBACK` (v3 login in Python) until an XGBoost model is trained via live data.
- **Institutional Indicators**: Added Volume Profile (POC/VAH/VAL), Gamma Exposure (GEX), and IV Skew Term Structure bias.

### ✅ DONE — Data Pipeline for Machine Learning
- **Feature Engineering**: `preprocessor.py` converts market conditions into 57 numerical weights for the AI to learn.
- **Parallel Testing**: A cloned n8n workflow runs v4.0 in secret while v3.0 remains live, allowing for side-by-side performance comparison.
- **Training Script**: `scripts/train_model.py` is ready to ingest CSV logs from Google Sheets once enough data is collected.

---

## 3. File Map — The v4.0 Layout

### When you need to change the SIGNAL LOGIC:
→ **Rule Changes**: Edit `api/engine/rule_engine.py` (Edit the 25 logic steps).
→ **AI Model**: Edit `api/scripts/train_model.py` (To tune how the AI learns).
→ **Bypass AI**: Set `FORCE_RULES=true` in `api/.env` to force the rule engine.

### When you need to change the INDICATOR MATH:
→ Edit `api/engine/indicators.py` (Pandas/NumPy logic for RSI, EMA, etc).
→ Edit `api/engine/writers_zone.py` (For Option Greeks and Max Pain logic).

### When you need to change the n8n WORKFLOW:
→ Open the node `🧠 Call Python AI Engine` (HTTP Request node).
→ All logic happens at `http://localhost:8000/api/predict`.

---

## 4. Maintenance & Operations

### Starting the Engine
1. Open terminal in `api/` folder.
2. Run `./start_server.bat`.
3. Check health: `http://localhost:8000/health`.

### Training the Model (After 4 Weeks)
1. Export the new Google Sheet as a CSV.
2. Run `python scripts/train_model.py`.
3. Restart server. Mode will switch from `RULES_FALLBACK` to `AI_ENSEMBLE`.

---

## 5. Rules — Things to NEVER Break

### Signal Reliability
- ❌ **NEVER** edit the JavaScript nodes in n8n for signals. They are now just "Messengers".
- ❌ **NEVER** bypass the `FORCE_RULES` safety lock if the market is trending unusually.
- ✅ **ALWAYS** maintain the 09:15–15:30 IST market window filter in `rule_engine.py`.
- ✅ **ALWAYS** check that `finalSignal` is either "BUY CALL (CE)", "BUY PUT (PE)", or "WAIT".

### Data Formatting
- ✅ Keep `api/engine/models.py` updated with any new sheet columns.
- ✅ Ensure headers in Google Sheets exactly match the keys in the Python `SignalResponse` model.

---

## 6. Key Parameters (v4.0 Snapshot)

| Parameter | Value | Description |
|---|---|---|
| AI Confidence Floor | `60.0%` | Predicted Buy signals below this are blocked. |
| Rule Threshold | `±25` | Min points required for Rule-based Buy signals. |
| Max VIX (Avoid) | `25.0` | Total system shutoff at this level. |
| Feature Count | `57` | Total unique numbers fed to the AI model. |
| GEX Flip | `Strike` | Level where market maker positioning flips. |

---
*Version 4.0.0 | Signal Engine: Python AI | Last Updated: 09 March 2026*
