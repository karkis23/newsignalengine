// ============================================================
// CALCULATE ALL TECHNICAL INDICATORS v2.0 — ALL BUGS FIXED
// Date: 07 March 2026
//
// FIXES APPLIED:
//  IND-1: SuperTrend — rolling ATR per bar (was static NaN object)
//  IND-2: MACD — proper signal line from MACD series (was identity)
//  IND-3: VWAP — daily reset, today's candles only (was 3-day)
//  IND-4: RSI — Wilder's smoothing (was simple average)
//  IND-5: MFI — uses most recent N bars (was first N bars)
//  IND-6: ADX — proper Wilder's smoothed ADX (was single DX)
//  IND-7: Candle patterns — uses today's data only at boundaries
//  IND-8: Error handling for empty candle data
// ============================================================

// ✅ Extract OHLC from "Get 5Min Candles" node
const rawData = $node["Get 5Mins Candles1"].json.data || [];

// [IND-8] Guard against empty data
if (!rawData || rawData.length === 0) {
    return [{
        json: {
            LTP: 0, error: "No candle data from Angel One API",
            RSI: { rsi: 50, status: "No Data" },
            EMA20: { ema: 0, status: "Neutral" },
            SMA50: { sma: 0, status: "Neutral" },
            MACD: { macd: 0, signal: 0, histogram: 0, status: "Neutral" },
            VIX: { vix: 0, status: "No Data" },
            BollingerBands: { upper: 0, lower: 0, status: "Within Bands" },
            ATR: { value: 0 },
            ADX: { value: 0 },
            Stochastic: { value: 50, status: "Neutral" },
            VWAP: { value: 0, status: "Neutral" },
            CCI: { value: 0, status: "Neutral" },
            SuperTrend: { status: "Neutral" },
            VolumeIndicators: { obv: 0, status: "Weak" },
            Aroon: { up: 50, down: 50, status: "Neutral" },
            ParabolicSAR: { value: 0, status: "Neutral" },
            MFI: { value: 50, status: "Neutral" },
            CandlePatterns: ["No Data"],
            PriceAction: { score: 0, type: "No Data" },
            VolumeSpike: { spike: false, latestVol: 0, avgVol: 0 },
            VolumeStrength: { score: 0, type: "No Data" }
        }
    }];
}

const ohlcData = rawData.map(c => c);

// ✅ Extract LTP from "NIFTY spot LTP"
const ltp = parseFloat($('NIFTY Spot (LTP)1').first().json.data[0].d[0]) || 0;

// ✅ Extract VIX from "INDIA VIX"
const vix = parseFloat($('INDIA VIX Spot1').first().json.data[0].d[0]) || 0;

// ✅ Extract OHLC Arrays (all candles including multi-day)
const allTimestamps = ohlcData.map(c => c[0]);
const openPrices = ohlcData.map(c => parseFloat(c[1])).filter(v => !isNaN(v));
const highPrices = ohlcData.map(c => parseFloat(c[2])).filter(v => !isNaN(v));
const lowPrices = ohlcData.map(c => parseFloat(c[3])).filter(v => !isNaN(v));
const closePrices = ohlcData.map(c => parseFloat(c[4])).filter(v => !isNaN(v));
const volume = ohlcData.map(c => parseFloat(c[5])).filter(v => !isNaN(v));

// [IND-3/IND-7] Filter today's candles for intraday indicators
const todayStr = new Date().toISOString().split('T')[0];
const todayIndices = [];
ohlcData.forEach((c, i) => {
    if (c[0] && c[0].startsWith(todayStr)) todayIndices.push(i);
});

const todayOpen = todayIndices.map(i => parseFloat(ohlcData[i][1])).filter(v => !isNaN(v));
const todayHigh = todayIndices.map(i => parseFloat(ohlcData[i][2])).filter(v => !isNaN(v));
const todayLow = todayIndices.map(i => parseFloat(ohlcData[i][3])).filter(v => !isNaN(v));
const todayClose = todayIndices.map(i => parseFloat(ohlcData[i][4])).filter(v => !isNaN(v));
const todayVolume = todayIndices.map(i => parseFloat(ohlcData[i][5])).filter(v => !isNaN(v));

