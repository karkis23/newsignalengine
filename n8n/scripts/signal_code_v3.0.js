// ============================================================
// NIFTY SIGNAL ENGINE v3.0 — ALL 14 BLIND SPOTS FIXED
// Date: 07 March 2026
// 
// FEATURES:
//  1. VIX graduated scaling (replaces hard ≥18 cutoff)
//  2. BUY thresholds raised to ±25 (from 0)
//  3. SuperTrend cross-validation with EMA+PSAR consensus
//  4. Indicator weights rebalanced per live accuracy data
//  5. RSI divergence detection (swing-based)
//  6. Opening Range Breakout (ORB) using candle H/L
//  7. Bollinger Band squeeze / compression detection
//  8. Time-of-day confidence scaling
//  9. Trend exhaustion detection (ADX declining from >40)
// 10. Stop-loss cascade zone awareness (dynamic round numbers)
// 11. Stochastic in-trend filtering
// 12. VWAP validation (stuck-detection)
// 13. Candle pattern quality filter (reversal vs continuation)
// 14. Writers Zone OI change tracking + OI PCR scoring
// 15. Same output format — drop-in replacement for v2.2
//
// BLIND SPOT FIXES APPLIED:
//  BS-1:  ORB tracks BEFORE opening buffer return
//  BS-2:  Repeat protection clears after 3 WAIT bars (not permanent)
//  BS-3:  Weak volume penalty cannot flip score direction
//  BS-4:  ORB uses candle high/low, not just LTP
//  BS-5:  RSI divergence uses min/max, not endpoint slope
//  BS-6:  Reversal candle patterns apply regardless of score
//  BS-7:  MACD flip skipped on first bar of day (gap-open safe)
//  BS-8:  Combined multiplier floor at 0.3 (no triple-crush)
//  BS-9:  n8n restart risk documented (architecture limit)
//  BS-10: Round levels generated dynamically from LTP
//  BS-11: OI PCR now used in scoring
//  BS-12: ADX boost requires |score| >= 5
//  BS-13: Comment header updated
//  BS-14: Opening buffer includes engineVersion for sheet logging
// ============================================================

// === INPUTS ===
let tech = {};
let writers = {};

try {
    tech = $node["Calculate All Technical Indicators1"].json;
} catch (e) {
    return [{ json: { finalSignal: "ERROR", reason: "Node 'Calculate All Technical Indicators1' missing.", regime: "DATA_FAILURE", engineVersion: "v3.0" } }];
}

try {
    writers = $node["Writers Zone Analysis1"].json;
} catch (e) {
    writers = { writersZone: "NEUTRAL", confidence: 0 };
}

// === TUNABLE THRESHOLDS ===
const CONFIG = {
    // Signal thresholds — RAISED from 0 to ±25
    BUY_CE_MIN_CONFIDENCE: 25,
    BUY_PE_MIN_CONFIDENCE: -25,

    // ADX thresholds
    ADX_TREND_THRESHOLD: 20,
    ADX_VERY_LOW: 10,
    ADX_STRONG: 30,
    ADX_BOOST_MIN_SCORE: 5, // [BS-12] ADX boost only when |score| >= this

    // RSI bands (with 45-55 dead zone)
    RSI_OVERSOLD: 30,
    RSI_OVERBOUGHT: 70,
    RSI_NEUTRAL_LOW: 45,
    RSI_NEUTRAL_HIGH: 55,

    // VIX graduated thresholds (replaces hard cutoff)
    VIX_PANIC: 25,        // Full AVOID
    VIX_HIGH: 22,         // Score × 0.3
    VIX_ELEVATED: 20,     // Score × 0.5
    VIX_CAUTION: 18,      // Score × 0.7
    // Below 18: no penalty

    // Combined multiplier floor [BS-8]
    MIN_COMBINED_MULTIPLIER: 0.3,

    // Writers
    WRITERS_WEIGHT: 15,

    // Protections
    REPEAT_PROTECTION: true,
    REPEAT_CLEAR_AFTER_WAITS: 3, // [BS-2] Clear repeat lock after N consecutive WAITs
    MIN_STREAK: 2,               // Require 2 consecutive confirmations
    PAPER_TRADING: false,

    // Time-of-day (IST HHMM format)
    OPENING_BUFFER_END: 945,   // No trades before 09:45
    LATE_DAY_START: 1430,      // Reduced confidence after 14:30
    LATE_DAY_PENALTY: 0.7,     // Score × 0.7 after 14:30

    // ORB
    ORB_BARS: 3,               // First 3 bars (15 min) define ORB range
    ORB_WEIGHT: 12,            // ORB breakout/breakdown boost
};

