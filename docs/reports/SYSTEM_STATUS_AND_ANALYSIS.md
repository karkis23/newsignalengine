# 📊 NIFTY Alpha: System Status & Analysis
**Last Updated:** 07 March 2026
**Status:** ✅ v3.0 DEPLOYED (Complete Engine Rebuild — Live Market Testing Phase)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     n8n WORKFLOW ENGINE                         │
│                                                                 │
│  [Every 5 min during market hours]                              │
│                                                                 │
│  TradingView ──► NIFTY Spot (LTP)  ──┐                         │
│  NSE OC API  ──► Option Chain Req1 ──┤                         │
│  Parse CSV   ──► Parse master Copy1 ─┤                         │
│                                       ▼                         │
│              NIFTY Option Chain Builder1                        │
│              (ATM strike, CE/PE top 10, Dhan LTP)              │
│                       │                                         │
│              ┌────────┴────────┐                                │
│              ▼                 ▼                                 │
│   Writers Zone Analysis1   Calculate All Technical Indicators1  │
│   (v2.0: PCR, OI, MaxPain) (v2.0: RSI,MACD,EMA,SuperTrend...) │
│              └────────┬────────┘                                │
│                       ▼                                         │
│              Signal Code1 (NIFTY Signal Engine v3.0)           │
│              Score → BUY CE / BUY PE / WAIT / SIDEWAYS         │
│                       │                                         │
│         ┌─────────────┴──────────────┐                          │
│         ▼                            ▼                          │
│   Log Signal to Sheets4       Dhan Order Placement              │
│   (Dhan_Signals sheet)        (via Prepare Dhan Order1)         │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ (Google Sheets CSV, public read)
┌─────────────────────────────────────────────────────────────────┐
│                    NIFTY ALPHA WEBAPP                           │
│                    (React + Vite, localhost:5173)               │
│                                                                 │
│  Dashboard     → KPI cards, equity curve, recent signal log    │
│  Live Signals  → Full signal feed with CE/PE/AVOID filters     │
│  Active Trades → Open positions (Dhan_Active_Trades sheet)     │
│  History       → Closed trades (Dhan_Trade_Summary sheet)      │
│  Performance   → Analytics and win rate charts                 │
│  Accuracy      → Signal vs outcome validation                  │
│  Backtest      → Historical analysis                           │
│  Settings      → Paper/Live toggle, thresholds                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Google Sheets Structure

**Sheet ID:** `1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU`

| Sheet Name | GID | Purpose | Status |
|---|---|---|---|
| `Dhan_Signals` | `0` | Every 5-min signal log | ✅ Receiving data |
| `Dhan_Active_Trades` | `773018112` | Open positions | ⏳ Empty (paper mode) |
| `Dhan_Trade_Summary` | `2086062684` | Closed trade history | ⏳ Empty (paper mode) |

### Dhan_Signals columns (exact, verified from real CSV):
```
Timestamp | Signal | Confidence | rawSignal | ADX | Regime |
blockedReason | streakCount | MACDFlip | SuperTrend | RSI |
MACD | Momentum | Volume Ratio | VIX | Sentiment |
Writers Zone | Candle Pattern | Spot Price | Market Strength |
Put Call Premium Ratio | Writers Confidence | ATM Strike
```

**Timestamp format from sheet:** `"26/2/2026, 6:39:48 pm"` — requires custom parser (fixed in sheetsApi.ts)

---

## 3. Signal Engine CONFIG Reference

**File:** `signal_code_v2.js` (n8n node: Signal Code1)

```javascript
CONFIG = {
  BUY_CE_MIN_CONFIDENCE: 25,    // Score >= 25 → BUY CE
  BUY_PE_MIN_CONFIDENCE: -25,   // Score <= -25 → BUY PE
  ADX_TREND_THRESHOLD: 20,      // Below 20 = sideways, skip
  RSI_OVERSOLD: 35,
  RSI_OVERBOUGHT: 65,
  WRITERS_WEIGHT: 20,
  REPEAT_PROTECTION: true,
  MIN_STREAK: 1,                // 1 = fire on first confirmed bar (live)
  PAPER_TRADING: true,          // ← Set false for live orders
}
```

### Indicator weights:
| Indicator | Max Weight |
|---|---|
| MACD Histogram Flip | ±20 |
| SuperTrend | ±15 |
| RSI extreme | ±15 |
| EMA20 | ±10 |
| EMA+SMA dual confirm | ±10 |
| MACD growing | ±10 |
| BB Breakout | ±10 |
| VWAP, Aroon, Stoch, PSAR | ±8 each |
| ADX boost (>25) | ±8 |
| Candle alignment | ±8 |
| CCI, MFI, Volume | ±5 each |
| Writers Zone | dynamic (PCR-based) |

