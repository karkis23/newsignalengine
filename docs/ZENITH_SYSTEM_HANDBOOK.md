# 🌌 ZENITH: System Handbook & Operational Standards

> **System Version:** 4.2.0
> **Design Standard:** Zenith Professional Midnight
> **Core Context:** Institutional Automated Market Analysis & Execution

---

## 1. The Zenith Vision
ZENITH is not just a trading bot; it is an **Advanced Trading Terminal**. It is designed to provide professional-grade visibility, high-fidelity market intelligence, and disciplined execution. The system replaces discretionary emotional trading with **probabilistic market vectors** and **automated risk management**.

### Core Philosophy: "Logic Over Impulse"
- **Visibility:** 1:1 transparency into every decision-making cycle.
*   **Precision:** Use of Python-based inference for multi-factor signal validation.
*   **Discipline:** Automated stop-loss, target management, and session-based profit capping.

---

## 2. Professional Terminal Interface
The interface has been redesigned to reflect a sophisticated, distraction-free environment for serious financial operations.

### Design Principles
*   **Midnight & Slate Palette:** Reduces eye strain during long market hours and emphasizes critical data points.
*   **Spatial Discipline:** Generous spacing and structured layouts to prevent information overload.
*   **Zenith Typography:** Inter for interface text, JetBrains Mono for financial data and pricing.
*   **Glassmorphic Hierarchy:** Using depth and blurs to create a clear visual stack of information.

### Operational Pages
1.  **Overview (Command Hub):** Real-time monitoring of session P&L, cumulative revenue, and strategy confidence.
2.  **Market Signals (Logic Feed):** A transparent view into the decision-making engine's live output.
3.  **Position Manager (Active Engagement):** Precise monitoring of capital currently exposed to market risk.
4.  **Trade Ledger (History):** An immutable record of settled trades for end-of-day audit.
5.  **Performance (Analytics):** Statistical breakdown of hit rates, profit factors, and equity curves.
6.  **Signal Audit (Validation):** Real-time verification of signal accuracy against live index movements.

---

## 3. Intelligence Architecture
The "brain" of ZENITH is isolated into a high-performance Python microservice to ensure that complex calculations never interfere with execution flows.

### End-to-End Decision Flow
1.  **Data Ingestion:** Operational Matrix (n8n) fetches raw market data (LTP, Greeks, IV Skew).
2.  **Vector Processing:** Python Inference Server engineers 57+ features (Momentum, RSI, SuperTrend, etc.).
3.  **Probabilistic Analysis:** The Intelligence Engine (XGBoost) calculates a confidence score for directionality.
4.  **Risk Scrutiny:** If confidence is high but risk metrics (Volatility, Regime) are unfavorable, the signal is **suppressed** (Logged as "AVOID").
5.  **Execution:** Validated signals are converted into orders via the Dhan HQ Gateway.

---

## 4. Normalization of Language
ZENITH uses standard professional financial terminology to ensure clarity for institutional-grade operations.

| Old Terminology | New Zenith Standard | Rationale |
|---|---|---|
| Command Center | Terminal Interface | Reflects the professional operational nature. |
| Engagement Ledger | Position Manager | Clearer focus on capital management. |
| Neural Insights | Market Logic / Vector | Removes "hype" terminology for objective analysis. |
| Signature | Direction / Signal | Standard trading nomenclature. |
| Success/Failure | Correct/Incorrect | Objective audit outcomes. |

---

## 5. Daily Operation Standards
1.  **Initialization:** Verify the Python Engine is "Online" via the Status Indicator in the Header.
2.  **Monitoring:** Use the **Overview** page for P&L tracking and the **Signal Audit** for execution accuracy.
3.  **Risk Overrides:** The "Pause" button in the header provides immediate suspension of all decision-making cycles.
4.  **Settlement:** Use the **Trade Ledger** at the end of each session to sync with broker records.

---
*Zenith Project Documentation | March 2026 | "Precision. Vision. Discipline."*