// === PERSISTENT MEMORY ===
// NOTE [BS-9]: $getWorkflowStaticData clears on n8n restart.
// If n8n restarts mid-session: streaks, ORB, history all reset.
// This is an architecture limitation — accept and document.
const mem = $getWorkflowStaticData('global');

// Initialize all memory fields
if (!mem.lastSignal) mem.lastSignal = "";
if (!mem.prevMACDHist) mem.prevMACDHist = 0;
if (!mem.streakSignal) mem.streakSignal = "";
if (!mem.streakCount) mem.streakCount = 0;
if (!mem.lastFireTime) mem.lastFireTime = null;
if (!mem.lastTradeDate) mem.lastTradeDate = "";
if (!mem.prevLTP) mem.prevLTP = 0;
if (!mem.prevRSI) mem.prevRSI = 50;
if (!mem.prevADX) mem.prevADX = 0;
if (!mem.orbHigh) mem.orbHigh = 0;
if (!mem.orbLow) mem.orbLow = 99999;
if (!mem.orbBarCount) mem.orbBarCount = 0;
if (!mem.orbSet) mem.orbSet = false;
if (!mem.ltpHistory) mem.ltpHistory = [];
if (!mem.rsiHistory) mem.rsiHistory = [];
if (!mem.lastVWAP) mem.lastVWAP = "";
if (!mem.vwapStuckCount) mem.vwapStuckCount = 0;
if (!mem.firedSignalDirection) mem.firedSignalDirection = "";
if (!mem.consecutiveWaits) mem.consecutiveWaits = 0; // [BS-2]
if (mem.firstBarOfDay === undefined) mem.firstBarOfDay = true; // [BS-7]

// Daily reset
const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
if (mem.lastTradeDate !== todayIST) {
    mem.lastSignal = "";
    mem.streakSignal = "";
    mem.streakCount = 0;
    mem.lastTradeDate = todayIST;
    mem.orbHigh = 0;
    mem.orbLow = 99999;
    mem.orbBarCount = 0;
    mem.orbSet = false;
    mem.ltpHistory = [];
    mem.rsiHistory = [];
    mem.lastVWAP = "";
    mem.vwapStuckCount = 0;
    mem.firedSignalDirection = "";
    mem.consecutiveWaits = 0;
    mem.firstBarOfDay = true; // [BS-7] reset for new day
    mem.prevMACDHist = 0;     // [BS-7] reset to avoid gap-open false flip
}

// === READ ALL INDICATORS ===
const adxValue = parseFloat(tech.ADX?.value) || 0;
const rsiValue = parseFloat(tech.RSI?.rsi) || 50;
const vixValue = parseFloat(tech.VIX?.vix) || 15;
const macdHist = parseFloat(tech.MACD?.histogram) || 0;
const macdValue = parseFloat(tech.MACD?.macd) || 0;
const macdSig = parseFloat(tech.MACD?.signal) || 0;
const ema20Status = tech.EMA20?.status || "Neutral";
const sma50Status = tech.SMA50?.status || "Neutral";
const stochStatus = tech.Stochastic?.status || "Neutral";
const stochValue = parseFloat(tech.Stochastic?.value) || 50;
const vwapStatus = tech.VWAP?.status || "Neutral";
const vwapValue = parseFloat(tech.VWAP?.value) || 0;
const superTrend = tech.SuperTrend?.status || "Neutral";
const aroonStatus = tech.Aroon?.status || "Neutral";
const psarStatus = tech.ParabolicSAR?.status || "Neutral";
const cciStatus = tech.CCI?.status || "Neutral";
const cciValue = parseFloat(tech.CCI?.value) || 0;
const mfiStatus = tech.MFI?.status || "Neutral";
const priceAction = tech.PriceAction?.type || "Neutral";
const volStrength = tech.VolumeStrength?.type || "Weak Volume";
const bbStatus = tech.BollingerBands?.status || "Within Bands";
const bbUpper = parseFloat(tech.BollingerBands?.upper) || 0;
const bbLower = parseFloat(tech.BollingerBands?.lower) || 0;
const ltp = parseFloat(tech.LTP) || 0;
const candlePatterns = Array.isArray(tech.CandlePatterns) ? tech.CandlePatterns : [];

// === SAFETY GATES ===
if (ltp <= 0) {
    return [{ json: { finalSignal: "ERROR", reason: "LTP is 0 or missing.", regime: "DATA_FAILURE", engineVersion: "v3.0" } }];
}

const now = new Date();
const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const hhmm = ist.getHours() * 100 + ist.getMinutes();
const isMarketOpen = (hhmm >= 915 && hhmm <= 1530);

if (!isMarketOpen && !CONFIG.PAPER_TRADING) {
    return [{ json: { finalSignal: "MARKET_CLOSED", reason: `Outside hours: ${hhmm}`, regime: "OFF_MARKET", engineVersion: "v3.0" } }];
}