// === Indicator Functions ===

// [IND-4 FIX] RSI — Wilder's Smoothing
function calculateRSI(prices, period = 14) {
    if (prices.length <= period + 1) return { rsi: 50, status: "Insufficient Data" };

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

// EMA
function calculateEMA(prices, period = 20) {
    if (prices.length < period) return { ema: 0, status: "Neutral" };
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    const status = ltp > ema ? "Bullish" : "Bearish";
    return { ema: ema.toFixed(2), status };
}

// SMA
function calculateSMA(prices, period = 50) {
    if (prices.length < period) return { sma: 0, status: "Insufficient Data" };
    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const status = ltp > sma ? "Bullish" : "Bearish";
    return { sma: sma.toFixed(2), status };
}

// [IND-2 FIX] MACD — Proper signal line from MACD series
function calculateMACD(prices) {
    if (prices.length < 35) return { macd: 0, signal: 0, histogram: 0, status: "Neutral" };

    // Helper: compute full EMA series
    const emaCalc = (data, p) => {
        const k = 2 / (p + 1);
        let e = data.slice(0, p).reduce((s, v) => s + v, 0) / p;
        const result = [];
        for (let i = 0; i < p; i++) result.push(e); // Fill initial values
        for (let i = p; i < data.length; i++) {
            e = data[i] * k + e * (1 - k);
            result.push(e);
        }
        return result;
    };

    const ema12 = emaCalc(prices, 12);
    const ema26 = emaCalc(prices, 26);

    // MACD line = EMA12 - EMA26 (valid from index 25 onwards)
    const macdLine = [];
    const startIdx = 25;
    for (let i = startIdx; i < prices.length; i++) {
        macdLine.push(ema12[i] - ema26[i]);
    }

    if (macdLine.length < 9) {
        const lastMACD = macdLine[macdLine.length - 1] || 0;
        return { macd: lastMACD.toFixed(2), signal: "0.00", histogram: lastMACD.toFixed(2), status: lastMACD > 0 ? "Bullish" : "Bearish" };
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

// VIX
function interpretVIX(value) {
    let status = "Moderate";
    if (value > 20) status = "High Volatility";
    else if (value < 13) status = "Calm Market";
    return { vix: value.toFixed(2), status };
}

// Bollinger Bands
function calculateBollingerBands(prices, period = 20, multiplier = 2) {
    if (prices.length < period) return { upper: 0, lower: 0, status: "Insufficient Data" };
    const slice = prices.slice(-period);
    const sma = slice.reduce((sum, p) => sum + p, 0) / period;
    const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    const upper = sma + multiplier * stdDev;
    const lower = sma - multiplier * stdDev;
    const status = ltp > upper ? "Breakout Up" : ltp < lower ? "Breakout Down" : "Within Bands";
    return { upper: upper.toFixed(2), lower: lower.toFixed(2), middle: sma.toFixed(2), status };
}

// ATR — returns numeric value
function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < 2) return 0;
    const trs = [highs[0] - lows[0]];
    for (let i = 1; i < highs.length; i++) {
        trs.push(Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        ));
    }
    if (trs.length < period) {
        return trs.reduce((a, b) => a + b, 0) / trs.length;
    }
    // Wilder's smoothing
    let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trs.length; i++) {
        atr = (atr * (period - 1) + trs[i]) / period;
    }
    return atr;
}

// ATR wrapper for output (returns object for backward compatibility)
function calculateATROutput(highs, lows, closes, period = 14) {
    return { value: calculateATR(highs, lows, closes, period).toFixed(2) };
}

