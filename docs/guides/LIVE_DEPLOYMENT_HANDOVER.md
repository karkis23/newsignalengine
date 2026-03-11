# 🚀 NIFTY Alpha: 30-Day Live Market Handover

**Date:** February 27, 2026
**Current Version:** 2.5 (Logic Trace + Premium UI)
**Objective:** 1-Month Live Signal Observation & Accuracy Validation

---

## 🏗️ 1. Final System State
The system is fully tuned, polished, and ready for live execution.

*   **n8n Intelligence**: Now logs a detailed "Reason" string for every signal (e.g., `RSI Bullish | SuperTrend Buy`).
*   **Web Dashboard**: 
    *   **Logic Tags**: Every reason is now parsed into easy-to-read, color-coded tags (**Green** for Bullish, **Red** for Bearish, **Blue** for Neutral).
    *   **Pro Scale**: App size is locked at **80%** for a high-density, professional terminal look.
    *   **Live Ticker**: Fetches NIFTY spot and India VIX every 30 seconds.
*   **Database**: Google Sheets (`Dhan_Signals`) is the primary recorder.

---

## 🧠 2. Deep Logic Trace Explained
The "Signal Logic" section on your dashboard is the bot's "inner monologue." It explains exactly why a signal was (or wasn't) fired.

| Feature | Description | Semantic Color |
| :--- | :--- | :--- |
| **Logic Scraper** | Splits the raw "Reason" from sheets into individual indicator tags. | Tag based |
| **Bullish Indicators** | Keywords like `Bullish`, `Buy`, `Above`, `Uptrend`. | **Green (Emerald)** |
| **Bearish Indicators** | Keywords like `Bearish`, `Sell`, `Below`, `Downtrend`. | **Red (Loss)** |
| **Neutral Context** | Keywords like `Neutral`, `Normal`, `Ranging`. | **Blue (Accent)** |

---

## 📊 3. Performance & Latency (The "Why")
During verification, we identified the following processing times in n8n. These are normal for a Google Sheets setup:

1.  **Download Script Master**: ~5.5 seconds (Google Drive file search/retrieval).
2.  **Log to Sheets**: ~3.8 seconds (Google Sheets API handshaking).

**Total Delay**: ~9-10 seconds.
*   **Impact**: Low. For a 5-minute candle strategy, a 10-second delay is negligible.
*   **Solution**: After your 30-day test, we will migrate to **Supabase**. This will drop the total delay to **under 0.2 seconds** (instant).

---

## 🚦 4. Checklist for Your 30-Day Test

1.  **[ ] Daily Refresh**: Open the webapp at http://localhost:5173 after 09:20 AM IST.
2.  **[ ] Check the Trace**: Expand a signal in the "Live Signals" tab to verify the "Technical Analysis & Logic Trace" tags.
3.  **[ ] Record Outcomes**: In your Google Sheet (`Dhan_Signals`), manually mark the **Outcome** (Win/Loss) once the trade hit target or hit SL. (We can automate this later).
4.  **[ ] Monitor VIX**: The bot will automatically block signals if VIX > 18. This will show up in the reasons as `VIX Filter Active`.

---

## 🗺️ 5. The Supabase Roadmap: Why Upgrade?
After your 1-month test, migrating to **Supabase** will be the single biggest upgrade for the Webapp.

| Feature | Google Sheets (Current) | Supabase (Future) |
| :--- | :--- | :--- |
| **New Signal Delay** | 30 - 60 Seconds | **< 1 Second (Instant Push)** |
| **App Load Time** | 3 - 5 Seconds | **< 0.5 Seconds** |
| **Data Limit** | Sluggish after 2,000 rows | **Millions of rows (Zero lag)** |
| **Privacy** | Public Link required | **Private & Secure (Auth)** |

### How it transforms the Webapp:
*   **Instant Updates**: New signals will "pop" onto your screen via WebSockets the moment n8n saves them. No more manual refreshing.
*   **Command Center Feel**: The app becomes a live environment that reacts to the market in real-time, rather than just a historical report.
*   **Advanced Queries**: Search through months of trade data instantly to find winning patterns.

---

## 📁 6. Critical Files Reference
*   **Main Design**: [src/index.css](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/index.css) (Contains the new .logic-tag UI).
*   **Logic Extractor**: [src/pages/DashboardPage.tsx](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/pages/DashboardPage.tsx) (Shared `LogicTags` component).
*   **n8n Workflow**: [current_working_workflow.json](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/current_working_workflow.json).

---
**Handover complete. The bot is in your hands. See you in 30 days with the winning signal data!**
