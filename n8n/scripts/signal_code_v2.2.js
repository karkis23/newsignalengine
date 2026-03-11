// ============================================================
// NIFTY SIGNAL ENGINE v2.2 — 14 BLIND SPOTS FIXED
// Last Update: 02 March 2026
// Fixes:
//  #1  Writers Zone Confidence >= 0.3 floor included (was strictly > 0.3)
//  #2  ADX < 10 → score halved (very low ADX penalty)
//  #4  prevMACDHist updated on ALL early returns (SIDEWAYS/VIX)
//  #5  Daily reset of lastSignal/streak at start of each new day
//  #6  RSI neutral bands mutually exclusive (45/55 boundary, no overlap)
//  #7  Volume gap at score=0 handled (-2 weak volume neutral penalty)
//  #8  ADX bonus moved BEFORE volume check (correct scoring order)
//  #9  EMA+SMA dual bonus reduced +10→+5 (prevents triple-count)
// #10  VWAP default "Neutral" (was "Below" — silent bearish bias)
// #11  PriceAction default "Neutral" (was "Ranging" — silent SIDEWAYS)
// #12  Momentum = MACD histogram (was = score, misleading)
// #13  VolumeRatio = null when data missing (was 0, silent)
// #14  SuperTrend "Neutral" logged in reason string
// ============================================================

// === INPUTS ===
let tech = {};
let writers = {};

try {
    tech = $node["Calculate All Technical Indicators1"].json;
} catch (e) {
    return [{ json: { finalSignal: "ERROR", reason: "Node 'Calculate All Technical Indicators1' missing.", regime: "DATA_FAILURE" } }];
}

try {
    writers = $node["Writers Zone Analysis1"].json;
} catch (e) {
    writers = { writersZone: "NEUTRAL", confidence: 0 };
}

// === TUNABLE THRESHOLDS ===
const CONFIG = {
    BUY_CE_MIN_CONFIDENCE: 0,
    BUY_PE_MIN_CONFIDENCE: -0,
    ADX_TREND_THRESHOLD: 20,
    ADX_VERY_LOW: 10,   // [#2] below this → score × 0.5
    RSI_OVERSOLD: 35,
    RSI_OVERBOUGHT: 65,
    WRITERS_WEIGHT: 20,
    REPEAT_PROTECTION: true,
    MIN_STREAK: 1,
    PAPER_TRADING: false,
};

// === PERSISTENT MEMORY ===
const mem = $getWorkflowStaticData('global');

if (!mem.lastSignal) mem.lastSignal = "";
if (!mem.prevMACDHist) mem.prevMACDHist = 0;
if (!mem.streakSignal) mem.streakSignal = "";
if (!mem.streakCount) mem.streakCount = 0;
if (!mem.lastFireTime) mem.lastFireTime = null;
if (!mem.lastTradeDate) mem.lastTradeDate = "";
if (!mem.prevLTP) mem.prevLTP = 0;