// [IND-6 FIX] ADX — Proper Wilder's smoothed ADX
function calculateADX(highs, lows, closes, period = 14) {
    if (highs.length <= period * 2) return { value: 0, plusDI: 0, minusDI: 0 };

    // Step 1: Calculate +DM, -DM, TR for each bar
    const plusDM = [], minusDM = [], tr = [];
    for (let i = 1; i < highs.length; i++) {
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];
        plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
        tr.push(Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        ));
    }

    // Step 2: Wilder's smoothed averages
    let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    const dxValues = [];
    for (let i = period; i < tr.length; i++) {
        smoothTR = smoothTR - (smoothTR / period) + tr[i];
        smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDM[i];
        smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDM[i];

        const pDI = smoothTR > 0 ? 100 * (smoothPlusDM / smoothTR) : 0;
        const mDI = smoothTR > 0 ? 100 * (smoothMinusDM / smoothTR) : 0;
        const diSum = pDI + mDI;
        const dx = diSum > 0 ? 100 * Math.abs(pDI - mDI) / diSum : 0;
        dxValues.push(dx);
    }

    // Step 3: ADX = Wilder's smoothed DX
    if (dxValues.length < period) {
        const avg = dxValues.reduce((a, b) => a + b, 0) / (dxValues.length || 1);
        return { value: avg.toFixed(2) };
    }

    let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dxValues.length; i++) {
        adx = (adx * (period - 1) + dxValues[i]) / period;
    }

    // Also return last +DI/-DI for potential future use
    const lastSmoothTR = smoothTR;
    const lastPDI = lastSmoothTR > 0 ? 100 * (smoothPlusDM / lastSmoothTR) : 0;
    const lastMDI = lastSmoothTR > 0 ? 100 * (smoothMinusDM / lastSmoothTR) : 0;

    return { value: adx.toFixed(2), plusDI: lastPDI.toFixed(2), minusDI: lastMDI.toFixed(2) };
}

// Stochastic
function calculateStochastic(highs, lows, closes, period = 14) {
    if (closes.length < period) return { value: 50, status: "Insufficient Data" };
    const recentHigh = Math.max(...highs.slice(-period));
    const recentLow = Math.min(...lows.slice(-period));
    const currentClose = closes[closes.length - 1];
    const range = recentHigh - recentLow;
    const percentK = range > 0 ? ((currentClose - recentLow) / range) * 100 : 50;
    const status = percentK > 80 ? "Overbought" : percentK < 20 ? "Oversold" : "Neutral";
    return { value: percentK.toFixed(2), status };
}

// [IND-3 FIX] VWAP — Uses today's candles only
function calculateVWAP(ohlcFull, volumeFull) {
    let cumulativePV = 0, cumulativeVol = 0;

    for (let i = 0; i < ohlcFull.length; i++) {
        const timestamp = ohlcFull[i][0];
        // Only use today's candles
        if (timestamp && !timestamp.startsWith(todayStr)) continue;

        const high = parseFloat(ohlcFull[i][2]);
        const low = parseFloat(ohlcFull[i][3]);
        const close = parseFloat(ohlcFull[i][4]);
        const vol = parseFloat(ohlcFull[i][5]) || 0;
        if (isNaN(high) || isNaN(low) || isNaN(close) || vol === 0) continue;

        const typicalPrice = (high + low + close) / 3;
        cumulativePV += typicalPrice * vol;
        cumulativeVol += vol;
    }

    if (cumulativeVol === 0) {
        // Fallback: if no today candles, use all data
        for (let i = 0; i < ohlcFull.length; i++) {
            const high = parseFloat(ohlcFull[i][2]);
            const low = parseFloat(ohlcFull[i][3]);
            const close = parseFloat(ohlcFull[i][4]);
            const vol = parseFloat(ohlcFull[i][5]) || 0;
            if (isNaN(high) || isNaN(low) || isNaN(close) || vol === 0) continue;
            const typicalPrice = (high + low + close) / 3;
            cumulativePV += typicalPrice * vol;
            cumulativeVol += vol;
        }
    }

    if (cumulativeVol === 0) return { value: 0, status: "Neutral" };
    const vwap = cumulativePV / cumulativeVol;
    const status = ltp > vwap ? "Above" : "Below";
    return { value: vwap.toFixed(2), status };
}

