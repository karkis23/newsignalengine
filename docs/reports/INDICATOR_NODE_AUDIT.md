# 🔬 Indicator & Writers Zone Node — Audit Report

**Date:** 07 March 2026  
**Nodes Audited:**
1. `Calculate All Technical Indicators1`
2. `Writers Zone Analysis1`

---

## Node 1: Calculate All Technical Indicators1

### Summary: 8 Issues Found

| Severity | Count |
|---|---|
| 🔴 Critical (produces wrong values) | 2 |
| 🟡 Important (reduces accuracy) | 3 |
| 🟢 Minor (cosmetic/edge case) | 3 |

---

### 🔴 IND-1: SuperTrend Uses STATIC ATR (Root Cause of "Stuck on Bullish")

**THIS is the root cause of the SuperTrend bug identified in the Master Audit.**

```javascript
function calculateSuperTrend(highs, lows, closes, period = 10, multiplier = 3) {
  const atr = calculateATR(highs, lows, closes, period);  // ← returns a SINGLE number
  // ...
  for (let i = 0; i < closes.length; i++) {
    const hl2 = (highs[i] + lows[i]) / 2;
    const upperBand = hl2 + (multiplier * atr);  // ← atr is an OBJECT {value: "xx.xx"}
    const lowerBand = hl2 - (multiplier * atr);  // ← multiplying number × Object = NaN!
```

**Two bugs here:**
1. `calculateATR()` returns `{ value: "xx.xx" }` (an object with a string). Multiplying `multiplier * atr` gives `NaN`.
2. Even if `atr` was a number, it's a **single ATR value** computed once. Real SuperTrend needs a **rolling ATR per bar**.

With `upperBand = NaN` and `lowerBand = NaN`, the trend comparison `closes[i] > finalUpperBand` will always be `false`, and `closes[i] < finalLowerBand` will also be `false`. So the trend **never changes** from its initial value of `"Bullish"`.

**This is why SuperTrend was stuck on "Bullish" for 4 straight days.**

**Fix:** Compute rolling ATR per bar and use the numeric value:

```javascript
function calculateSuperTrend(highs, lows, closes, period = 10, multiplier = 3) {
  if (closes.length < period + 1) return { status: "Neutral" };

  // Calculate True Range array
  const trs = [highs[0] - lows[0]]; // first TR = high - low
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }

  // Rolling ATR using Wilder's smoothing
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const atrArr = new Array(period).fill(atr);
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    atrArr.push(atr);
  }

  // SuperTrend calculation
  let finalUpperBand = 0, finalLowerBand = 0;
  let trend = "Bullish";

  for (let i = 0; i < closes.length; i++) {
    const hl2 = (highs[i] + lows[i]) / 2;
    const currentATR = atrArr[Math.min(i, atrArr.length - 1)];
    const upperBand = hl2 + (multiplier * currentATR);
    const lowerBand = hl2 - (multiplier * currentATR);

    if (i === 0) {
      finalUpperBand = upperBand;
      finalLowerBand = lowerBand;
    } else {
      finalUpperBand = (upperBand < finalUpperBand || closes[i - 1] > finalUpperBand) 
                         ? upperBand : finalUpperBand;
      finalLowerBand = (lowerBand > finalLowerBand || closes[i - 1] < finalLowerBand) 
                         ? lowerBand : finalLowerBand;

      if (closes[i] > finalUpperBand) trend = "Bullish";
      else if (closes[i] < finalLowerBand) trend = "Bearish";
    }
  }

  return { status: trend };
}
```

---

### 🔴 IND-2: MACD Signal Line Is Meaningless

```javascript
const signal = ema(new Array(9).fill(macd), 9);
```

**Problem:** This creates an array `[macd, macd, macd, macd, macd, macd, macd, macd, macd]` and computes its EMA. The EMA of an array of identical values = that same value. So `signal === macd` always, meaning `histogram = macd - signal = 0` always.

**This means:** The MACD histogram is always 0 (or nearly 0) — the MACD flip detection in the signal code never triggers from actual MACD data. It only triggers because `prevMACDHist` was a different value from a previous bar.

**Fix:** Compute a proper signal line from a series of MACD values:

```javascript
function calculateMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0, status: "Neutral" };

  const emaCalc = (data, p) => {
    const k = 2 / (p + 1);
    let e = data.slice(0, p).reduce((s, v) => s + v, 0) / p;
    const result = new Array(p).fill(e);
    for (let i = p; i < data.length; i++) {
      e = data[i] * k + e * (1 - k);
      result.push(e);
    }
    return result;
  };

  const ema12 = emaCalc(prices, 12);
  const ema26 = emaCalc(prices, 26);

  // MACD line = EMA12 - EMA26 (only from index 25 onwards where both are valid)
  const macdLine = [];
  for (let i = 25; i < prices.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  // Signal line = 9-period EMA of MACD line
  const signalLine = emaCalc(macdLine, 9);

  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const histogram = lastMACD - lastSignal;

  const status = lastMACD > lastSignal ? "Bullish" : lastMACD < lastSignal ? "Bearish" : "Neutral";

  return {
    macd: lastMACD.toFixed(2),
    signal: lastSignal.toFixed(2),
    histogram: histogram.toFixed(2),
    status
  };
}
```

