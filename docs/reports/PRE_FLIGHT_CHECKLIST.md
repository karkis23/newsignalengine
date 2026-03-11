# ✈️ Pre-Flight Checklist — Before Live Market Testing

**Date:** 07 March 2026  
**System:** NIFTY Signal Engine v3.0

---

## 🔴 CRITICAL CHECKS (Must fix before deploy)

### CHECK-1: ⚠️ VIX Filter Node Still Has Hard Cutoff!

**Node:** `VIX Filter Condition (< 18)1` (position 1856)

The n8n workflow has a **separate VIX filter node** BEFORE the signal code that blocks the entire pipeline when VIX ≥ 18. Even though the signal code v3.0 now has graduated VIX scaling, **the workflow itself will never let data through to the signal code if VIX ≥ 18**.

Looking at the workflow connections:
```
VIX Filter Condition (< 18)1 → both true AND false → Getsheet
```

**Status:** ✅ Both true and false branches connect to `Getsheet`. So the VIX filter node currently PASSES data regardless. This is fine — the signal code handles VIX internally.

**Verdict:** No change needed. But verify this in n8n UI before going live.

---

### CHECK-2: ⚠️ Angel One Timestamp Format for VWAP

The VWAP fix filters candles by today's date using:
```javascript
const todayStr = new Date().toISOString().split('T')[0]; // "2026-03-07"
// Then: if (timestamp && !timestamp.startsWith(todayStr)) continue;
```

Angel One's candle data returns timestamps in the format:
```
"2026-03-07T09:15:00+05:30"
```

Since `"2026-03-07T09:15:00+05:30".startsWith("2026-03-07")` → `true` ✅

**Verdict:** ✅ Compatible. No change needed.

BUT — Important edge case: `new Date().toISOString()` returns UTC time. At 12:00 AM IST (which is 6:30 PM UTC previous day), `todayStr` would be **yesterday's date in UTC** while the candle timestamps are in IST.

**However:** This code only runs during market hours (09:15–15:30 IST), which is 03:45–10:00 UTC. By that time, `new Date().toISOString()` correctly gives today's date. ✅

**Verdict:** ✅ Safe during market hours. No change needed.

---

### CHECK-3: Field Name Compatibility Matrix

**Signal Code v3.0 reads FROM Calculate Technical Indicators:**

| v3.0 expects | v2.0 outputs | Match? |
|---|---|---|
| `tech.ADX.value` | `ADX.value` | ✅ |
| `tech.RSI.rsi` | `RSI.rsi` | ✅ |
| `tech.VIX.vix` | `VIX.vix` | ✅ |
| `tech.MACD.histogram` | `MACD.histogram` | ✅ |
| `tech.MACD.macd` | `MACD.macd` | ✅ |
| `tech.MACD.signal` | `MACD.signal` | ✅ |
| `tech.EMA20.status` | `EMA20.status` | ✅ |
| `tech.SMA50.status` | `SMA50.status` | ✅ |
| `tech.Stochastic.status` | `Stochastic.status` | ✅ |
| `tech.Stochastic.value` | `Stochastic.value` | ✅ |
| `tech.VWAP.status` | `VWAP.status` | ✅ |
| `tech.VWAP.value` | `VWAP.value` | ✅ |
| `tech.SuperTrend.status` | `SuperTrend.status` | ✅ |
| `tech.Aroon.status` | `Aroon.status` | ✅ |
| `tech.ParabolicSAR.status` | `ParabolicSAR.status` | ✅ |
| `tech.CCI.status` | `CCI.status` | ✅ |
| `tech.CCI.value` | `CCI.value` | ✅ |
| `tech.MFI.status` | `MFI.status` | ✅ |
| `tech.PriceAction.type` | `PriceAction.type` | ✅ |
| `tech.VolumeStrength.type` | `VolumeStrength.type` | ✅ |
| `tech.BollingerBands.status` | `BollingerBands.status` | ✅ |
| `tech.BollingerBands.upper` | `BollingerBands.upper` | ✅ |
| `tech.BollingerBands.lower` | `BollingerBands.lower` | ✅ |
| `tech.LTP` | `LTP` | ✅ |
| `tech.CandlePatterns` | `CandlePatterns` | ✅ |
| `tech.VolumeSpike.latestVol` | `VolumeSpike.latestVol` | ✅ |
| `tech.VolumeSpike.avgVol` | `VolumeSpike.avgVol` | ✅ |

**Signal Code v3.0 reads FROM Writers Zone:**

| v3.0 expects | v2.0 outputs | Match? |
|---|---|---|
| `writers.writersZone` | `writersZone` | ✅ |
| `writers.confidence` | `confidence` | ✅ |
| `writers.putCallPremiumRatio` | `putCallPremiumRatio` | ✅ |
| `writers.putCallOIRatio` | `putCallOIRatio` | ✅ |
| `writers.supportLevels` | `supportLevels` | ✅ |
| `writers.resistanceLevels` | `resistanceLevels` | ✅ |