// CCI
function calculateCCI(highs, lows, closes, period = 20) {
    if (highs.length < period) return { value: 0, status: "Neutral" };
    const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    const recent = typicalPrices.slice(-period);
    const sma = recent.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = recent.reduce((sum, p) => sum + Math.abs(p - sma), 0) / period;
    if (meanDeviation === 0) return { value: 0, status: "Neutral" };
    const cci = (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
    const status = cci > 100 ? "Buy" : cci < -100 ? "Sell" : "Neutral";
    return { value: cci.toFixed(2), status };
}

// [IND-1 FIX] SuperTrend — Rolling ATR per bar
function calculateSuperTrend(highs, lows, closes, period = 10, multiplier = 3) {
    if (closes.length < period + 1) return { status: "Neutral" };

    // Step 1: Calculate True Range series
    const trs = [highs[0] - lows[0]];
    for (let i = 1; i < highs.length; i++) {
        trs.push(Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        ));
    }

    // Step 2: Rolling ATR using Wilder's smoothing
    let runningATR = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const atrArr = [];
    for (let i = 0; i < period; i++) atrArr.push(runningATR);
    for (let i = period; i < trs.length; i++) {
        runningATR = (runningATR * (period - 1) + trs[i]) / period;
        atrArr.push(runningATR);
    }

    // Step 3: SuperTrend calculation with per-bar ATR
    let finalUpperBand = 0, finalLowerBand = 0;
    let trend = "Bullish";
    let superTrendValue = 0;

    for (let i = 0; i < closes.length; i++) {
        const hl2 = (highs[i] + lows[i]) / 2;
        const currentATR = atrArr[Math.min(i, atrArr.length - 1)];
        const basicUpperBand = hl2 + (multiplier * currentATR);
        const basicLowerBand = hl2 - (multiplier * currentATR);

        if (i === 0) {
            finalUpperBand = basicUpperBand;
            finalLowerBand = basicLowerBand;
        } else {
            // Upper band: take the lower of current and previous (unless price broke above)
            finalUpperBand = (basicUpperBand < finalUpperBand || closes[i - 1] > finalUpperBand)
                ? basicUpperBand : finalUpperBand;
            // Lower band: take the higher of current and previous (unless price broke below)
            finalLowerBand = (basicLowerBand > finalLowerBand || closes[i - 1] < finalLowerBand)
                ? basicLowerBand : finalLowerBand;

            // Trend determination
            if (trend === "Bullish" && closes[i] < finalLowerBand) {
                trend = "Bearish";
            } else if (trend === "Bearish" && closes[i] > finalUpperBand) {
                trend = "Bullish";
            }
        }
        superTrendValue = trend === "Bullish" ? finalLowerBand : finalUpperBand;
    }

    return { status: trend, value: superTrendValue.toFixed(2) };
}

// OBV
function calculateOBV(closes, vol) {
    let obv = 0;
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) obv += vol[i];
        else if (closes[i] < closes[i - 1]) obv -= vol[i];
    }
    const status = obv > 0 ? "Strong Buy" : "Weak";
    return { obv, status };
}

// Aroon
function calculateAroon(highs, lows, period = 14) {
    if (highs.length < period) return { up: 50, down: 50, status: "Neutral" };
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const daysSinceHigh = period - 1 - recentHighs.indexOf(Math.max(...recentHighs));
    const daysSinceLow = period - 1 - recentLows.indexOf(Math.min(...recentLows));
    const aroonUp = ((period - daysSinceHigh) / period) * 100;
    const aroonDown = ((period - daysSinceLow) / period) * 100;
    const status = aroonUp > aroonDown ? "Uptrend" : "Downtrend";
    return { up: aroonUp.toFixed(2), down: aroonDown.toFixed(2), status };
}

// Parabolic SAR
function calculateParabolicSAR(highs, lows, step = 0.02, maxStep = 0.2) {
    if (highs.length < 2) return { value: 0, status: "Neutral" };
    let psar = lows[0], ep = highs[0], af = step, long = true;
    for (let i = 1; i < highs.length; i++) {
        psar = psar + af * (ep - psar);
        if (long) {
            if (highs[i] > ep) { ep = highs[i]; af = Math.min(af + step, maxStep); }
            if (lows[i] < psar) { long = false; psar = ep; ep = lows[i]; af = step; }
        } else {
            if (lows[i] < ep) { ep = lows[i]; af = Math.min(af + step, maxStep); }
            if (highs[i] > psar) { long = true; psar = ep; ep = highs[i]; af = step; }
        }
    }
    const status = ltp > psar ? "Bullish" : "Bearish";
    return { value: psar.toFixed(2), status };
}