// [FIX #5] Daily reset — clear lastSignal/streak at start of each new trading day
const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
if (mem.lastTradeDate !== todayIST) {
    mem.lastSignal = "";  // Allow fresh signals on new day
    mem.streakSignal = "";
    mem.streakCount = 0;
    mem.lastTradeDate = todayIST;
    // prevMACDHist kept intentionally — overnight gap is real data
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
const vwapStatus = tech.VWAP?.status || "Neutral";   // [FIX #10] was "Below"
const superTrend = tech.SuperTrend?.status || "Neutral";
const aroonStatus = tech.Aroon?.status || "Neutral";
const psarStatus = tech.ParabolicSAR?.status || "Neutral";
const cciStatus = tech.CCI?.status || "Neutral";
const mfiStatus = tech.MFI?.status || "Neutral";
const priceAction = tech.PriceAction?.type || "Neutral";   // [FIX #11] was "Ranging"
const volStrength = tech.VolumeStrength?.type || "Weak Volume";
const bbStatus = tech.BollingerBands?.status || "Within Bands";
const ltp = parseFloat(tech.LTP) || 0;
const candlePatterns = Array.isArray(tech.CandlePatterns) ? tech.CandlePatterns : [];

// === SAFETY GATES ===
if (ltp <= 0) {
    return [{ json: { finalSignal: "ERROR", reason: "LTP is 0 or missing.", regime: "DATA_FAILURE" } }];
}

const now = new Date();
const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const hhmm = ist.getHours() * 100 + ist.getMinutes();
const isMarketOpen = (hhmm >= 915 && hhmm <= 1530);

if (!isMarketOpen && !CONFIG.PAPER_TRADING) {
    return [{ json: { finalSignal: "MARKET_CLOSED", reason: `Outside hours: ${hhmm}`, regime: "OFF_MARKET" } }];
}

if (vixValue >= 18) {
    mem.prevMACDHist = macdHist; // [FIX #4]
    mem.lastSignal = "AVOID";
    return [{ json: { finalSignal: "AVOID", confidence: 0, reason: `VIX too high: ${vixValue}`, regime: "HIGH_VOLATILITY", LTP: ltp } }];
}

const isTrending = adxValue >= CONFIG.ADX_TREND_THRESHOLD;
const isRanging = priceAction === "Ranging";

if (!isTrending && isRanging) {
    mem.prevMACDHist = macdHist; // [FIX #4]
    mem.lastSignal = "SIDEWAYS";
    return [{ json: { finalSignal: "SIDEWAYS", confidence: 0, reason: `ADX=${adxValue.toFixed(1)} & Ranging`, regime: "SIDEWAYS_RANGING", LTP: ltp } }];
}

// === SCORING ===
let score = 0;
let reasons = [];
let indicatorsUsed = {};

const add = (val, weight, label, key) => {
    if (val) {
        score += weight;
        reasons.push(label);
        indicatorsUsed[key] = (indicatorsUsed[key] || 0) + weight;
    }
};

// MACD
const macdHistFlippedBullish = mem.prevMACDHist < 0 && macdHist > 0;
const macdHistFlippedBearish = mem.prevMACDHist > 0 && macdHist < 0;
const macdHistGrowingBullish = macdHist > 0 && macdHist > mem.prevMACDHist;
const macdHistGrowingBearish = macdHist < 0 && macdHist < mem.prevMACDHist;
const macdAboveZero = macdValue > macdSig;
const macdBelowZero = macdValue < macdSig;

add(macdHistFlippedBullish, 20, "MACD Histogram Bullish Flip", "MACD");
add(macdHistFlippedBearish, -20, "MACD Histogram Bearish Flip", "MACD");
add(macdHistGrowingBullish && !macdHistFlippedBullish, 10, "MACD Histogram Rising", "MACD");
add(macdHistGrowingBearish && !macdHistFlippedBearish, -10, "MACD Histogram Falling", "MACD");
add(macdAboveZero && !macdHistFlippedBullish && !macdHistGrowingBullish, 5, "MACD Bullish Crossover", "MACD");
add(macdBelowZero && !macdHistFlippedBearish && !macdHistGrowingBearish, -5, "MACD Bearish Crossover", "MACD");

// RSI — [FIX #6] 45/55 split boundary, fully mutually exclusive, no overlap
add(rsiValue < CONFIG.RSI_OVERSOLD, 15, `RSI Oversold (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue > CONFIG.RSI_OVERBOUGHT, -15, `RSI Overbought (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue > 55 && rsiValue < CONFIG.RSI_OVERBOUGHT, 5, `RSI Neutral-Bullish (${rsiValue.toFixed(1)})`, "RSI");
add(rsiValue < 45 && rsiValue > CONFIG.RSI_OVERSOLD, -5, `RSI Neutral-Bearish (${rsiValue.toFixed(1)})`, "RSI");
// RSI 45–55 = true neutral zone → no score (intentional dead band)

// EMA + SMA — [FIX #9] dual confluence bonus reduced +10→+5
const emaBullish = ema20Status === "Bullish", emaBearish = ema20Status === "Bearish";
const smaBullish = sma50Status === "Bullish", smaBearish = sma50Status === "Bearish";
add(emaBullish, 10, "EMA20 Bullish", "EMA");
add(emaBearish, -10, "EMA20 Bearish", "EMA");
add(smaBullish, 5, "SMA50 Bullish", "SMA");
add(smaBearish, -5, "SMA50 Bearish", "SMA");
add(emaBullish && smaBullish, 5, "EMA+SMA Confluence Bullish", "EMA_SMA"); // [FIX #9] was +10
add(emaBearish && smaBearish, -5, "EMA+SMA Confluence Bearish", "EMA_SMA"); // [FIX #9] was -10

// SuperTrend + PSAR
add(superTrend === "Bullish", 15, "SuperTrend Buy", "SuperTrend");
add(superTrend === "Bearish", -15, "SuperTrend Sell", "SuperTrend");
if (superTrend === "Neutral") reasons.push("SuperTrend: Neutral (transitioning)"); // [FIX #14]
add(psarStatus === "Bullish", 8, "PSAR Bullish", "PSAR");
add(psarStatus === "Bearish", -8, "PSAR Bearish", "PSAR");

// VWAP, Aroon, Stoch, CCI, MFI
add(vwapStatus === "Above", 8, "Above VWAP", "VWAP");
add(vwapStatus === "Below", -8, "Below VWAP", "VWAP");
add(aroonStatus === "Uptrend", 8, "Aroon Uptrend", "Aroon");
add(aroonStatus === "Downtrend", -8, "Aroon Downtrend", "Aroon");
add(stochStatus === "Oversold", 8, "Stoch Oversold", "Stoch");
add(stochStatus === "Overbought", -8, "Stoch Overbought", "Stoch");
add(cciStatus === "Buy", 5, "CCI Buy", "CCI");
add(cciStatus === "Sell", -5, "CCI Sell", "CCI");
add(mfiStatus === "Oversold", 5, "MFI Oversold", "MFI");
add(mfiStatus === "Overbought", -5, "MFI Overbought", "MFI");

// Bollinger Bands
add(bbStatus === "Breakout Up", 10, "BB Breakout Up", "BB");
add(bbStatus === "Breakout Down", -10, "BB Breakout Down", "BB");
if (bbStatus === "Within Bands") {
    add(emaBullish, 3, "BB Normal (trending up)", "BB");
    add(emaBearish, -3, "BB Normal (trending down)", "BB");
}

// Writers Zone
const wZone = writers?.writersZone || "NEUTRAL";
const wConf = parseFloat(writers?.confidence) || 0;
const wPCR = parseFloat(writers?.putCallPremiumRatio) || 1.0;
const hasRealPCR = wPCR !== 1.0;
if (hasRealPCR && wZone !== "NEUTRAL" && wConf >= 0.3) {
    const wWeight = CONFIG.WRITERS_WEIGHT * wConf;
    if (wZone === "BULLISH") add(true, wWeight, `Writers BULLISH (PCR:${wPCR})`, "Writers");
    else if (wZone === "BEARISH") add(true, -wWeight, `Writers BEARISH (PCR:${wPCR})`, "Writers");
} else {
    const msg = (wZone === "NEUTRAL" || !hasRealPCR) ? "Neutral/No Data" : `Low Confidence (${wConf})`;
    reasons.push(`Writers: ${wZone} (${msg})`);
}

// === ADX BONUS — [FIX #8] MOVED BEFORE VOLUME so volume sees ADX-adjusted score ===
if (adxValue >= 25) {
    if (score > 0) { score += 8; reasons.push(`Strong ADX=${adxValue.toFixed(1)} (boost)`); }
    if (score < 0) { score -= 8; reasons.push(`Strong ADX=${adxValue.toFixed(1)} (boost)`); }
}
if (adxValue >= 15 && adxValue < CONFIG.ADX_TREND_THRESHOLD) {
    score = score * 0.8;
    reasons.push(`Weak ADX=${adxValue.toFixed(1)} → reduced 20%`);
}
// [FIX #2] Very low ADX — halve score regardless of price action classification
if (adxValue < CONFIG.ADX_VERY_LOW) {
    score = score * 0.5;
    reasons.push(`Very Low ADX=${adxValue.toFixed(1)} → score halved`);
}

// === VOLUME — [FIX #7] score=0 handled; runs AFTER ADX [FIX #8] ===
const volStrong = volStrength.includes("Confirmed") || volStrength === "Normal OBV";
if (volStrong && score > 0) add(true, 5, "Volume Confirms Bullish", "Volume");
if (volStrong && score < 0) add(true, -5, "Volume Confirms Bearish", "Volume");
if (volStrength === "Weak Volume") {
    if (score > 0) { score -= 5; reasons.push("Weak Volume (penalised)"); }
    else if (score < 0) { score += 5; reasons.push("Weak Volume (penalised)"); }
    else { score -= 2; reasons.push("Weak Volume (neutral penalty)"); } // [FIX #7]
}

// Candle alignment
const BULLISH_CANDLES = ["Hammer", "Morning Star", "Bullish Engulfing", "Bullish Marubozu", "Inverted Hammer"];
const BEARISH_CANDLES = ["Shooting Star", "Evening Star", "Bearish Engulfing", "Bearish Marubozu", "Hanging Man"];
let candleBoost = 0;
candlePatterns.forEach(pattern => {
    if (BULLISH_CANDLES.includes(pattern) && score > 0) { candleBoost += 8; reasons.push(`Bullish Candle: ${pattern}`); }
    else if (BEARISH_CANDLES.includes(pattern) && score < 0) { candleBoost -= 8; reasons.push(`Bearish Candle: ${pattern}`); }
});
score += candleBoost;
if (candleBoost !== 0) indicatorsUsed["Candle"] = candleBoost;

// === VOLUME RATIO — [FIX #13] null when data unavailable (not 0) ===
const volLatest = parseFloat(tech.VolumeSpike?.latestVol) || 0;
const volAvg = parseFloat(tech.VolumeSpike?.avgVol) || 1;
const volDataMissing = volLatest === 0;
const volumeRatio = volDataMissing ? null : parseFloat((volLatest / volAvg).toFixed(2));
if (volDataMissing) reasons.push("VolumeSpike data unavailable");

// === MOMENTUM — [FIX #12] MACD histogram (true momentum), not score ===
const momentumValue = Math.round(macdHist * 100) / 100;

// === STREAK CONFIRMATION ===
let currentRawSignal = "WAIT";
if (score >= CONFIG.BUY_CE_MIN_CONFIDENCE) currentRawSignal = "BUY CALL (CE)";
else if (score <= CONFIG.BUY_PE_MIN_CONFIDENCE) currentRawSignal = "BUY PUT (PE)";

if (currentRawSignal === mem.streakSignal && currentRawSignal !== "WAIT") {
    mem.streakCount = mem.streakCount + 1;
} else {
    mem.streakSignal = currentRawSignal;
    mem.streakCount = currentRawSignal === "WAIT" ? 0 : 1;
}

const streakConfirmed = mem.streakCount >= CONFIG.MIN_STREAK;

// === FINAL DECISION ===
let finalSignal = "WAIT";
let blockedReason = "";

if (currentRawSignal === "WAIT") {
    blockedReason = `Score ${score.toFixed(1)} between thresholds (${CONFIG.BUY_PE_MIN_CONFIDENCE} to ${CONFIG.BUY_CE_MIN_CONFIDENCE})`;
} else if (!streakConfirmed) {
    blockedReason = `Streak: ${mem.streakCount}/${CONFIG.MIN_STREAK} bars (building ${currentRawSignal})`;
} else if (CONFIG.REPEAT_PROTECTION && currentRawSignal === mem.lastSignal) {
    blockedReason = `Repeat protection: already fired ${mem.lastSignal}`;
} else {
    finalSignal = currentRawSignal;
}

// === SAVE STATE ===
mem.lastSignal = finalSignal !== "WAIT" ? finalSignal : mem.lastSignal;
mem.prevMACDHist = macdHist;  // [FIX #4] always reached here (non-SIDEWAYS/non-VIX path)
mem.prevLTP = ltp;
mem.lastFireTime = finalSignal !== "WAIT" ? new Date().toISOString() : mem.lastFireTime;

// === REGIME ===
let regime = "MIXED";
if (vixValue >= 18) regime = "HIGH_VOLATILITY";
else if (!isTrending && isRanging) regime = "SIDEWAYS_RANGING";
else if (!isTrending) regime = "SIDEWAYS_WEAK_TREND";
else if (superTrend === "Bullish" && emaBullish) regime = "STRONG_BULLISH";
else if (superTrend === "Bearish" && emaBearish) regime = "STRONG_BEARISH";
else if (emaBullish) regime = "BULLISH_TREND";
else if (emaBearish) regime = "BEARISH_TREND";

// === OUTPUT ===
return [{
    json: {
        finalSignal,
        rawSignal: currentRawSignal,
        confidence: Math.round(score * 100) / 100,
        Momentum: momentumValue,     // [FIX #12] MACD hist, not score
        VolumeRatio: volumeRatio,       // [FIX #13] null when unavailable
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
        EMA20: ema20Status,
        VWAP: vwapStatus,
        writersZone: wZone,
        writersConfidence: wConf,
        putCallRatio: wPCR,
        writersUsed: hasRealPCR && wZone !== "NEUTRAL" && wConf > 0.3,
        supportLevels: writers?.supportLevels || [],
        resistanceLevels: writers?.resistanceLevels || [],
        lastSignal: mem.lastSignal,
        lastFireTime: mem.lastFireTime,
        sessionDate: mem.lastTradeDate,        // [FIX #5] expose for debug
        engineVersion: "v2.2"
    }
}];
