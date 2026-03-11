# n8n Workflow Update Checklist — After Signal Code v2

## Overview of Changes Required

After replacing the `signal Code` node with v2, you need to update **3 other nodes** 
in n8n to stay compatible. This file tells you exactly what to change in each.

---

## 1. `Prepare Dhan Order1` — REPLACE ENTIRE CODE

Copy the full code from: `prepare_dhan_order_v2.js`

**Why:** Old code had no handler for `SIDEWAYS` signal → would crash on undefined option.
New code cleanly handles WAIT / AVOID / SIDEWAYS by returning `{ status: "SKIPPED" }`.

---

## 2. ⚡ NEW: Add IF Node Between `Prepare Dhan Order1` and `Place Entry Order`

**CRITICAL MISSING NODE.** Without this, the workflow crashes when signal is WAIT/SIDEWAYS.

Add a new **IF node** after `Prepare Dhan Order1`:

```
Name: Skip If No Order
Type: IF
Condition: {{ $json.orderPlaced }} is true
  TRUE  → connect to Place Entry Order
  FALSE → connect to nothing (or a NoOp/Stop node)
```

This is the gate that prevents invalid orders from reaching the Dhan API.

---

## 3. `Log Signal to Sheets1` — UPDATE COLUMN MAPPINGS

In the Google Sheets node columns section, update/add these mappings:

| Column Name         | Expression |
|---------------------|------------|
| Timestamp           | `={{ $('Writers Zone Analysis').item.json.timestamp }}` |
| Signal              | `={{ $json.finalSignal }}` |
| Confidence          | `={{ $json.confidence }}` |
| RSI                 | `={{ $('Calculate All Technical Indicators').item.json.RSI.rsi }}` |
| MACD                | `={{ $('Calculate All Technical Indicators').item.json.MACD.macd }}` |
| VIX                 | `={{ $json.VIX }}` |
| Writers Zone        | `={{ $json.writersZone }}` |
| Spot Price          | `={{ $json.LTP }}` |
| ATM Strike          | `={{ $('NIFTY Option Chain Builder').item.json.atmStrike }}` |
| Writers Confidence  | `={{ $json.writersConfidence }}` |
| Put Call Premium Ratio | `={{ $json.putCallRatio }}` |
| Candle Pattern      | `={{ $('Calculate All Technical Indicators').item.json.CandlePatterns[0] }}` |
| **ADX** *(new)*     | `={{ $json.ADX }}` |
| **Regime** *(new)*  | `={{ $json.regime }}` |
| **Raw Signal** *(new)* | `={{ $json.rawSignal }}` |
| **Streak Count** *(new)* | `={{ $json.streakCount }}` |
| **MACD Flip** *(new)* | `={{ $json.MACDFlip }}` |
| **Blocked Reason** *(new)* | `={{ $json.blockedReason }}` |
| **SuperTrend** *(new)* | `={{ $json.SuperTrend }}` |

> ⚠️ You need to add columns ADX, Regime, Raw Signal, Streak Count, MACD Flip, Blocked Reason, SuperTrend to your Google Sheet first, then map them here.

---

## 4. Google Sheet — ADD NEW COLUMNS

In your `Dhan_Signals` sheet, add these columns after the existing ones:

```
Column Q: ADX
Column R: Regime  
Column S: Raw Signal
Column T: Streak Count
Column U: MACD Flip
Column V: Blocked Reason
Column W: SuperTrend
```

**Why these columns matter for analysis:**
- `Regime` tells you *why* a signal fired or was blocked
- `Raw Signal` shows what the algorithm *wanted* before streak/repeat filters
- `Streak Count` shows signal buildup (1 = first bar, 2 = confirmed fire)
- `MACD Flip` is the single most powerful signal — log it to backtest
- `Blocked Reason` is gold for debugging missed entries

---

## 5. VIX Filter — FIX THE BUG (Critical)

This is a **pre-existing bug** found in the workflow analysis.

In the `VIX Filter Condition (< 18)` node connections, the FALSE path also connects 
to `Download file`. This means VIX > 18 doesn't actually stop the workflow.

**Fix:**
1. Open `VIX Filter Condition (< 18)` connections
2. Delete the FALSE path connection to `Download file`
3. The FALSE path should go to nothing (workflow stops there)

The new signal code has VIX protection built in as a fallback, but the workflow-level
 filter is better performance-wise (avoids running all indicator nodes unnecessarily).

---

## Quick Verification Checklist

After making all changes, test by manually triggering the workflow:

- [ ] `signal Code` node — check that `streakCount`, `regime`, `rawSignal` appear in output
- [ ] `Prepare Dhan Order1` — when signal is WAIT, output should show `status: "SKIPPED"`  
- [ ] IF node (new) — WAIT/SKIPPED signals should NOT flow into `Place Entry Order`
- [ ] `Log Signal to Sheets1` — new columns should populate in Google Sheets
- [ ] VIX Filter — try setting manual VIX > 18 to verify workflow stops there

---

## Expected Behavior After Update

**Old behavior:** Signal fired every 5 minutes, flip-flopped CE/PE constantly

**New behavior:**
- Most bars → `WAIT` (score between -25 and +25)
- Sideways rangy market → `SIDEWAYS` (ADX < 20 + ranging)
- High VIX → `AVOID`
- Real trade → 2+ consecutive bars of strong signal needed
- When a trade fires, streak count will be ≥ 2 and score will be ≥ 25

**Expected trade frequency:** ~2-4 trades per day max vs the old behavior 
of signaling every few minutes.