// [IND-5 FIX] MFI — Uses most recent N bars
function calculateMFI(highs, lows, closes, volumes, period = 14) {
    if (highs.length < period + 1) return { value: 50, status: "Neutral" };

    const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    const start = Math.max(1, highs.length - period);
    let positive = 0, negative = 0;

    for (let i = start; i < highs.length; i++) {
        const mf = typicalPrices[i] * (volumes[i] || 0);
        if (typicalPrices[i] > typicalPrices[i - 1]) positive += mf;
        else if (typicalPrices[i] < typicalPrices[i - 1]) negative += mf;
    }

    const ratio = positive / (negative || 1);
    const mfi = 100 - (100 / (1 + ratio));
    const status = mfi > 80 ? "Overbought" : mfi < 20 ? "Oversold" : "Neutral";
    return { value: mfi.toFixed(2), status };
}

// Candlestick Pattern
function detectCandlestickPattern(open, high, low, close) {
    const patterns = [];
    const len = open.length;
    if (len < 3) return ["Insufficient Data"];
    const o = open[len - 1], h = high[len - 1], l = low[len - 1], c = close[len - 1];
    const o1 = open[len - 2], c1 = close[len - 2], o2 = open[len - 3], c2 = close[len - 3];
    const body = Math.abs(c - o);
    const range = h - l;
    if (range === 0) return ["No Clear Pattern"];
    const upper = h - Math.max(c, o);
    const lower = Math.min(c, o) - l;

    if (body <= range * 0.1) patterns.push("Doji");
    if (body <= range * 0.3 && lower > 2 * body && c > o) patterns.push("Hammer");
    if (body <= range * 0.3 && upper > 2 * body && c > o) patterns.push("Inverted Hammer");
    if (c1 < o1 && c > o && c >= o1 && o <= c1) patterns.push("Bullish Engulfing");
    if (c1 > o1 && c < o && o >= c1 && c <= o1) patterns.push("Bearish Engulfing");
    if ((c2 < o2) && (Math.abs(c1 - o1) < range * 0.05) && (c > o)) patterns.push("Morning Star");
    if ((c2 > o2) && (Math.abs(c1 - o1) < range * 0.05) && (c < o)) patterns.push("Evening Star");
    if (body <= range * 0.3 && upper > 2 * body && c < o) patterns.push("Shooting Star");
    if (body <= range * 0.3 && lower > 2 * body && c < o) patterns.push("Hanging Man");
    if (range > 0 && upper <= 0.05 * body && lower <= 0.05 * body && body > 0)
        patterns.push(c > o ? "Bullish Marubozu" : "Bearish Marubozu");
    return patterns.length ? patterns : ["No Clear Pattern"];
}

// === Price Action Analysis ===

function detectSwings(highs, lows, lookback = 3) {
    const swingHighs = [], swingLows = [];
    for (let i = lookback; i < highs.length - lookback; i++) {
        const isHigh = highs.slice(i - lookback, i).every(h => highs[i] > h) &&
            highs.slice(i + 1, i + 1 + lookback).every(h => highs[i] > h);
        const isLow = lows.slice(i - lookback, i).every(l => lows[i] < l) &&
            lows.slice(i + 1, i + 1 + lookback).every(l => lows[i] < l);
        if (isHigh) swingHighs.push({ index: i, value: highs[i] });
        if (isLow) swingLows.push({ index: i, value: lows[i] });
    }
    return { swingHighs, swingLows };
}