**Verdict:** ✅ All 32 field names are 100% compatible.

---

### CHECK-4: Google Sheets Log Node Column Mapping

**Current columns logged:**

| Sheet Column | Expression | v3.0 Compatible? |
|---|---|---|
| Timestamp | `new Date().toLocaleString(...)` | ✅ |
| Signal | `$json.finalSignal` | ✅ |
| Confidence | `$json.confidence` | ✅ |
| RSI | `tech.RSI.rsi` | ✅ |
| MACD | `tech.MACD.macd` | ✅ (now has real values!) |
| Writers Zone | `writers.writersZone` | ✅ |
| Spot Price | `tech.LTP` | ✅ |
| ATM Strike | `builder.atmStrike` | ✅ |
| Writers Confidence | `writers.confidence` | ✅ |
| Put Call Premium Ratio | `writers.putCallPremiumRatio` | ✅ |
| Candle Pattern | `tech.CandlePatterns[0]` | ✅ |
| Volume Ratio | `$json.VolumeRatio` | ✅ |
| rawSignal | `signal.rawSignal` | ✅ |
| SuperTrend | `signal.SuperTrend` | ✅ |
| ADX | `signal.ADX` | ✅ |
| Regime | `signal.regime` | ✅ |
| MACDFlip | `signal.MACDFlip` | ✅ |
| Reason | `$json.reason` | ✅ |
| Momentum | `$json.Momentum` | ✅ |
| VIX | `$json.VIX` | ✅ |
| engineVersion | `$json.engineVersion` | ✅ (will show "v3.0") |
| SessionDate | `$json.sessionDate` | ✅ |
| LastSignal | `$json.lastSignal` | ✅ |
| LastFireTime | `$json.lastFireTime` | ✅ |
| BlockedReason | `$json.blockedReason` | ✅ |
| StreakCount | `$json.streakCount` | ✅ |

**Verdict:** ✅ All 26 columns are backward-compatible. No sheet changes needed.

**New fields in v3.0 output (not currently logged):**
- `SuperTrendValidated` (boolean)
- `debugFlags` (array)
- `orbRange` (object)
- `vixMultiplier` (number)
- `combinedMultiplier` (number)
- `consecutiveWaits` (number)
- `putCallOIRatio` (number)

These won't break anything — they're just not logged to sheets yet. Can be added later.

---

## 🟡 IMPORTANT CHECKS

### CHECK-5: Writers Zone Return Format

The old Writers Zone used `return { ... }` (single object), not `return [{ json: { ... } }]` (n8n array).

The new v2.0 also uses `return { ... }`.

**Verified:** In n8n Code Node v2, `return { ... }` is valid — n8n wraps it automatically. ✅

---

### CHECK-6: Writing Order Matters

The signal code v3.0 references `$node["Calculate All Technical Indicators1"]` and `$node["Writers Zone Analysis1"]` by name. These node NAMES must match exactly in the n8n workflow.

**Current names in workflow:** 
- `Calculate All Technical Indicators1` ✅
- `Writers Zone Analysis1` ✅
- `signal Code1` ✅

**Verdict:** ✅ Names match perfectly.

---

### CHECK-7: MACD Expression Bug in Sheets Log

Line 419 of the log node:
```
"MACD": "= {{ $('Calculate All Technical Indicators1').item.json.MACD.macd }}"
```

Note the `= ` before `{{` — this is technically an n8n expression error (the `=` should be `=` prefix only, the space + double `{{ }}` is unusual). It was working before because MACD was always ~0 anyway.

With the fixed MACD, verify this column actually populates in the sheet after first execution.

---

## ✅ DEPLOYMENT ORDER

1. **Step 1:** Paste `calculate_technical_indicators_v2.js` into `Calculate All Technical Indicators1` node
2. **Step 2:** Save workflow → Run ONE manual execution → Check output of this node for valid data
3. **Step 3:** Paste `writers_zone_analysis_v2.js` into `Writers Zone Analysis1` node
4. **Step 4:** Save → Run ONE manual execution → Verify writers output
5. **Step 5:** Paste `signal_code_v3.0.js` into `signal Code1` node
6. **Step 6:** Save → Run ONE manual execution → Check full pipeline + sheet log
7. **Step 7:** If all good → Activate workflow for live trading

---

## 📋 First-Run Verification Checklist

After first manual execution, verify in the execution output:

- [ ] `SuperTrend.status` is NOT stuck on "Bullish" (should match actual trend)
- [ ] `MACD.histogram` is NOT 0 or near-0 (should show actual divergence)
- [ ] `VWAP.status` reflects actual LTP position (not always "Below")
- [ ] `RSI.rsi` value looks reasonable for current market
- [ ] `engineVersion` shows "v3.0" in the signal output
- [ ] `indicatorVersion` shows "v2.0" in the indicator output
- [ ] `analysisVersion` shows "v2.0" in the writers output
- [ ] Google Sheet row was logged with all columns populated
- [ ] `MACD` column in sheet shows actual non-zero value
- [ ] No errors in n8n execution log
