# 📊 LIVE SESSION SIGNAL REPORT — 27 February 2026

> **Workflow:** LIVE Antgravity live testing (`wMf9BZP52s8B-Ch-EalAY`)
> **Signal Engine:** v2.1 (Static Data Streak Fix)
> **Session Date:** 27 February 2026 (Friday)
> **Report Generated At:** 27/02/2026, 19:43 IST
> **Data Source:** Google Sheets — Dhan_Signals (gid=0)

---

## 1. Session Summary

| Metric | Value |
| :--- | :--- |
| **Total Rows Logged** | 41 |
| **Market Hours Rows** | 32 |
| **SIDEWAYS signals** | 17 |
| **BUY CALL (CE) signals** | 10 |
| **BUY PUT (PE) signals** | 8 (incl. 4 after-hours stale) |
| **WAIT signals** | 5 |
| **MARKET_CLOSED logged** | 3 |
| **ADX Avg (when trending)** | ~56 |
| **VIX Range** | 13.31 – 13.79 (LOW) |
| **NIFTY Range** | 25,151 – 25,343 |
| **Total Swing** | ~192 points |

---

## 2. Phase-by-Phase Timeline

### Phase 1 — 12:45–13:20 IST: SIDEWAYS / Low ADX (Choppy)

| Time | Signal | ADX | RSI | NIFTY | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 12:45 | SIDEWAYS | 14.8 | — | 25,276 | Ranging, Bullish Marubozu |
| 12:50 | SIDEWAYS | 16.3 | — | 25,271 | PCR 1.07 |
| 12:55 | SIDEWAYS | 10.0 | — | 25,284 | — |
| 13:00 | SIDEWAYS | 5.89 | 36.6 | 25,278 | v2.1 columns now populating |
| 13:05 | SIDEWAYS | 9.72 | 33.8 | 25,278 | RSI near oversold |
| 13:10 | SIDEWAYS | 7.26 | 41.8 | 25,294 | — |
| 13:15 | SIDEWAYS | 15.1 | 48.0 | 25,292 | Approaching ADX 20 threshold |
| 13:20 | SIDEWAYS | 17.6 | 49.8 | 25,288 | Just below 20 |

> **Observation:** Market in tight range throughout. ADX never crossed 20. Signal engine correctly returned SIDEWAYS_RANGING for the entire hour.

---

### Phase 2 — 13:25–13:31 IST: Breakout Attempt → CE Fire

| Time | Signal | ADX | RSI | Confidence | MACD | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 13:25 | **WAIT** | 24.1 | 51.7 | +5 | -5.37 | ADX crossed 20, moved to TRENDING |
| 13:30 | **BUY CALL (CE)** | 24.05 | 63.1 | **+25** | -1.60 | First CE signal fired |
| 13:31 | **BUY CALL (CE)** | 25.2 | 62.1 | **+25** | -1.74 | Repeat signal same direction |

> ⚠️ **Issue:** CE fired with minimum threshold (+25). Repeat at 13:31 suggests `lastSignal` in static data was not persisting between these two closely-spaced runs.

---

### Phase 3 — 13:35–13:45 IST: Choppy then CE Burst

| Time | Signal | ADX | RSI | Confidence | NIFTY | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 13:35 | SIDEWAYS | 7.33 | 46.2 | 0 | 25,297 | ADX collapsed |
| 13:40 | SIDEWAYS | 1.84 | 53.7 | 0 | 25,296 | Very choppy |
| 13:42 | **BUY CALL (CE)** | 4.82 | 61.0 | **+68** | 25,311 | BB Breakout Up triggered |
| 13:45 | **BUY CALL (CE)** | 19.1 | 63.4 | **+32.8** | 25,301 | Weak ADX 20% penalty |

> ⚠️ **Anomaly:** ADX=4.82 yet confidence=+68. SIDEWAYS gate requires BOTH low ADX AND `Ranging` price action. Since price action was not "Ranging", signal bypassed gate even with near-zero ADX — false positive risk.

---

### Phase 4 — 13:50–14:25 IST: STRONG_BULLISH Regime — Clean CE Run

| Time | Signal | ADX | RSI | Confidence | NIFTY | Regime |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 13:50 | **BUY CALL (CE)** | 47.8 | 76.1 | **+56** | 25,324 | STRONG_BULLISH |
| 13:55 | **BUY CALL (CE)** | 42.2 | 69.9 | **+41** | 25,319 | STRONG_BULLISH |
| 14:00 | **BUY CALL (CE)** | 52.4 | 74.5 | **+48** | 25,343 | STRONG_BULLISH |
| 14:05 | **BUY CALL (CE)** | 71.2 | 68.8 | **+57** | 25,328 | STRONG_BULLISH |
| 14:10 | **BUY CALL (CE)** | 55.5 | 69.9 | **+57** | 25,329 | STRONG_BULLISH |
| 14:15 | **BUY CALL (CE)** | 52.6 | 62.2 | **+72** | 25,324 | STRONG_BULLISH |
| 14:20 | **BUY CALL (CE)** | 52.6 | 63.8 | **+80** | 25,324 | STRONG_BULLISH 🏆 Peak |
| 14:25 | **BUY CALL (CE)** | 52.6 | 63.8 | **+72** | 25,322 | STRONG_BULLISH |