function getPriceActionScore(highs, lows, closes) {
    const { swingHighs, swingLows } = detectSwings(highs, lows);
    const recentHigh = swingHighs[swingHighs.length - 1]?.value || 0;
    const recentLow = swingLows[swingLows.length - 1]?.value || 0;
    const lastClose = closes[closes.length - 1];

    if (lastClose > recentHigh && recentHigh > 0) return { score: 2, type: "Breakout" };
    if (lastClose < recentLow && recentLow > 0) return { score: -2, type: "Breakdown" };

    const higherHighs = swingHighs.slice(-3).map(s => s.value);
    const higherLows = swingLows.slice(-3).map(s => s.value);
    if (higherHighs.length >= 2 && higherLows.length >= 2) {
        const isTrendingUp = higherHighs.every((v, i, a) => i === 0 || v > a[i - 1]) &&
            higherLows.every((v, i, a) => i === 0 || v > a[i - 1]);
        const isTrendingDown = higherHighs.every((v, i, a) => i === 0 || v < a[i - 1]) &&
            higherLows.every((v, i, a) => i === 0 || v < a[i - 1]);
        if (isTrendingUp) return { score: 1, type: "Trending" };
        if (isTrendingDown) return { score: -1, type: "Downtrend" };
    }

    return { score: 0, type: "Ranging" };
}

// === Volume Analysis ===

function detectVolumeSpike(volumes, multiplier = 1.5, period = 20) {
    if (volumes.length < period + 1) return { spike: false, latestVol: 0, avgVol: "0" };
    const recent = volumes.slice(-period - 1);
    const avgVol = recent.slice(0, -1).reduce((a, b) => a + b, 0) / period;
    const latestVol = recent[recent.length - 1];
    return { spike: latestVol > avgVol * multiplier, latestVol, avgVol: avgVol.toFixed(2) };
}

function getVolumeStrengthScore(volumes, closes) {
    const obvData = calculateOBV(closes, volumes);
    const spike = detectVolumeSpike(volumes);
    if (spike.spike && obvData.obv > 0) return { score: 1, type: "Spike + OBV Confirmed" };
    if (!spike.spike && obvData.obv > 0) return { score: 0, type: "Normal OBV" };
    return { score: -1, type: "Weak Volume" };
}

// === Run All Calculations ===
const PriceAction = getPriceActionScore(highPrices, lowPrices, closePrices);
const VolumeSpike = detectVolumeSpike(volume);
const VolumeStrength = getVolumeStrengthScore(volume, closePrices);
const SuperTrend = calculateSuperTrend(highPrices, lowPrices, closePrices);
const RSI = calculateRSI(closePrices);
const EMA20 = calculateEMA(closePrices);
const SMA50 = calculateSMA(closePrices);
const MACD = calculateMACD(closePrices);
const VIX = interpretVIX(vix);
const BollingerBands = calculateBollingerBands(closePrices);
const ATR = calculateATROutput(highPrices, lowPrices, closePrices);
const ADX = calculateADX(highPrices, lowPrices, closePrices);
const Stochastic = calculateStochastic(highPrices, lowPrices, closePrices);
const VWAP = calculateVWAP(ohlcData, volume);
const CCI = calculateCCI(highPrices, lowPrices, closePrices);
const VolumeIndicators = calculateOBV(closePrices, volume);
const Aroon = calculateAroon(highPrices, lowPrices);
const ParabolicSAR = calculateParabolicSAR(highPrices, lowPrices);
const MFI = calculateMFI(highPrices, lowPrices, closePrices, volume);
// [IND-7] Use today's candle data for patterns if available
const candleOpen = todayOpen.length >= 3 ? todayOpen : openPrices;
const candleHigh = todayHigh.length >= 3 ? todayHigh : highPrices;
const candleLow = todayLow.length >= 3 ? todayLow : lowPrices;
const candleClose = todayClose.length >= 3 ? todayClose : closePrices;
const CandlePatterns = detectCandlestickPattern(candleOpen, candleHigh, candleLow, candleClose);

// ✅ Final Combined Output
return [
    {
        json: {
            LTP: ltp,
            RSI,
            EMA20,
            SMA50,
            MACD,
            VIX,
            BollingerBands,
            ATR,
            ADX,
            Stochastic,
            VWAP,
            CCI,
            SuperTrend,
            VolumeIndicators,
            Aroon,
            ParabolicSAR,
            MFI,
            CandlePatterns,
            PriceAction,
            VolumeSpike,
            VolumeStrength,
            candleCount: closePrices.length,
            todayCandleCount: todayClose.length,
            indicatorVersion: "v2.0"
        }
    }
];
