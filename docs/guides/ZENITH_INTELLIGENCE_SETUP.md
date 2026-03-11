# 🚀 ZENITH: Intelligence Hub Setup & Operational Guide

> **Version:** 1.3 | **Date:** 11 March 2026
> **Purpose:** Comprehensive guide for initializing and monitoring the Zenith Intelligence microservice and connecting it to the Operational Matrix (n8n).

---

## 1. Intelligence Hub Architecture
The Zenith Intelligence Hub is a high-performance Python-based microservice that offloads complex market vector calculations and probabilistic analysis from the core execution pipelines.

### Prerequisites
- Python 3.12 (Recommended)
- Operational Matrix (n8n instance)
- Access to Dhan HQ and Angel One APIs

---

## 2. Infrastructure Initialization

### Step 2.1 — Isolated Environment Setup
Navigate to the `api/` directory in your terminal:
```powershell
cd "api"
```

Create and activate the professional virtual environment:
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Step 2.2 — Dependency Installation
```powershell
pip install -r requirements.txt
```
This initializes the core analytical stack: **FastAPI** (Network), **Pandas** (Processing), and **XGBoost** (Inference).

---

## 3. Launching the Microservice

### Step 3.1 — Manual Command
```powershell
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

### Step 3.2 — Professional Auto-Launch (Recommended)
Use the included `start_server.bat` for daily operations. This script automatically handles environment activation and server initialization.

---

## 4. Operational Matrix Integration (n8n)
To connect the Intelligence Hub to your live terminal, follow these mapping standards within your n8n workflows.

### The Analysis Node
Replace legacy indicator nodes with a single **HTTP Request** node named `🧠 Zenith Analysis`.

**Configuration:**
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/predict`
- **Body Content Type:** `JSON`

### Data Vector Mapping
The Hub expects the following professional market vectors:

| Parameter | Source Expression |
|---|---|
| `spotLTP` | `={{ $('NIFTY Spot').json.data[0].price }}` |
| `vix` | `={{ $('INDIA VIX').json.data[0].price }}` |
| `atmStrike` | `={{ $('Option Chain').json.atmStrike }}` |
| `optionChainRaw` | `={{ $('Option Chain').json.data }}` |

---

## 5. Professional Market Logs
The Intelligence Hub returns a high-fidelity data packet. Map these fields to your **Persistent Ledger (Google Sheets)** for auditability.

| Endpoint Field | Ledger Column | Rationale |
|---|---|---|
| `finalSignal` | **Direction** | Final buy/sell signal. |
| `confidence` | **Confidence Score** | Probabilistic strength (0-100%). |
| `regime` | **Market State** | Trend identification (Bullish/Sideways). |
| `ai_insights` | **Logic Trace** | Human-readable reasoning triggers. |
| `processingTimeMs` | **Latency** | Speed of analysis in milliseconds. |

---

## 6. Daily Deployment Protocol

### Pre-Market (9:00 AM)
1. Double-click `start_server.bat`.
2. Verify "Engine Ready" status in the **Zenith Terminal Interface**.
3. Perform a health check via `http://localhost:8000`.

### Market Hours (9:15 AM - 3:30 PM)
1. Monitor the **Signal Audit** page for real-time verification of Intelligence Hub outputs.
2. Use the **Terminal Header** to toggle polling if market conditions become erratic.

### Post-Market (3:30 PM)
1. Review the **Trade Ledger** for realized performance.
2. Terminate the Intelligence Hub process and export the session audit logs.

---
*Zenith Intelligence Protocol | "Empowering Decision Quality through Automated Analysis."*