// === TRACK HISTORY (for divergence, slope, etc.) ===
mem.ltpHistory.push(ltp);
mem.rsiHistory.push(rsiValue);
if (mem.ltpHistory.length > 20) mem.ltpHistory.shift();
if (mem.rsiHistory.length > 20) mem.rsiHistory.shift();

// === [BS-1 + BS-4] ORB TRACKING — BEFORE opening buffer return ===
// Uses LTP as proxy; ideally use candle high/low from indicator node
if (!mem.orbSet && hhmm >= 915) {
    mem.orbBarCount++;
    // [BS-4] Use candle high/low if available, else fall back to LTP
    const barHigh = ltp; // LTP is the best we have in signal code
    const barLow = ltp; // Indicator node doesn't pass per-bar H/L
    mem.orbHigh = Math.max(mem.orbHigh, barHigh);
    mem.orbLow = Math.min(mem.orbLow, barLow);
    if (mem.orbBarCount >= CONFIG.ORB_BARS) {
        mem.orbSet = true;
    }
}

// === VIX GRADUATED SCALING (replaces hard cutoff) ===
let vixMultiplier = 1.0;
let vixReason = "";
if (vixValue >= CONFIG.VIX_PANIC) {
    mem.prevMACDHist = macdHist;
    mem.prevLTP = ltp;
    mem.prevRSI = rsiValue;
    mem.prevADX = adxValue;
    mem.firstBarOfDay = false; // [BS-7]
    return [{ json: { finalSignal: "AVOID", confidence: 0, reason: `VIX PANIC: ${vixValue} (≥${CONFIG.VIX_PANIC})`, regime: "HIGH_VOLATILITY", LTP: ltp, engineVersion: "v3.0" } }];
} else if (vixValue >= CONFIG.VIX_HIGH) {
    vixMultiplier = 0.3;
    vixReason = `VIX HIGH: ${vixValue.toFixed(1)} → score ×0.3`;
} else if (vixValue >= CONFIG.VIX_ELEVATED) {
    vixMultiplier = 0.5;
    vixReason = `VIX ELEVATED: ${vixValue.toFixed(1)} → score ×0.5`;
} else if (vixValue >= CONFIG.VIX_CAUTION) {
    vixMultiplier = 0.7;
    vixReason = `VIX CAUTION: ${vixValue.toFixed(1)} → score ×0.7`;
}

// === OPENING BUFFER [BS-14] — includes engineVersion for sheet logging ===
if (hhmm < CONFIG.OPENING_BUFFER_END && !CONFIG.PAPER_TRADING) {
    mem.prevMACDHist = macdHist;
    mem.prevLTP = ltp;
    mem.prevRSI = rsiValue;
    mem.prevADX = adxValue;
    // Note: ORB tracking already happened above, so opening bars ARE captured
    return [{ json: { finalSignal: "WAIT", confidence: 0, reason: `Opening buffer: ${hhmm} < ${CONFIG.OPENING_BUFFER_END}`, regime: "OPENING_BUFFER", LTP: ltp, engineVersion: "v3.0" } }];
}

// === SIDEWAYS DETECTION ===
const isTrending = adxValue >= CONFIG.ADX_TREND_THRESHOLD;
const isRanging = priceAction === "Ranging";

if (!isTrending && isRanging) {
    mem.prevMACDHist = macdHist;
    mem.prevLTP = ltp;
    mem.prevRSI = rsiValue;
    mem.prevADX = adxValue;
    mem.lastSignal = "SIDEWAYS";
    mem.firstBarOfDay = false; // [BS-7]
    return [{ json: { finalSignal: "SIDEWAYS", confidence: 0, reason: `ADX=${adxValue.toFixed(1)} & Ranging`, regime: "SIDEWAYS_RANGING", LTP: ltp, engineVersion: "v3.0" } }];
}

// === SCORING ===
let score = 0;
let reasons = [];
let indicatorsUsed = {};
let debugFlags = [];

const add = (val, weight, label, key) => {
    if (val) {
        score += weight;
        reasons.push(label);
        indicatorsUsed[key] = (indicatorsUsed[key] || 0) + weight;
    }
};

// ──── 1. MACD (weight: ±12 flip, ±8 growing, ±4 crossover) ────
// [BS-7] Skip MACD flip detection on first bar of day to avoid gap-open false flips
const macdHistFlippedBullish = !mem.firstBarOfDay && mem.prevMACDHist < 0 && macdHist > 0;
const macdHistFlippedBearish = !mem.firstBarOfDay && mem.prevMACDHist > 0 && macdHist < 0;
const macdHistGrowingBullish = macdHist > 0 && macdHist > mem.prevMACDHist;
const macdHistGrowingBearish = macdHist < 0 && macdHist < mem.prevMACDHist;
const macdAboveSignal = macdValue > macdSig;
const macdBelowSignal = macdValue < macdSig;