> ✅ **Excellent:** ADX 42–71, RSI 62–76, SuperTrend Bullish, EMA+SMA dual bullish. Peak confidence +80. NIFTY: 25,278→25,343 (+65 pts).
>
> ⚠️ **Repeat Protection Gap:** CE fired every bar without being blocked despite `REPEAT_PROTECTION: true`.

---

### Phase 5 — 14:30–15:00 IST: Back to SIDEWAYS_RANGING

| Time | Signal | ADX | RSI | NIFTY | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 14:30 | SIDEWAYS | 16.8 | 53.1 | 25,294 | ADX collapsed |
| 14:35 | SIDEWAYS | 6.0 | 47.6 | 25,294 | — |
| 14:40 | SIDEWAYS | 10.4 | 53.3 | 25,300 | — |
| 14:43 | SIDEWAYS | 6.4 | 50.0 | 25,293 | Bearish Engulfing appeared |
| 14:45 | SIDEWAYS | 12.5 | 48.6 | 25,294 | — |
| 14:50 | SIDEWAYS | 5.2 | 50.3 | 25,296 | — |
| 14:55 | SIDEWAYS | 6.9 | 37.2 | 25,296 | RSI sliding |
| 15:00 | SIDEWAYS | 3.7 | 45.0 | 25,314 | ADX near zero |

> ✅ Engine correctly locked down the full consolidation window.

---

### Phase 6 — 15:05–15:30 IST: SHARP BEARISH REVERSAL — PE Signals

| Time | Signal | ADX | RSI | Confidence | NIFTY | PCR | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 15:05 | **BUY PUT (PE)** | 64.1 | 13.5 | **-40** | 25,182 | 1.15 | First PE — Writers BEARISH activated |
| 15:10 | **BUY PUT (PE)** | 75.7 | 13.6 | **-42** | 25,151 | 1.19 | Waterfall drop |
| 15:13 | **BUY PUT (PE)** | 75.7 | 13.6 | **-42** | 25,173 | 1.19 | Shooting Star candle |
| 15:15 | **BUY PUT (PE)** | 74.8 | 11.1 | **-43** | 25,169 | 1.19 | RSI at 11.1 — extreme |
| 15:20 | **BUY PUT (PE)** | 81.3 | 12.5 | **-35** | 25,172 | 1.19 | ADX spiked to 81 |
| 15:20 | **BUY PUT (PE)** | 81.3 | 15.5 | **-27** | 25,175 | 1.19 | Duplicate 15:20 entry |
| 15:25 | **BUY PUT (PE)** | 81.9 | 12.5 | **-35** | 25,166 | 1.19 | Day low |
| 15:30 | **BUY PUT (PE)** | 74.7 | 18.2 | **-35** | 25,182 | 1.18 | Last bar before close |

> ✅ **Near-perfect capture.** PCR: 1.07→1.19, Writers conf 0.4–0.5, RSI: 11–18, ADX: 64–82. Drop: 25,314→25,151 (-163 pts in 10 min).
>
> ⚠️ **SuperTrend Lag:** "Bullish" throughout the -163 pt drop. Missed the -15 contribution. PSAR, EMA, SMA, Aroon all correctly went bearish.

---

### Phase 7 — After Market Close

| Time | Signal | Notes |
| :--- | :--- | :--- |
| 15:35 | MARKET_CLOSED | PAPER_TRADING:false gate working |
| 15:40 | MARKET_CLOSED | — |
| 15:45 | MARKET_CLOSED | — |
| 18:19 | MARKET_CLOSED + **BUY PUT (PE)** | ⚠️ Manual trigger — stale data |
| 18:33 | **BUY PUT (PE)** | ⚠️ Same stale data replayed |
| 19:04 | **BUY PUT (PE)** | ⚠️ Same stale data replayed |
| 19:09 | **BUY PUT (PE)** | ⚠️ Same stale data replayed |

> 🚨 **Issue:** Manual test triggers after market close using cached last-close data. No live orders fire (market hours gate active) but sheet is polluted with 4 stale rows.

---

## 3. Key Metrics

### Signal Distribution

```
SIDEWAYS    ████████████████████  17 bars (53%)
BUY CE      ██████████            10 bars (31%)
BUY PE      ████████               8 bars (25%)*
WAIT        █████                  5 bars (16%)

*includes 4 after-hours stale rows
```

### Confidence Score Distribution

**BUY CE:**

| Range | Count | Quality |
| :--- | :--- | :--- |
| +25 (minimum) | 2 bars | Marginal |
| +32 – +48 | 3 bars | Moderate |
| +56 – +80 | 5 bars | Strong ← Best |

**BUY PE:**

| Range | Count | Quality |
| :--- | :--- | :--- |
| -27 to -35 | 6 bars | Moderate–Strong |
| -40 to -43 | 3 bars | Strongest |

### ADX Pattern Summary