---

## 4. Expiry Logic

**NIFTY weekly expiry: Thursday → Tuesday (since 1 Sep 2025)**

NSE 2026 Tuesday holidays (shifts to Monday):
- `2026-03-03` → `2026-03-02` (Holi)
- `2026-03-31` → `2026-03-30` (Mahavir Jayanti)
- `2026-04-14` → `2026-04-13` (Ambedkar Day)
- `2026-10-20` → `2026-10-19` (Dussehra)
- `2026-11-10` → `2026-11-09` (Diwali)
- `2026-11-24` → `2026-11-23` (Guru Nanak)

---

## 5. Fixes Applied — 26 Feb 2026

| Fix | Node/File | Problem | Solution |
|---|---|---|---|
| Expiry day wrong | Option Chain Builder1 | Computing Thursday expiry | Switched to Tuesday + holiday map |
| Writers Zone all zeros | Writers Zone Analysis1 | Wrong source node + field name | Read `Option Chain Request1`, use `oc[strike].ce.last_price` |
| Signal always WAIT | Signal Code1 | `global` resets every n8n run | Use `$getWorkflowStaticData('global')` |
| "Invalid Date" webapp | sheetsApi.ts | `"26/2/2026, 6:39:48 pm"` unparseable | Custom `parseSheetTimestamp()` regex |
| CSV columns shifted | sheetsApi.ts | `split(',')` broke on quoted dates | Quote-aware `parseCSVLine()` |
| Spot price = 0 | sheetsApi.ts | Code used `LTP` — sheet has `Spot Price` | Matched exact column names |
| Market data stuck | sheetsApi.ts | TradingView CORS blocked in browser | Falls back silently to sheet spot price |

---

## 6. Live Testing Plan — 1 Month

### Goal
Observe real intraday signal behavior during NSE market hours (09:15–15:30 IST) across 4+ weeks to build calibration dataset.

### During Testing
- Keep `PAPER_TRADING: true` — no real orders
- Run n8n every market day
- Signals log automatically to `Dhan_Signals` every 5 minutes
- Track VIX range and market type daily
- Note major events: RBI, expiry weeks, budget, FII/DII data

### Track Manually (or add a separate column in sheet)
- Was signal direction correct in next 15–30 minutes?
- NIFTY price 15 min after signal vs signal price
- Same-day context: trending day? event day? expiry day?

---

## 7. My Assessment — Strengths

✅ **Multi-indicator confirmation** — 15+ indicators reduce noise vs single-indicator systems