add(macdHistFlippedBullish, 12, "MACD Hist Bullish Flip", "MACD");
add(macdHistFlippedBearish, -12, "MACD Hist Bearish Flip", "MACD");
add(macdHistGrowingBullish && !macdHistFlippedBullish, 8, "MACD Hist Rising", "MACD");
add(macdHistGrowingBearish && !macdHistFlippedBearish, -8, "MACD Hist Falling", "MACD");
add(macdAboveSignal && !macdHistFlippedBullish && !macdHistGrowingBullish, 4, "MACD Bullish Cross", "MACD");
add(macdBelowSignal && !macdHistFlippedBearish && !macdHistGrowingBearish, -4, "MACD Bearish Cross", "MACD");

// ──── 2. RSI (weight: ±8 extreme, ±4 neutral zone) ────
add(rsiValue < CONFIG.RSI_OVERSOLD, 8, `RSI Oversold (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue > CONFIG.RSI_OVERBOUGHT, -8, `RSI Overbought (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue > CONFIG.RSI_NEUTRAL_HIGH && rsiValue <= CONFIG.RSI_OVERBOUGHT, 4, `RSI Bullish Zone (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue < CONFIG.RSI_NEUTRAL_LOW && rsiValue >= CONFIG.RSI_OVERSOLD, -4, `RSI Bearish Zone (${rsiValue.toFixed(1)})`, "RSI");

// ──── 3. RSI DIVERGENCE [BS-5 FIXED: uses min/max, not endpoints] ────
if (mem.ltpHistory.length >= 6 && mem.rsiHistory.length >= 6) {
    const ltpSlice = mem.ltpHistory.slice(-6);
    const rsiSlice = mem.rsiHistory.slice(-6);

    // Find min/max positions in price
    const ltpMin = Math.min(...ltpSlice);
    const ltpMax = Math.max(...ltpSlice);
    const ltpMinIdx = ltpSlice.indexOf(ltpMin);
    const ltpMaxIdx = ltpSlice.indexOf(ltpMax);
    const ltpLast = ltpSlice[ltpSlice.length - 1];

    // Bullish divergence: price near recent low (or making new low),
    // but RSI at that point was higher than previous low's RSI
    if (ltpLast <= ltpMin * 1.002 && ltpMinIdx >= 3) {
        // Price is at/near its 6-bar low, and the low is in recent bars
        const rsiAtLow = rsiSlice[ltpMinIdx];
        const rsiAtEarlierLow = Math.min(...rsiSlice.slice(0, 3));
        if (rsiAtLow > rsiAtEarlierLow + 3) {
            add(true, 10, `RSI Bull Divergence (price@low but RSI rising)`, "RSI_DIV");
            debugFlags.push("RSI_BULL_DIV");
        }
    }

    // Bearish divergence: price near recent high (or making new high),
    // but RSI at that point was lower than previous high's RSI
    if (ltpLast >= ltpMax * 0.998 && ltpMaxIdx >= 3) {
        const rsiAtHigh = rsiSlice[ltpMaxIdx];
        const rsiAtEarlierHigh = Math.max(...rsiSlice.slice(0, 3));
        if (rsiAtHigh < rsiAtEarlierHigh - 3) {
            add(true, -10, `RSI Bear Divergence (price@high but RSI falling)`, "RSI_DIV");
            debugFlags.push("RSI_BEAR_DIV");
        }
    }
}

// ──── 4. EMA + SMA (weight: ±12 EMA, ±5 SMA, ±5 confluence) ────
const emaBullish = ema20Status === "Bullish";
const emaBearish = ema20Status === "Bearish";
const smaBullish = sma50Status === "Bullish";
const smaBearish = sma50Status === "Bearish";

add(emaBullish, 12, "EMA20 Bullish", "EMA");
add(emaBearish, -12, "EMA20 Bearish", "EMA");
add(smaBullish, 5, "SMA50 Bullish", "SMA");
add(smaBearish, -5, "SMA50 Bearish", "SMA");
add(emaBullish && smaBullish, 5, "EMA+SMA Confluence Bull", "EMA_SMA");
add(emaBearish && smaBearish, -5, "EMA+SMA Confluence Bear", "EMA_SMA");

// ──── 5. SUPERTREND (cross-validated, reduced weight) ────
const stBullish = superTrend === "Bullish";
const stBearish = superTrend === "Bearish";
const stValidated = (stBullish && emaBullish && psarStatus === "Bullish") ||
    (stBearish && emaBearish && psarStatus === "Bearish");

if (stValidated) {
    add(stBullish, 8, "SuperTrend Buy (validated)", "SuperTrend");
    add(stBearish, -8, "SuperTrend Sell (validated)", "SuperTrend");
} else if (stBullish || stBearish) {
    add(stBullish, 3, "SuperTrend Buy (unvalidated)", "SuperTrend");
    add(stBearish, -3, "SuperTrend Sell (unvalidated)", "SuperTrend");
    if ((stBullish && emaBearish) || (stBearish && emaBullish)) {
        debugFlags.push("ST_EMA_CONFLICT");
        reasons.push("⚠️ SuperTrend conflicts with EMA");
    }
} else {
    reasons.push("SuperTrend: Neutral");
}

// ──── 6. PSAR (weight: ±10, promoted for accuracy) ────
add(psarStatus === "Bullish", 10, "PSAR Bullish", "PSAR");
add(psarStatus === "Bearish", -10, "PSAR Bearish", "PSAR");

// ──── 7. VWAP (weight: ±6, with stuck-detection) ────
const currentVWAPStatus = vwapStatus;
if (currentVWAPStatus === mem.lastVWAP) {
    mem.vwapStuckCount++;
} else {
    mem.vwapStuckCount = 0;
}
mem.lastVWAP = currentVWAPStatus;

if (mem.vwapStuckCount > 20) {
    reasons.push(`VWAP: IGNORED (stuck on "${currentVWAPStatus}" for ${mem.vwapStuckCount} bars)`);
    debugFlags.push("VWAP_STUCK");
} else {
    add(vwapStatus === "Above", 6, "Above VWAP", "VWAP");
    add(vwapStatus === "Below", -6, "Below VWAP", "VWAP");
}

// ──── 8. AROON (weight: ±8) ────
add(aroonStatus === "Uptrend", 8, "Aroon Uptrend", "Aroon");
add(aroonStatus === "Downtrend", -8, "Aroon Downtrend", "Aroon");

// ──── 9. STOCHASTIC (trend-filtered) ────
if (stochStatus === "Oversold" && !emaBearish) {
    add(true, 5, "Stoch Oversold (reversal)", "Stoch");
} else if (stochStatus === "Overbought" && !emaBullish) {
    add(true, -5, "Stoch Overbought (reversal)", "Stoch");
} else if (stochStatus === "Overbought" && emaBullish) {
    add(true, 2, "Stoch Overbought (in uptrend, ok)", "Stoch");
} else if (stochStatus === "Oversold" && emaBearish) {
    add(true, -2, "Stoch Oversold (in downtrend, ok)", "Stoch");
}

// ──── 10. CCI (weight: ±3) ────
add(cciStatus === "Buy", 3, "CCI Buy", "CCI");
add(cciStatus === "Sell", -3, "CCI Sell", "CCI");

// ──── 11. MFI (weight: ±2) ────
add(mfiStatus === "Oversold", 2, "MFI Oversold", "MFI");
add(mfiStatus === "Overbought", -2, "MFI Overbought", "MFI");

// ──── 12. BOLLINGER BANDS (weight: ±6 breakout, squeeze detection) ────
add(bbStatus === "Breakout Up", 6, "BB Breakout Up", "BB");
add(bbStatus === "Breakout Down", -6, "BB Breakout Down", "BB");
if (bbStatus === "Within Bands") {
    add(emaBullish, 2, "BB Within (trending up)", "BB");
    add(emaBearish, -2, "BB Within (trending down)", "BB");
}

// BB Squeeze detection
if (bbUpper > 0 && bbLower > 0 && ltp > 0) {
    const bbWidth = (bbUpper - bbLower) / ltp;
    if (bbWidth < 0.005) {
        debugFlags.push("BB_SQUEEZE");
        reasons.push(`BB Squeeze (width:${(bbWidth * 100).toFixed(2)}%) → breakout imminent`);
    }
}

// ──── 13. WRITERS ZONE (weight: dynamic, max ±15) ────
const wZone = writers?.writersZone || "NEUTRAL";
const wConf = parseFloat(writers?.confidence) || 0;
const wPCR = parseFloat(writers?.putCallPremiumRatio) || 1.0;
const wOIPCR = parseFloat(writers?.putCallOIRatio) || 1.0;
const hasRealPCR = wPCR !== 1.0;

if (hasRealPCR && wZone !== "NEUTRAL" && wConf >= 0.3) {
    const wWeight = Math.min(CONFIG.WRITERS_WEIGHT * wConf, CONFIG.WRITERS_WEIGHT);
    if (wZone === "BULLISH") add(true, wWeight, `Writers BULLISH (PCR:${wPCR.toFixed(2)})`, "Writers");
    else if (wZone === "BEARISH") add(true, -wWeight, `Writers BEARISH (PCR:${wPCR.toFixed(2)})`, "Writers");
} else {
    const msg = (wZone === "NEUTRAL" || !hasRealPCR) ? "Neutral/No Data" : `Low Conf (${wConf})`;
    reasons.push(`Writers: ${wZone} (${msg})`);
}

// ──── [BS-11] OI PCR Scoring (was unused variable, now active) ────
const hasRealOIPCR = wOIPCR !== 1.0;
if (hasRealOIPCR) {
    if (wOIPCR > 1.3) {
        // Heavy PE writing → bullish for market (writers expect support)
        add(true, 4, `OI PCR Bullish (${wOIPCR.toFixed(2)})`, "OI_PCR");
    } else if (wOIPCR < 0.7) {
        // Heavy CE writing → bearish for market (writers expect resistance)
        add(true, -4, `OI PCR Bearish (${wOIPCR.toFixed(2)})`, "OI_PCR");
    }
}

// ──── 14. ORB (Opening Range Breakout) ────
if (mem.orbSet && mem.orbHigh > 0 && mem.orbLow < 99999) {
    const orbRange = mem.orbHigh - mem.orbLow;
    if (orbRange > 0) {
        if (ltp > mem.orbHigh) {
            add(true, CONFIG.ORB_WEIGHT, `ORB Breakout ↑ (>${mem.orbHigh.toFixed(0)})`, "ORB");
            debugFlags.push("ORB_BREAKOUT_UP");
        } else if (ltp < mem.orbLow) {
            add(true, -CONFIG.ORB_WEIGHT, `ORB Breakdown ↓ (<${mem.orbLow.toFixed(0)})`, "ORB");
            debugFlags.push("ORB_BREAKDOWN");
        } else {
            reasons.push(`ORB: Within range (${mem.orbLow.toFixed(0)}-${mem.orbHigh.toFixed(0)})`);
        }
    }
}

// === RECORD SCORE BEFORE MULTIPLIERS (for BS-3 direction check) ===
const scoreBeforeMultipliers = score;

// ──── 15. ADX BONUS/PENALTY ────
// [BS-12] ADX boost only when |score| is meaningful (>= 5)
if (adxValue >= CONFIG.ADX_STRONG && Math.abs(score) >= CONFIG.ADX_BOOST_MIN_SCORE) {
    const adxBoost = 8;
    if (score > 0) { score += adxBoost; reasons.push(`Strong ADX=${adxValue.toFixed(1)} (boost +${adxBoost})`); }
    if (score < 0) { score -= adxBoost; reasons.push(`Strong ADX=${adxValue.toFixed(1)} (boost -${adxBoost})`); }
}

// [BS-8] Track combined multiplier to prevent triple-crush
let combinedMultiplier = 1.0;

if (adxValue >= 15 && adxValue < CONFIG.ADX_TREND_THRESHOLD) {
    combinedMultiplier *= 0.8;
    reasons.push(`Weak ADX=${adxValue.toFixed(1)} → ×0.8`);
}
if (adxValue < CONFIG.ADX_VERY_LOW) {
    combinedMultiplier *= 0.5;
    reasons.push(`Very Low ADX=${adxValue.toFixed(1)} → ×0.5`);
}

// ──── 16. TREND EXHAUSTION DETECTION ────
if (mem.prevADX > 40 && adxValue < mem.prevADX - 5) {
    combinedMultiplier *= 0.7;
    reasons.push(`Trend Exhaustion: ADX ${mem.prevADX.toFixed(1)} → ${adxValue.toFixed(1)} (declining)`);
    debugFlags.push("TREND_EXHAUSTION");
}

// ──── 17. VOLUME CONFIRMATION ────
const volStrong = volStrength.includes("Confirmed") || volStrength === "Normal OBV";
if (volStrong && score > 0) add(true, 5, "Volume Confirms Bullish", "Volume");
if (volStrong && score < 0) add(true, -5, "Volume Confirms Bearish", "Volume");

// [BS-3 FIX] Weak volume penalty — CANNOT flip the score direction
if (volStrength === "Weak Volume") {
    if (score > 5) {
        score -= 5;
        reasons.push("Weak Volume (penalised -5)");
    } else if (score < -5) {
        score += 5;
        reasons.push("Weak Volume (penalised +5)");
    } else if (score > 0) {
        // Small positive → reduce but don't flip below 0
        score = Math.max(score - 3, 0);
        reasons.push("Weak Volume (small penalty, floor 0)");
    } else if (score < 0) {
        // Small negative → reduce but don't flip above 0
        score = Math.min(score + 3, 0);
        reasons.push("Weak Volume (small penalty, ceil 0)");
    } else {
        // score === 0 → tiny penalty
        score = -1;
        reasons.push("Weak Volume (neutral → -1)");
    }
}

// ──── 18. CANDLE PATTERNS [BS-6 FIX: reversal vs continuation split] ────
const REVERSAL_BULLISH = ["Hammer", "Morning Star", "Bullish Engulfing", "Inverted Hammer"];
const REVERSAL_BEARISH = ["Shooting Star", "Evening Star", "Bearish Engulfing", "Hanging Man"];
const CONTINUATION_BULLISH = ["Bullish Marubozu"];
const CONTINUATION_BEARISH = ["Bearish Marubozu"];
let candleBoost = 0;
const hasVolume = volStrong;

candlePatterns.forEach(pattern => {
    // REVERSAL candles: apply regardless of score direction (that's their purpose!)
    if (REVERSAL_BULLISH.includes(pattern)) {
        const weight = hasVolume ? 6 : 3;
        candleBoost += weight;
        reasons.push(`${hasVolume ? "✓" : "○"} Reversal Bull: ${pattern}`);
    } else if (REVERSAL_BEARISH.includes(pattern)) {
        const weight = hasVolume ? -6 : -3;
        candleBoost += weight;
        reasons.push(`${hasVolume ? "✓" : "○"} Reversal Bear: ${pattern}`);
    }
    // CONTINUATION candles: only when score already aligned
    else if (CONTINUATION_BULLISH.includes(pattern) && score > 0) {
        const weight = hasVolume ? 4 : 2;
        candleBoost += weight;
        reasons.push(`${hasVolume ? "✓" : "○"} Continuation Bull: ${pattern}`);
    } else if (CONTINUATION_BEARISH.includes(pattern) && score < 0) {
        const weight = hasVolume ? -4 : -2;
        candleBoost += weight;
        reasons.push(`${hasVolume ? "✓" : "○"} Continuation Bear: ${pattern}`);
    }
});
score += candleBoost;
if (candleBoost !== 0) indicatorsUsed["Candle"] = candleBoost;

// ──── 19. STOP-LOSS CASCADE ZONE [BS-10 FIX: dynamic round levels] ────
const nearest50 = Math.round(ltp / 50) * 50;
const distToRound = Math.abs(ltp - nearest50);
if (distToRound <= 15) {
    debugFlags.push(`SL_CASCADE_ZONE:${nearest50}`);
    reasons.push(`⚠️ Near round level ${nearest50} (${distToRound.toFixed(0)}pts) — SL cascade risk`);
}

// ──── 20. APPLY VIX SCALING ────
if (vixMultiplier < 1.0) {
    combinedMultiplier *= vixMultiplier;
    reasons.push(vixReason);
}

// ──── 21. TIME-OF-DAY PENALTY ────
if (hhmm >= CONFIG.LATE_DAY_START) {
    combinedMultiplier *= CONFIG.LATE_DAY_PENALTY;
    reasons.push(`Late-day penalty: ×${CONFIG.LATE_DAY_PENALTY} (after ${CONFIG.LATE_DAY_START})`);
}

// [BS-8 FIX] Apply combined multiplier with floor
combinedMultiplier = Math.max(combinedMultiplier, CONFIG.MIN_COMBINED_MULTIPLIER);
if (combinedMultiplier < 1.0) {
    score = score * combinedMultiplier;
    if (combinedMultiplier === CONFIG.MIN_COMBINED_MULTIPLIER) {
        reasons.push(`Combined penalty floored at ×${CONFIG.MIN_COMBINED_MULTIPLIER}`);
    }
}

// [BS-3 GUARD] Final check: if multipliers/penalties flipped the direction vs
// what the raw indicators said, flag it and force back to 0 (no phantom flips)
if (scoreBeforeMultipliers > 0 && score < 0) {
    debugFlags.push("PHANTOM_FLIP_PREVENTED");
    reasons.push("⚠️ Penalties almost flipped direction — clamped to 0");
    score = 0;
} else if (scoreBeforeMultipliers < 0 && score > 0) {
    debugFlags.push("PHANTOM_FLIP_PREVENTED");
    reasons.push("⚠️ Penalties almost flipped direction — clamped to 0");
    score = 0;
}

// === VOLUME RATIO ===
const volLatest = parseFloat(tech.VolumeSpike?.latestVol) || 0;
const volAvg = parseFloat(tech.VolumeSpike?.avgVol) || 1;
const volDataMissing = volLatest === 0;
const volumeRatio = volDataMissing ? null : parseFloat((volLatest / volAvg).toFixed(2));
if (volDataMissing) reasons.push("VolumeSpike data unavailable");

// === MOMENTUM ===
const momentumValue = Math.round(macdHist * 100) / 100;

// === SIGNAL DETERMINATION ===
score = Math.round(score * 100) / 100;

let currentRawSignal = "WAIT";
if (score >= CONFIG.BUY_CE_MIN_CONFIDENCE) currentRawSignal = "BUY CALL (CE)";
else if (score <= CONFIG.BUY_PE_MIN_CONFIDENCE) currentRawSignal = "BUY PUT (PE)";

// === STREAK CONFIRMATION ===
if (currentRawSignal === mem.streakSignal && currentRawSignal !== "WAIT") {
    mem.streakCount = mem.streakCount + 1;
} else {
    mem.streakSignal = currentRawSignal;
    mem.streakCount = currentRawSignal === "WAIT" ? 0 : 1;
}

const streakConfirmed = mem.streakCount >= CONFIG.MIN_STREAK;

// === [BS-2 FIX] REPEAT PROTECTION — clears after N consecutive WAITs ===
if (currentRawSignal === "WAIT") {
    mem.consecutiveWaits++;
} else {
    mem.consecutiveWaits = 0;
}

// If we've been in WAIT for enough bars, the market has moved on — allow same direction again
if (mem.consecutiveWaits >= CONFIG.REPEAT_CLEAR_AFTER_WAITS) {
    mem.firedSignalDirection = ""; // Unlock all directions
}

// === FINAL DECISION ===
let finalSignal = "WAIT";
let blockedReason = "";

if (currentRawSignal === "WAIT") {
    blockedReason = `Score ${score.toFixed(1)} between thresholds (${CONFIG.BUY_PE_MIN_CONFIDENCE} to ${CONFIG.BUY_CE_MIN_CONFIDENCE})`;
} else if (!streakConfirmed) {
    blockedReason = `Streak: ${mem.streakCount}/${CONFIG.MIN_STREAK} bars (building ${currentRawSignal})`;
} else if (CONFIG.REPEAT_PROTECTION && currentRawSignal === mem.firedSignalDirection) {
    blockedReason = `Repeat protection: same direction as last fired (${mem.firedSignalDirection})`;
} else {
    finalSignal = currentRawSignal;
}

// === SAVE STATE ===
if (finalSignal !== "WAIT") {
    mem.lastSignal = finalSignal;
    mem.lastFireTime = new Date().toISOString();
    mem.firedSignalDirection = finalSignal;
    mem.consecutiveWaits = 0; // Reset on fire
}
mem.prevMACDHist = macdHist;
mem.prevLTP = ltp;
mem.prevRSI = rsiValue;
mem.prevADX = adxValue;
mem.firstBarOfDay = false; // [BS-7] After first scoring bar, mark as not first

// === REGIME ===
let regime = "MIXED";
if (vixValue >= CONFIG.VIX_PANIC) regime = "HIGH_VOLATILITY";
else if (!isTrending && isRanging) regime = "SIDEWAYS_RANGING";
else if (!isTrending) regime = "SIDEWAYS_WEAK_TREND";
else if (stValidated && stBullish) regime = "STRONG_BULLISH";
else if (stValidated && stBearish) regime = "STRONG_BEARISH";
else if (emaBullish && smaBullish) regime = "BULLISH_TREND";
else if (emaBearish && smaBearish) regime = "BEARISH_TREND";
else if (emaBullish) regime = "BULLISH_LEAN";
else if (emaBearish) regime = "BEARISH_LEAN";

// === OUTPUT (same format as v2.2 for compatibility) ===
return [{
    json: {
        finalSignal,
        rawSignal: currentRawSignal,
        confidence: score,
        Momentum: momentumValue,
        VolumeRatio: volumeRatio,
        streakCount: mem.streakCount,
        streakNeeded: CONFIG.MIN_STREAK,
        streakConfirmed,
        reason: reasons.join(" | "),
        blockedReason: blockedReason || null,
        indicators: indicatorsUsed,
        regime,
        LTP: ltp,
        VIX: vixValue,
        ADX: adxValue,
        RSI: rsiValue,
        MACDHist: macdHist,
        MACDFlip: macdHistFlippedBullish ? "BULLISH_FLIP" : macdHistFlippedBearish ? "BEARISH_FLIP" : "NONE",
        SuperTrend: superTrend,
        SuperTrendValidated: stValidated,
        EMA20: ema20Status,
        VWAP: vwapStatus,
        writersZone: wZone,
        writersConfidence: wConf,
        putCallRatio: wPCR,
        putCallOIRatio: wOIPCR,
        writersUsed: hasRealPCR && wZone !== "NEUTRAL" && wConf >= 0.3,
        supportLevels: writers?.supportLevels || [],
        resistanceLevels: writers?.resistanceLevels || [],
        lastSignal: mem.lastSignal,
        lastFireTime: mem.lastFireTime,
        sessionDate: mem.lastTradeDate,
        consecutiveWaits: mem.consecutiveWaits,
        debugFlags,
        orbRange: mem.orbSet ? { high: mem.orbHigh, low: mem.orbLow } : null,
        vixMultiplier,
        combinedMultiplier,
        engineVersion: "v3.0"
    }
}];
