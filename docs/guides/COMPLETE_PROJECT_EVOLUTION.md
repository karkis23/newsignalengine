# 🎯 NIFTY ALPHA: Project Evolution & Final Specification
**The High-Performance AI-Driven Trading Ecosystem**

---

## 1. Executive Summary
The **NIFTY ALPHA** project has evolved from a logic-heavy n8n automation into an institutional-grade **AI-Driven Microservice**. It leverages a four-tier architecture—**Python AI Backend**, **n8n Data Pipeline**, **Google Sheets Data Nexus**, and a **React Command Center**—to provide a non-custodial trading experience with deep Machine Learning insights and high-speed execution.

---

## 2. Integrated Architecture (v4.0 AI Edition)
The system functions as a high-speed data loop between local intelligence and cloud automation:

### A. The AI Brain (Python Microservice)
*   **Engine Core:** A FastAPI backend that hosts both an **XGBoost AI Ensemble** and a faithful **Rules-Based Fallback** (the ported v3.0 logic).
*   **Institutional Intelligence:** Processes 57 unique market features including **Gamma Exposure (GEX)**, **IV Skew**, and **Volume Profile (POC/VAH/VAL)**.
*   **Speed:** Signal generation and technical analysis happen in <50ms natively in Python.
*   **Safety:** Integrated `FORCE_RULES` kill-switch to bypass AI and lock to rules-logic during volatile market regimes.

### B. The Automation Pipeline (n8n Messenger)
*   **Messenger Role:** n8n has been offloaded from calculation duties. It now acts as a high-reliability data messenger between Angel One APIs and the Python AI.
*   **Parallel Strategy:** Supports dual-workflow execution (v3.0 Live + v4.0 Test) for risk-free validation of AI signals.
*   **Instrument Selection:** Automatically identifies At-The-Money (ATM) strikes based on live spot price.

### C. The Execution & Analytics Layer
*   **Bracket Orders:** Automatically places Entry, SL (12 pts), and Target (25 pts) orders via Dhan HQ API.
*   **Data Nexus:** Logs every single market feature to Google Sheets, creating a massive dataset for continuous AI training.
*   **React Command Center:** A dark-glassmorphism dashboard that visualizes real-time signals, AI confidence scores, and portfolio performance.

---

## 3. Sophistication & AI Refinements

### 💎 Institutional-Grade Data
We have moved beyond simple indicators. The bot now understands:
*   **Dealer Positioning:** Tracking where Market Makers are most "trapped" (GEX/Max Pain).
*   **Institutional Bias:** Analyzing if Puts are being over-priced due to fear (IV Skew).
*   **Market Structure:** Identifying the "Fair Value" of the day using Volume Profiles.

### 🚀 Parallel Validation
To handle the transition from Rules to AI, we implemented **Shadow Mode**:
*   The v4.0 engine runs alongside the live system.
*   It records signals and results but does not place real orders.
*   This allows the user to verify the AI's "Accuracy" against real market outcomes before giving it full capital control.

---

## 4. Feature Summary by Module

| Module | Key Features |
| :--- | :--- |
| **Python AI Engine** | 57 Features, XGBoost Inference, Rules Fallback, /health diagnostics. |
| **n8n Automation** | High-speed data polling, Dhan Order placement, G-Sheet logging. |
| **Command Center** | Live KPI Cards, AI Insight logs, Equity growth tracking. |
| **Training Pipeline** | SMOTE-balanced learning, Confusion Matrix validation, .pkl model export. |

---

## 5. Deployment Readiness

1.  **AI Backend:** Requires Python 3.12+ and environment variables (`FORCE_RULES`).
2.  **Logic:** Workflow `v4.0_AI_TEST.json` is the new standard for AI integration.
3.  **Data:** Requires the dedicated AI Dataset Sheet (`1NILZ2uOrbBMQ1sw...`).

---

## 6. Project Point of View (POV)
The **NIFTY ALPHA v4.0** is at a **Commercial Scaling Level.** It is no longer just a "bot"; it is a scalable trading infrastructure. By moving the "brain" to Python, we have removed all performance bottlenecks and opened the door to Deep Learning (LSTM) in future versions.

**Status:** ✅ **AI Brain Built** | ✅ **Single-Engine v4.0 Active** | ✅ **GEX Integration** | ✅ **30-Day Logging Phase Active** | ✅ **Logs Standardized**

---
*Last Updated: March 11, 2026 | Version 4.2.0*