---

### 🟡 IND-3: VWAP Uses Multi-Day Data (Not Daily Reset)

```javascript
function calculateVWAP(ohlc, volume) {
  let cumulativePV = 0, cumulativeVol = 0;
  for (let i = 0; i < ohlc.length; i++) {
    // Iterates over ALL candles (3 days of data)
```

**Problem:** The candle data comes from `Get 5Min Candles1` which fetches 3 days of history. VWAP is an **intraday** indicator — it should reset at market open each day. Using 3-day cumulative data produces a VWAP that's essentially a 3-day average price, which is meaningless for intraday trading.

**This explains why VWAP always showed "Below" — the 3-day VWAP was naturally higher than the current LTP after a multi-day decline.**

**Fix:** Filter candles to today only before computing VWAP:

```javascript
function calculateVWAP(ohlc, volume) {
  // Filter to today's candles only (VWAP is intraday)
  const today = new Date().toISOString().split('T')[0];
  let cumulativePV = 0, cumulativeVol = 0;
  for (let i = 0; i < ohlc.length; i++) {
    const timestamp = ohlc[i][0]; // First element is timestamp
    if (timestamp && !timestamp.startsWith(today)) continue; // Skip non-today candles
    
    const high = parseFloat(ohlc[i][2]);
    const low = parseFloat(ohlc[i][3]);
    const close = parseFloat(ohlc[i][4]);
    const vol = volume[i] || 0;
    if (isNaN(high) || isNaN(low) || isNaN(close) || vol === 0) continue;
    
    const typicalPrice = (high + low + close) / 3;
    cumulativePV += typicalPrice * vol;
    cumulativeVol += vol;
  }
  if (cumulativeVol === 0) return { value: 0, status: "Neutral" };
  const vwap = cumulativePV / cumulativeVol;
  const status = ltp > vwap ? "Above" : "Below";
  return { value: vwap.toFixed(2), status };
}
```

---

### 🟡 IND-4: RSI Uses Simple Average, Not Wilder's Smoothing

```javascript
let gains = 0, losses = 0;
for (let i = prices.length - period - 1; i < prices.length - 1; i++) {
  const change = prices[i + 1] - prices[i];
  if (change >= 0) gains += change;
  else losses -= change;
}
const avgGain = gains / period;
const avgLoss = losses / period;
```

**Problem:** Standard RSI uses Wilder's smoothing (exponential), not a simple average. The simple average makes RSI less responsive and more "sticky" — it stays in overbought/oversold zones longer than it should.

**Fix:** Use Wilder's running average:

```javascript
function calculateRSI(prices, period = 14) {
  if (prices.length <= period + 1) return { rsi: 50, status: "Neutral" };
  
  // Initial average using simple mean
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Wilder's smoothing for remaining bars
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  const rs = avgGain / (avgLoss || 0.001);
  const rsi = 100 - (100 / (1 + rs));
  const status = rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral";
  return { rsi: rsi.toFixed(2), status };
}
```

---

### 🟡 IND-5: MFI Uses First 14 Bars, Not Most Recent 14

```javascript
for (let i = 1; i < period + 1; i++) {
  // Iterates bars 1 through 14 — ALWAYS the first 14 bars of data
```

**Problem:** MFI is calculated on bars 1–14 regardless of how many bars exist. With 3 days of data (~180 bars), the MFI reflects Monday morning's money flow, not the current session.

**Fix:** Use the last `period` bars:

```javascript
function calculateMFI(highs, lows, closes, volumes, period = 14) {
  if (highs.length < period + 1) return { value: 50, status: "Neutral" };
  const start = highs.length - period - 1;
  const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
  let positive = 0, negative = 0;
  for (let i = start + 1; i < highs.length; i++) {
    const mf = typicalPrices[i] * volumes[i];
    if (typicalPrices[i] > typicalPrices[i - 1]) positive += mf;
    else if (typicalPrices[i] < typicalPrices[i - 1]) negative += mf;
  }
  const ratio = positive / (negative || 1);
  const mfi = 100 - (100 / (1 + ratio));
  const status = mfi > 80 ? "Overbought" : mfi < 20 ? "Oversold" : "Neutral";
  return { value: mfi.toFixed(2), status };
}
```

---

### 🟢 IND-6: ADX Returns Single DX, Not Smoothed ADX