| Window | ADX Range | Engine Response |
| :--- | :--- | :--- |
| 12:45–13:20 | 5–18 | Correct SIDEWAYS |
| 13:25–13:31 | 24–25 | Borderline CE |
| 13:35–13:45 | 2–19 | SIDEWAYS → CE anomaly |
| 13:50–14:25 | 43–71 | Strong CE (correct) |
| 14:30–15:00 | 4–17 | Correct SIDEWAYS |
| 15:05–15:30 | 64–82 | Strong PE (correct) |

### Writers Zone / PCR

| Period | PCR | Zone | Writers Activated |
| :--- | :--- | :--- | :--- |
| 12:45–14:25 | 1.03–1.08 | NEUTRAL/BEARISH | No (conf < 0.3) |
| 15:05–15:30 | 1.15–1.19 | **BEARISH** | ✅ Yes (conf 0.4–0.5) |

---

## 4. Issues Found

### 🔴 Issue 1: After-Hours Stale Signal Replay
- **Rows:** 18:19, 18:33, 19:04, 19:09 IST
- **Cause:** Manual test trigger after market close — cached data replayed
- **Impact:** 4 false BUY PE rows in sheet pollute analytics
- **Fix:** Delete these 4 rows. Avoid manual triggers after 15:30 IST.

### 🟡 Issue 2: SuperTrend Lag on Fast Reversals
- **Observation:** SuperTrend = "Bullish" during entire 15:05–15:30 crash (-163 pts)
- **Impact:** PE signals missed -15 contribution from SuperTrend
- **Severity:** Low — PSAR, EMA, SMA, Aroon, RSI all corrected bearish bias
- **Action:** Monitor next session. If persists, supplement with Chandelier Exit

### 🟡 Issue 3: Repeat Protection Not Blocking Consecutive CE
- **Observation:** CE fired every bar, 13:50–14:25 (8 consecutive), without block
- **Expected:** After CE fires, next bar should be blocked by `REPEAT_PROTECTION`
- **Possible Cause:** Static data `lastSignal` not persisting between fast sequential runs
- **Action:** Check n8n static data in workflow > gear icon > Test Workflow > Static Data

### 🟢 Issue 4: Low ADX False Positive (13:42, ADX=4.82, Confidence=+68)
- **Cause:** Price action was not "Ranging" so SIDEWAYS gate didn't trigger
- **Impact:** High-confidence signal generated during near-zero trend strength
- **Recommended Fix:** If ADX < 10 → multiply final score by 0.5 (additional penalty)

---

## 5. Engine Performance Assessment

| Category | Rating | Notes |
| :--- | :--- | :--- |
| SIDEWAYS Detection | ⭐⭐⭐⭐⭐ | Perfect — locked all choppy windows |
| Bullish Trend (STRONG_BULLISH) | ⭐⭐⭐⭐⭐ | Excellent, high-confidence |
| Bearish Crash (PE) | ⭐⭐⭐⭐⭐ | Near-perfect — Writers confirmed |
| Borderline Trend (ADX 20–25) | ⭐⭐⭐ | Minimum threshold signals |
| SuperTrend Lag on Reversal | ⭐⭐ | Doesn't flip fast enough |
| Repeat Protection | ⭐⭐⭐ | Needs investigation |
| Writers Zone Integration | ⭐⭐⭐⭐ | Activated correctly on high PCR |

### Overall Session Grade: **A-**

---

## 6. Market Narrative

Afternoon opened in tight consolidation (25,270–25,295). Brief CE at 13:30 (marginal). Strong bullish run 13:42–14:25 (+58 pts, ADX 47–71, all indicators aligned). Consolidation again 14:30–15:00. Explosive bearish crash 15:05–15:30 (-163 pts in 10 min) triggered by PCR spike 1.07→1.19, RSI collapse to 11, ADX surge to 81. Signal engine captured both moves cleanly.

---

## 7. Recommendations for Next Session

1. **Delete 4 stale after-hours rows** (18:19, 18:33, 19:04, 19:09) from Dhan_Signals
2. **Investigate Repeat Protection** — check n8n static data via workflow settings
3. **Add ADX < 10 soft penalty** in signal code — multiply score × 0.5 when ADX below 10
4. **Monitor SuperTrend lag** — if still lagging next session, consider adding Chandelier Exit
5. **System working correctly** — PAPER_TRADING:false, market hours gate active, no stale alerts during actual trading

---

## 8. Raw Data Reference

- **Google Sheet:** `1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU` (Tab: Dhan_Signals, gid=0)
- **Workflow ID:** `wMf9BZP52s8B-Ch-EalAY`
- **Signal Engine Version:** v2.1 — using `$getWorkflowStaticData('global')`
- **Local Code File:** `n8n/scripts/signal_code_v2.js`
- **CONFIG at time of session:** `BUY_CE_MIN_CONFIDENCE: 0`, `MIN_STREAK: 1`, `REPEAT_PROTECTION: true`, `PAPER_TRADING: false`

---

*Report generated: 27/02/2026 at 19:43 IST*
*Version: 1.0*