✅ **Regime-aware** — ADX + price action gate blocks signals in sideways markets (the #1 cause of options losses)

✅ **VIX hard stop** — High VIX = premium explosion; stopping at 18 protects capital

✅ **Writers Zone / PCR** — Institutional positioning is a real edge most retail bots don't use

✅ **Score-based conviction** — Not binary; confidence 30 vs 80 will enable position sizing later

✅ **Full observability** — Every signal logged with all indicators, enabling proper post-analysis

✅ **Streak + repeat protection** — Avoids whipsaw overtrading

✅ **Clean data pipeline** — n8n → Sheets → Webapp all verified working end-to-end

---

## 8. Blind Spots & Risks

### 🔴 Critical

| Risk | Detail | Mitigation |
|---|---|---|
| **Theta decay** | A correct directional signal still loses if premium decays faster than price moves. This affects OTM options most. | Prefer ATM or slight ITM; add delta/premium threshold before entry |
| **Execution delay** | Signal fires at 5-min candle close → n8n processes → Dhan API order → fill. Total: 1–3 minutes. Price may have moved. | Log fill price vs signal price to measure slippage |
| **No time-in-trade exit** | No rule for "exit if signal flips" or "exit after 30 min". Without time exits, losing trades held too long. | Add max-hold-time rule: exit any trade after 45 minutes regardless |
| **Gap-up/gap-down opens** | 9:15 opens with overnight gaps trigger immediate signals based on stale data from previous close | Add 15-minute no-trade buffer after open (09:15–09:30) |

### 🟡 Medium Risk

| Risk | Detail |
|---|---|
| **OC data freshness** | If NSE option chain data is delayed, PCR and Writers Zone are wrong. No validation on data age. |
| **Dhan API timeouts** | Market open + expiry days cause heavy load. LTP fetch can timeout silently (returns 0). |
| **Static data restart** | If n8n restarts mid-session, `$getWorkflowStaticData` clears → streak resets to 0. First signal of day missed. |
| **5-min lag** | Signal fires on close of 5-min candle; if workflow runs 30s late, price already moved into next candle. |
| **ATM rounding** | Nearest 50 works for NIFTY 22000-28000. If NIFTY crosses 30000, may need 100-point rounding. |

### 🟢 Watch During Testing

| Observation | What to Check |
|---|---|
| **Expiry week (Mon-Tue)** | Options decay fast; signals may be accurate but still lose money on premium collapse |
| **Lunch hour (12:00–13:00)** | Low volume, wide spreads, signals less reliable |
| **Pre-close (15:00–15:30)** | Forced covering creates erratic price action |
| **Back-to-back opposite signals** | CE→WAIT→PE in 10 min = whipsaw. Need minimum gap rule. |
| **Sideways days** | Even with ADX gate, some days slip through. Track Regime=SIDEWAYS_WEAK_TREND outcomes. |

---

## 9. What to Tune After 1 Month

### Threshold Questions
```
1. Average confidence on WINNING signals?
   → If avg = 55, raise BUY_CE_MIN_CONFIDENCE to 40-45

2. Win rate when ADX < 20 vs ADX 20-25 vs ADX > 25?
   → If ADX 20-25 win rate < 50%, raise threshold to 25

3. Win rate during VIX 15-18?
   → If marginal, lower VIX stop from 18 to 16

4. Win rate by hour of day?
   → If 09:15-09:30 < 40% win rate, add no-trade morning buffer
   → If 15:00-15:30 < 40% win rate, add no-new-entry after 14:30

5. Win rate by Regime?
   → STRONG_BULLISH/BEARISH should be highest
   → If MIXED has < 45% win rate, block it
```

### Indicator Culling
```
- Which indicators most often scored LOSING signals?
  → Reduce weight or remove them

- Which single indicator had highest correlation with wins?
  → Consider making it a mandatory gate
```

### Future: Position Sizing by Confidence
```
Confidence 25–40  → 0.5x lot
Confidence 40–60  → 1.0x lot
Confidence 60+    → 1.5x lot
```

---

## 10. Post-Test Analysis Queries (Run on Dhan_Signals sheet)

```
1.  Win rate by hour  =  COUNTIFS(hour(Timestamp)=H, outcome="WIN") / COUNTIF(hour=H)
2.  Win rate by Regime
3.  Win rate by Confidence bucket: 25-35, 35-50, 50-75, 75+
4.  Win rate by Writers Zone: BULLISH vs NEUTRAL vs BEARISH
5.  Win rate when ADX > 25 vs 20-25 vs < 20
6.  Signal distribution: CE / PE / WAIT / SIDEWAYS (what % of time each fires)
7.  Days with most signals (likely false positives on choppy days)
8.  VIX distribution at signal time
9.  MACD flip signal win rate (highest-weight indicator)
10. SuperTrend direction alignment with signal outcome
```

---

## 11. Project File Map

```
project/
├── src/
│   ├── services/sheetsApi.ts          ← Google Sheets data layer (all 3 sheets)
│   ├── hooks/useTrading.ts            ← Polling hook (30s market / 3min off)
│   ├── pages/
│   │   ├── DashboardPage.tsx          ← KPI + equity curve + signal log
│   │   ├── SignalsPage.tsx            ← Full signal feed with filters
│   │   ├── TradesPage.tsx             ← Active positions
│   │   ├── HistoryPage.tsx            ← Closed trade history + stats
│   │   ├── AnalyticsPage.tsx          ← Performance charts
│   │   ├── ValidationPage.tsx         ← Signal accuracy tracking
│   │   ├── BacktestPage.tsx           ← Backtesting
│   │   └── SettingsPage.tsx           ← Config
│   └── types.ts
│
├── signal_code_v2.js                  ← Signal Engine v2.1 (paste into n8n)
├── prepare_dhan_order_v2.js           ← Order preparation node
├── fixed_nodes/                       ← All corrected n8n node scripts
├── current_working_workflow.json      ← Full n8n workflow export
├── exit_order_monitor.json            ← Exit monitor sub-workflow
└── SYSTEM_STATUS_AND_ANALYSIS.md     ← THIS FILE
```

---

## 12. Go-Live Checklist (After 1-Month Test)

- [ ] Export Dhan_Signals, add outcome column, run analysis queries
- [ ] Tune CONFIG thresholds based on data
- [ ] Add time-of-day filters (09:15-09:30 buffer, 14:30 cutoff)
- [ ] Add max-hold-time exit rule (45 min)
- [ ] Add position sizing by confidence score
- [ ] Fix Dhan LTP API to POST format (for real-time LTP in Builder)
- [ ] Test order placement end-to-end with 1 lot
- [ ] Set `PAPER_TRADING: false` in Signal Code1
- [ ] Set real SL/Target values in order prep node
- [ ] Monitor first week of live trading closely

---

*Last updated: 26 Feb 2026, 21:42 IST*
*System: n8n + Dhan + Google Sheets + Webapp — All Systems Online*