The ADX calculation computes a single DX (Directional Index) value, not a smoothed ADX. True ADX is the 14-period smoothed average of DX values. This can make ADX more volatile than expected.

### 🟢 IND-7: Candle Data Includes Multiple Days

The candle pattern detection uses the last 3 candles, which could span across days (e.g., yesterday's close and today's open). This could produce false patterns at the session boundary.

### 🟢 IND-8: No Error Handling for Empty Candle Data

If the Angel One candle API returns empty `data`, all arrays will be empty and most functions will return 0 or "Insufficient Data" — but no explicit error is logged.

---

## Node 2: Writers Zone Analysis1

### Summary: 4 Issues Found

| Severity | Count |
|---|---|
| 🔴 Critical | 1 |
| 🟡 Important | 2 |
| 🟢 Minor | 1 |

---

### 🔴 WZ-1: Premium PCR Interpretation Is Inverted

```javascript
if (putCallPremiumRatio > 1.15) {
  analysis.marketStructure = 'PUT_PREMIUM_HIGH';
  // → Sets zone to BEARISH
}
```

**Problem:** High Put-Call Premium Ratio (PCR > 1.15) means **more PUT premium** is being paid. In Indian options markets, this typically means:
- **Writers are selling PUTs** → they expect the market WON'T fall → **BULLISH**
- OR: **Buyers are buying PUTs for protection** → hedging → could be either way

The code interprets high PCR as BEARISH, but in practice, high PCR (especially OI-based) is typically **bullish** for NIFTY because it indicates heavy put writing as support.

The OI-based PCR section gets this right:
```javascript
if (putCallOIRatio > 1.3) {
  // → "heavy PE writing (bullish for market)" ← CORRECT
}
```

But the premium PCR section treats it as bearish — this creates a **contradiction** within the same analysis.

**Fix:** Align both interpretations. High premium PCR with high OI PCR = strong support = BULLISH.

---

### 🟡 WZ-2: ATM Skew Interpretation May Be Inverted

```javascript
const skew = atmCE.ltp / atmPE.ltp;
if (skew > 1.15) { /* "CE costlier (bullish)" */ }
```

**Problem:** If CE premium > PE premium at ATM:
- This means demand for calls is higher → people are BUYING calls → expects up move
- The code calls this "bullish" — **this is actually correct**
- BUT: if this is due to market makers pricing in a move, the CE premium being expensive could also mean **the upside is already priced in**

This is a nuanced point. The current interpretation is defensible but could be made more sophisticated by comparing IV differential instead of raw LTP.

---

### 🟡 WZ-3: OC Data Format Assumes NSE API Structure

```javascript
const ocData = $('Option Chain Request1').first().json?.data || {};
const spotPrice = parseFloat(ocData.last_price) || 0;
const ocMap = ocData.oc || {};
```

The code expects `data.last_price` and `data.oc["strike"].ce/.pe` — this is the **NSE API** format. But the `Option Chain Request1` node calls the **Dhan API** (`api.dhan.co/v2/optionchain`). If Dhan returns a different structure, the Writers Zone silently produces NEUTRAL with 0 confidence for all fields.

**Check:** Verify the actual Dhan API response format matches `.data.oc["strike"].ce/.pe`.

---

### 🟢 WZ-4: Max Pain Not Calculated

The Writers Zone has OI data for all strikes but doesn't compute Max Pain (the strike price where total option premium loss for buyers is maximized). Near expiry, NIFTY tends to gravitate toward max pain — this is a valuable signal for the signal engine.

---

## Priority Recommendation

| # | Fix | Impact | Time |
|---|---|---|---|
| **IND-1** | SuperTrend ATR bug | 🔴 CRITICAL — root cause of stuck indicator | 15 min |
| **IND-2** | MACD signal line | 🔴 CRITICAL — histogram always ~0 | 15 min |
| **IND-3** | VWAP daily reset | 🟡 HIGH — root cause of always "Below" | 10 min |
| **WZ-1** | PCR interpretation | 🔴 CRITICAL — direction could be inverted | 10 min |
| **IND-4** | RSI Wilder's smoothing | 🟡 MEDIUM — more responsive RSI | 10 min |
| **IND-5** | MFI recent bars | 🟡 MEDIUM — correct data window | 5 min |
| **WZ-3** | Verify Dhan API format | 🟡 MEDIUM — may be silently broken | 10 min |
| **IND-6** | ADX smoothing | 🟢 LOW — more stable ADX | 15 min |
| **IND-7** | Today-only candles | 🟢 LOW — cleaner patterns | 10 min |
| **IND-8** | Error handling | 🟢 LOW — defensive coding | 5 min |
| **WZ-2** | ATM skew nuance | 🟢 LOW — current is defensible | N/A |
| **WZ-4** | Max Pain calc | 🟢 LOW — nice to have | 30 min |
