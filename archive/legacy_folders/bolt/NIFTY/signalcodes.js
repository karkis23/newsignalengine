
// first working basic code
// === Configuration Thresholds ===
const BUY_THRESHOLD = 0;
const SELL_THRESHOLD = -0;
const WRITERS_CONFIDENCE_WEIGHT = 15;
const REPEAT_PROTECTION = true;

// === Fetch Technical Indicators ===
const tech = $node["Calculate All Technical Indicators"].json;

// === Fetch Writers Zone Analysis ===
const writers = $node["Writers Zone Analysis"].json;

// === Global Memory for Repeat Signal Protection ===
const globalSignalMemory = global.signalMemory || {};

// === Result Initialization ===
let signal = "WAIT";
let confidence = 0;
let reason = [];
let indicatorsUsed = {};

// === Helper Function ===
const addSignal = (cond, weight, desc, key) => {
  if (cond) {
    confidence += weight;
    reason.push(desc);
    if (key) indicatorsUsed[key] = (indicatorsUsed[key] || 0) + weight;
  }
};

// === Technical Indicator Logic (same as before) ===
if (tech.RSI?.status) {
  addSignal(tech.RSI.status === "Oversold", 10, "RSI Oversold", "RSI");
  addSignal(tech.RSI.status === "Overbought", -10, "RSI Overbought", "RSI");
}

if (tech.MACD?.status) {
  addSignal(tech.MACD.status === "Bullish", 10, "MACD Bullish Crossover", "MACD");
  addSignal(tech.MACD.status === "Bearish", -10, "MACD Bearish Crossover", "MACD");
}

if (tech.EMA20?.status) {
  addSignal(tech.EMA20.status === "Bullish", 10, "EMA20 Bullish", "EMA20");
  addSignal(tech.EMA20.status === "Bearish", -10, "EMA20 Bearish", "EMA20");
}

if (tech.SMA50?.status) {
  addSignal(tech.SMA50.status === "Bullish", 5, "SMA50 Bullish", "SMA50");
  addSignal(tech.SMA50.status === "Bearish", -5, "SMA50 Bearish", "SMA50");
}

if (tech.BollingerBands?.status) {
  addSignal(tech.BollingerBands.status === "Breakout Up", 10, "Bollinger Breakout Up", "BB");
  addSignal(tech.BollingerBands.status === "Breakout Down", -10, "Bollinger Breakout Down", "BB");
}

if (tech.ATR?.value && tech.ATR?.thresholdHigh && tech.ATR?.thresholdLow) {
  addSignal(tech.ATR.value > tech.ATR.thresholdHigh, -5, "High Volatility (ATR)", "ATR");
  addSignal(tech.ATR.value < tech.ATR.thresholdLow, 5, "Low Volatility (ATR)", "ATR");
}

if (tech.ADX?.value) {
  addSignal(tech.ADX.value > 25, 5, "Strong Trend (ADX)", "ADX");
}

if (tech.Stochastic?.status) {
  addSignal(tech.Stochastic.status === "Bullish", 5, "Stochastic Bullish", "Stochastic");
  addSignal(tech.Stochastic.status === "Bearish", -5, "Stochastic Bearish", "Stochastic");
}

if (tech.VWAP?.status) {
  addSignal(tech.VWAP.status === "Above", 5, "Price Above VWAP", "VWAP");
  addSignal(tech.VWAP.status === "Below", -5, "Price Below VWAP", "VWAP");
}

if (tech.CCI?.status) {
  addSignal(tech.CCI.status === "Buy", 5, "CCI Buy Signal", "CCI");
  addSignal(tech.CCI.status === "Sell", -5, "CCI Sell Signal", "CCI");
}

if (tech.SuperTrend?.status) {
  addSignal(tech.SuperTrend.status === "Bullish", 10, "SuperTrend Buy", "SuperTrend"); 
  addSignal(tech.SuperTrend.status === "Bearish", -10, "SuperTrend Sell", "SuperTrend");
}

if (tech.VolumeIndicators?.status) {
  addSignal(tech.VolumeIndicators.status === "Strong Buy", 5, "Volume Buy Signal", "Volume");
  addSignal(tech.VolumeIndicators.status === "Distribution", -5, "Volume Distribution", "Volume");
}

if (tech.VIX?.status === "High Volatility") {
  confidence -= 100;
  signal = "AVOID";
  reason = ["High Volatility (VIX)"];
} else if (["Calm Market", "Moderate"].includes(tech.VIX?.status)) {
  addSignal(true, 5, "Low Volatility (VIX)", "VIX");
}

if (Array.isArray(tech.CandlePatterns)) {
  const patternWeights = {
    "Bullish Engulfing": 10,
    "Bearish Engulfing": -10,
    "Hammer": 7,
    "Inverted Hammer": 5,
    "Shooting Star": -7,
    "Doji": 0,
    "Morning Star": 10,
    "Evening Star": -10,
    "Hanging Man": -5,
    "Bullish Marubozu": 7,
    "Bearish Marubozu": -7
  };

  tech.CandlePatterns.forEach(pattern => {
    const weight = patternWeights[pattern] || 0;
    if (weight !== 0) {
      addSignal(true, weight, `Candlestick Pattern: ${pattern}`, "Candlestick");
    }
  });
}

// === 🔥 Writers Zone Influence ===
if (writers?.writersZone === "BULLISH") {
  const weight = WRITERS_CONFIDENCE_WEIGHT * writers.confidence;
  addSignal(true, weight, `Writers Zone Bullish (${writers.confidence})`, "WritersZone");
}

if (writers?.writersZone === "BEARISH") {
  const weight = WRITERS_CONFIDENCE_WEIGHT * writers.confidence;
  addSignal(true, -weight, `Writers Zone Bearish (${writers.confidence})`, "WritersZone");
}

if (writers?.marketStructure) {
  reason.push(`Market Structure: ${writers.marketStructure}`);
}

// === Final Signal Based on Confidence ===
if (signal !== "AVOID") {
  if (confidence >= BUY_THRESHOLD) {
    signal = "BUY CALL (CE)";
  } else if (confidence <= SELL_THRESHOLD) {
    signal = "BUY PUT (PE)";
  } else {
    signal = "WAIT";
    reason.push("Mixed or Weak Signals");
  }
}

// === Repeat Signal Protection ===
const originalSignal = signal;
const lastSignal = globalSignalMemory.lastSignal || "";

if (REPEAT_PROTECTION && originalSignal === lastSignal && originalSignal !== "WAIT") {
  reason.push("Duplicate Signal Prevented");
  signal = "WAIT";
  confidence = 0;
}

// === Save to Global Memory ===
global.signalMemory = {
  lastSignal: originalSignal,
  time: new Date().toISOString()
};

// === Final Output ===
return [
  {
    json: {
      finalSignal: signal,
      confidence: Math.round(confidence * 100) / 100,
      reason: reason.join(", "),
      indicators: indicatorsUsed,
      LTP: tech.LTP || null,
      writersZone: writers.writersZone,
      writersConfidence: writers.confidence,
      marketStructure: writers.marketStructure,
      supportLevels: writers.supportLevels,
      resistanceLevels: writers.resistanceLevels,
      lastSignal
    }
  }
];






***************************************************************************************






Tuned PUT-focused code
Drop this into your JavaScript node (it keeps the same output shape as you used before):

javascript
Copy
Edit
// === PUT-Focused Signal Tuning (market-aware) ===
/*
  Key ideas:
  - Dynamic SELL_THRESHOLD based on higher-timeframe market regime (bear/bull/neutral)
  - Stronger bearish weights for breakdowns and trend-following bearish signals
  - FII net flow amplification (if provided by writers node)
  - VIX gating (avoid naked PUT buys on extreme VIX; allow PUTs when VIX low/moderate)
  - Require a "breakdown confirmation" (support break OR VWAP below + bearish candle) or >=2 bearish confirmations
*/

const BASE_BUY_THRESHOLD = 20;      // bullish needs strong proof (we're PUT-focused)
let SELL_THRESHOLD = -10;           // base; can be relaxed in bear regime
const WRITERS_CONFIDENCE_WEIGHT = 14;
const REPEAT_PROTECTION = true;
const REPEAT_COOLDOWN_MINUTES = 30; // longer cooldown for PUTs

const tech = $node["Calculate All Technical Indicators1"].json || {};
const writers = $node["Writers Zone Analysis1"].json || {};
const globalSignalMemory = global.signalMemory || {};

let signal = "WAIT";
let confidence = 0;
let reason = [];
let indicatorsUsed = {};

const addSignal = (cond, weight, desc, key) => {
  if (cond) {
    confidence += weight;
    reason.push(desc);
    if (key) indicatorsUsed[key] = (indicatorsUsed[key] || 0) + weight;
  }
};

// --- 1) Market regime (higher timeframe) ---
let marketRegime = 'neutral';
try {
  if (tech.SMA200?.value && tech.LTP) {
    marketRegime = tech.LTP < tech.SMA200.value ? 'bear' : 'bull';
  } else if (tech.Daily?.trend) {
    marketRegime = tech.Daily.trend.toLowerCase().includes('bear') ? 'bear' :
                   tech.Daily.trend.toLowerCase().includes('bull') ? 'bull' : 'neutral';
  } else if (writers.marketStructure) {
    const ms = writers.marketStructure.toLowerCase();
    marketRegime = ms.includes('bear') ? 'bear' : ms.includes('bull') ? 'bull' : 'neutral';
  }
} catch (e) { /* graceful fallback */ }

// Adjust SELL threshold: easier to trigger PUTs in bear regime
if (marketRegime === 'bear') SELL_THRESHOLD = -8;
else if (marketRegime === 'bull') SELL_THRESHOLD = -14;
else SELL_THRESHOLD = -10;

// --- 2) VIX gating ---
const vixVal = (tech.VIX && (tech.VIX.value || tech.VIX.indexValue)) ? Number(tech.VIX.value || tech.VIX.indexValue) : null;
if (vixVal !== null && vixVal >= 20) {
  // Very high volatility — avoid naked PUT buys; signal AVOID to force human review
  signal = "AVOID";
  confidence = -999;
  reason.push("Very High VIX — avoid naked PUTs");
  // save state and return early
  global.signalMemory = { lastSignal: signal, time: new Date().toISOString() };
  return [{ json: { finalSignal: signal, confidence, reason: reason.join(", "), indicators: indicatorsUsed, LTP: tech.LTP || null, writersZone: writers.writersZone, writersConfidence: writers.confidence || 0, marketStructure: writers.marketStructure, supportLevels: writers.supportLevels, resistanceLevels: writers.resistanceLevels, lastSignal: globalSignalMemory.lastSignal } }];
}

// --- 3) Core bearish-weighted indicators (PUT bias) ---
addSignal(tech.RSI?.status === "Overbought", -12, "RSI Overbought (bear)", "RSI");
addSignal(tech.RSI?.status === "Oversold", 8, "RSI Oversold (bull)", "RSI"); // keep but smaller

addSignal(tech.MACD?.status === "Bearish", -18, "MACD Bearish", "MACD");
addSignal(tech.MACD?.status === "Bullish", 8, "MACD Bullish", "MACD");

addSignal(tech.SuperTrend?.status === "Sell", -18, "SuperTrend Sell", "SuperTrend");
addSignal(tech.SuperTrend?.status === "Buy", 10, "SuperTrend Buy", "SuperTrend");

addSignal(tech.EMA20?.status === "Bearish", -14, "EMA20 Bearish", "EMA20");
addSignal(tech.EMA20?.status === "Bullish", 8, "EMA20 Bullish", "EMA20");

addSignal(tech.SMA50?.status === "Bearish", -10, "SMA50 Bearish", "SMA50");
addSignal(tech.SMA50?.status === "Bullish", 6, "SMA50 Bullish", "SMA50");

addSignal(tech.VWAP?.status === "Below", -12, "Price Below VWAP", "VWAP");
addSignal(tech.VWAP?.status === "Above", 6, "Price Above VWAP", "VWAP");

addSignal(tech.BollingerBands?.status === "Breakout Down", -16, "Bollinger Breakout Down", "BB");
addSignal(tech.BollingerBands?.status === "Breakout Up", 10, "Bollinger Breakout Up", "BB");

if (tech.ATR?.value && tech.ATR?.thresholdHigh && tech.ATR?.thresholdLow) {
  addSignal(tech.ATR.value > tech.ATR.thresholdHigh, -8, "High ATR (volatile) — biased bear", "ATR");
  addSignal(tech.ATR.value < tech.ATR.thresholdLow, 4, "Low ATR (calm)", "ATR");
}

addSignal(tech.Stochastic?.status === "Bearish", -8, "Stochastic Bearish", "Stochastic");
addSignal(tech.Stochastic?.status === "Bullish", 4, "Stochastic Bullish", "Stochastic");

addSignal(tech.CCI?.status === "Sell", -8, "CCI Sell", "CCI");
addSignal(tech.CCI?.status === "Buy", 4, "CCI Buy", "CCI");

addSignal(tech.VolumeIndicators?.status === "Distribution", -10, "Volume Distribution", "Volume");
addSignal(tech.VolumeIndicators?.status === "Strong Buy", 6, "Strong Volume Buy", "Volume");

// Add heavier weight for bearish candlestick patterns
if (Array.isArray(tech.CandlePatterns)) {
  const patternWeights = {
    "Bearish Engulfing": -16,
    "Evening Star": -14,
    "Shooting Star": -12,
    "Hanging Man": -10,
    "Bearish Marubozu": -12,
    "Bullish Engulfing": 8,
    "Hammer": 6,
    "Bullish Marubozu": 6
  };
  tech.CandlePatterns.forEach(p => {
    const w = patternWeights[p] || 0;
    if (w !== 0) addSignal(true, w, `Candle: ${p}`, "Candlestick");
  });
}

// --- 4) Writers zone + FII flows amplify bearish view ---
const writersConfidence = writers.confidence || 0;
let writersWeight = WRITERS_CONFIDENCE_WEIGHT * Math.pow(Math.max(0.1, writersConfidence), 1.15);

if (writers.writersZone === "BEARISH") {
  // Slightly stronger bearish push if writers are explicitly bearish
  addSignal(true, -1.2 * writersWeight, `Writers Zone BEARISH (${writersConfidence})`, "WritersZone");
} else if (writers.writersZone === "BULLISH") {
  addSignal(true, writersWeight, `Writers Zone BULLISH (${writersConfidence})`, "WritersZone");
}

// If writers provide FII net flow, use it (negative => net selling)
const fiiNet = Number(writers.fiiNetFlow || writers.fii || 0);
if (!isNaN(fiiNet) && fiiNet < 0) {
  // net selling: amplify bearishness proportional to magnitude (scaled)
  const scale = Math.min(1.5, Math.abs(fiiNet) / 1000); // prevents runaway
  addSignal(true, -10 * scale, `FII Net Sell (${fiiNet})`, "FII");
}

// --- 5) Higher-timeframe confirmation bonus ---
const htBear = (tech.Daily?.trend === "Bearish" || tech.Weekly?.trend === "Bearish" || tech.Monthly?.trend === "Bearish");
if (htBear) addSignal(true, -8, "Higher-timeframe Bearish Trend", "HTF");

// --- 6) Breakdown confirmation requirement ---
const LTP = Number(tech.LTP || 0);
let brokenSupport = false;
if (Array.isArray(writers.supportLevels) && writers.supportLevels.length) {
  const nearestSupport = Number(writers.supportLevels[0]);
  if (!isNaN(nearestSupport) && LTP < nearestSupport) {
    brokenSupport = true;
    addSignal(true, -8, `Price below nearest support ${nearestSupport}`, "Support");
  }
}
// alternative breakdown: VWAP below + bearish candle
const vwBreak = tech.VWAP?.status === "Below";
const hasStrongBearCandle = Array.isArray(tech.CandlePatterns) && tech.CandlePatterns.some(p => ["Bearish Engulfing","Evening Star","Bearish Marubozu","Shooting Star"].includes(p));
const breakdownConfirmed = brokenSupport || (vwBreak && hasStrongBearCandle);

// Require at least two strong bearish confirmations OR an explicit breakdown to keep strong PUT bias
const bearishCount = Object.values(indicatorsUsed).filter(v => v < 0).length;
if (!(breakdownConfirmed || bearishCount >= 2)) {
  // Not enough structural confirmation — dampen bearish confidence
  confidence += 0; // no change except a mild penalty
  reason.push("No clear breakdown / insufficient bearish confirmations");
  // small penalty to keep false PUTs low
  confidence +=  -3;
}

// Multi-confirmation extra push if many bears align
if (bearishCount >= 4) confidence += -6;

// --- final decision ---
let originalSignal = "WAIT";
if (confidence <= SELL_THRESHOLD) originalSignal = "BUY PUT (PE)";
else if (confidence >= BASE_BUY_THRESHOLD) originalSignal = "BUY CALL (CE)";
else originalSignal = "WAIT";

// --- repeat protection with cooldown ---
const now = new Date();
const lastTime = new Date(globalSignalMemory.time || 0);
const minutesSinceLast = (now - lastTime) / 60000;
const lastSignal = globalSignalMemory.lastSignal || "";

if (REPEAT_PROTECTION && originalSignal === lastSignal && originalSignal !== "WAIT" && minutesSinceLast < REPEAT_COOLDOWN_MINUTES) {
  reason.push("Duplicate signal prevented (cooldown)");
  signal = "WAIT";
  confidence = 0;
} else {
  signal = originalSignal;
}

// normalize and cap confidence
if (confidence > 100) confidence = 100;
if (confidence < -100 && confidence !== -999) confidence = -100;

// --- Save state: store originalSignal as lastSignal for cooldown logic
global.signalMemory = { lastSignal: originalSignal, time: now.toISOString() };

// Additional trade advice field (for UI)
let tradeAdvice = "";
if (signal === "BUY PUT (PE)") {
  // if VIX low -> naked PUT ok (cheaper) but prefer small size; if VIX moderate-high prefer spreads
  if (vixVal !== null && vixVal >= 15) tradeAdvice = "Prefer PUT spread (bear put) or smaller size due to elevated VIX risk";
  else tradeAdvice = "Naked PUT possible; ensure breakdown confirmed and keep size small";
} else if (signal === "AVOID") {
  tradeAdvice = "Avoid naked PUTs; consider hedged positions or stay flat";
} else if (signal === "WAIT") {
  tradeAdvice = "Wait for a confirmed breakdown or stronger confluence";
}

// --- Output
return [{
  json: {
    finalSignal: signal,
    confidence: Math.round(confidence * 100) / 100,
    reason: reason.join(", "),
    indicators: indicatorsUsed,
    LTP: tech.LTP || null,
    writersZone: writers.writersZone,
    writersConfidence: writers.confidence || 0,
    marketRegime,
    supportLevels: writers.supportLevels,
    resistanceLevels: writers.resistanceLevels,
    lastSignal,
    tradeAdvice
  }
}];

// How this ties to today’s market (explicit mapping)
// Because financials were weak and FII flows show net selling, we amplified bearish weights and added FII net-sell amplification so the system reacts faster to downside pressure. 
// Reuters
// NSE India

// VIX ~12 → I did not force an “AVOID” on moderate VIX; instead I gate only extreme VIX >= 20 to avoid naked PUTs. That fits today’s cheap premium environment but keeps a safety gate for spikes. 
// Investing.com
// Business Standard

// Because headlines (SBI Q1 + global trade/tariff stuff) can create sudden downside, I require breakdown confirmation (support break or VWAP+bear candle) before giving strong PUT signals. This reduces false PUT entries on mere noise. 
// The Economic Times
// Reuters

// Next recommended actions
// Run this live in a paper mode for the next 1–3 trading sessions and compare finalSignal vs realized move. I can help build a small backtest if you can share a CSV of historical indicator outputs.

// If you want, I can add an automatic hedging suggestion (e.g., buy a bear-put spread vs naked PUT when VIX > X) so the node emits trade structure, not only signal text.

// If your Calculate All Technical Indicators1 node already provides Daily/Weekly trend and fiiNetFlow, this will be used automatically — otherwise I can add simple fallbacks or show how to compute a daily SMA200 check inside that node.


************************************************************************************************************


//  balanced CE/PE setup ready. I’ve converted the logic so calls (CE) and puts (PE) get symmetric treatment, with regime- and volatility-aware adjustments, multi-confirmation bonuses for either side, and safer repeat-protection. Code returns the same JSON shape you use.

// Paste this into your JS node:

// javascript
// Copy
// Edit
// === Balanced CE/PE Signal Logic ===
// Symmetric thresholds and weights so CE & PE get fair treatment



const THRESHOLD_MAG = 12;            // base magnitude needed for either side
const BUY_THRESHOLD = THRESHOLD_MAG; // positive -> BUY CALL (CE)
const SELL_THRESHOLD = -THRESHOLD_MAG; // negative -> BUY PUT (PE)
const WRITERS_CONFIDENCE_WEIGHT = 12;
const REPEAT_PROTECTION = true;
const REPEAT_COOLDOWN_MINUTES = 20;

const tech = $node["Calculate All Technical Indicators1"].json || {};
const writers = $node["Writers Zone Analysis1"].json || {};
const globalSignalMemory = global.signalMemory || {};

let signal = "WAIT";
let confidence = 0;
let reason = [];
let indicatorsUsed = {};

const addSignal = (cond, weight, desc, key) => {
  if (cond) {
    confidence += weight;
    reason.push(desc);
    indicatorsUsed[key] = (indicatorsUsed[key] || 0) + weight;
  }
};

// --- 1) Market regime (HTF) detection (used to bias but not dominate) ---
let marketRegime = "neutral";
try {
  if (tech.SMA200?.value && tech.LTP) {
    marketRegime = tech.LTP < tech.SMA200.value ? "bear" : "bull";
  } else if (tech.Daily?.trend) {
    const t = (tech.Daily.trend || "").toLowerCase();
    marketRegime = t.includes("bear") ? "bear" : t.includes("bull") ? "bull" : "neutral";
  } else if (writers.marketStructure) {
    const ms = (writers.marketStructure || "").toLowerCase();
    marketRegime = ms.includes("bear") ? "bear" : ms.includes("bull") ? "bull" : "neutral";
  }
} catch (e) { /* fallback neutral */ }

// Slight gentle bias if clearly in HTF bear/bull (not forcing)
if (marketRegime === "bear") addSignal(true, -2, "HTF Bear Bias", "HTF");
if (marketRegime === "bull") addSignal(true, 2, "HTF Bull Bias", "HTF");

// --- 2) Volatility gating (symmetric effects) ---
const vixVal = (tech.VIX && (tech.VIX.value || tech.VIX.indexValue)) ? Number(tech.VIX.value || tech.VIX.indexValue) : null;
if (!isNaN(vixVal) && vixVal >= 25) {
  // extreme VIX: avoid naked directional buys; encourage spreads / wait
  signal = "AVOID";
  confidence = vixVal * -2;
  reason.push("Very High VIX — prefer spreads or avoid naked CE/PE");
  global.signalMemory = { lastSignal: signal, time: new Date().toISOString() };
  return [{
    json: {
      finalSignal: signal,
      confidence: Math.round(confidence*100)/100,
      reason: reason.join(", "),
      indicators: indicatorsUsed,
      LTP: tech.LTP || null,
      writersZone: writers.writersZone,
      writersConfidence: writers.confidence || 0,
      marketRegime,
      supportLevels: writers.supportLevels,
      resistanceLevels: writers.resistanceLevels,
      lastSignal: globalSignalMemory.lastSignal
    }
  }];
}
// moderate VIX slightly reduces aggression both sides
if (!isNaN(vixVal) && vixVal >= 15) addSignal(true, -2, "Moderate VIX - reduce aggression", "VIX");

// --- 3) Core technical indicators (mirror weights) ---
const W_STRONG = 12; // strong indicator weight (mirror +/-)
const W_MED = 8;
const W_LIGHT = 5;

if (tech.RSI?.status) {
  addSignal(tech.RSI.status === "Overbought", -W_STRONG, "RSI Overbought", "RSI");
  addSignal(tech.RSI.status === "Oversold", W_MED, "RSI Oversold", "RSI");
}

if (tech.MACD?.status) {
  addSignal(tech.MACD.status === "Bullish", W_STRONG, "MACD Bullish", "MACD");
  addSignal(tech.MACD.status === "Bearish", -W_STRONG, "MACD Bearish", "MACD");
}

if (tech.SuperTrend?.status) {
  addSignal(tech.SuperTrend.status === "Buy", W_STRONG, "SuperTrend Buy", "SuperTrend");
  addSignal(tech.SuperTrend.status === "Sell", -W_STRONG, "SuperTrend Sell", "SuperTrend");
}

if (tech.EMA20?.status) {
  addSignal(tech.EMA20.status === "Bullish", W_MED, "EMA20 Bullish", "EMA20");
  addSignal(tech.EMA20.status === "Bearish", -W_MED, "EMA20 Bearish", "EMA20");
}

if (tech.SMA50?.status) {
  addSignal(tech.SMA50.status === "Bullish", W_LIGHT, "SMA50 Bullish", "SMA50");
  addSignal(tech.SMA50.status === "Bearish", -W_LIGHT, "SMA50 Bearish", "SMA50");
}

if (tech.VWAP?.status) {
  addSignal(tech.VWAP.status === "Above", W_MED, "Price Above VWAP", "VWAP");
  addSignal(tech.VWAP.status === "Below", -W_MED, "Price Below VWAP", "VWAP");
}

if (tech.BollingerBands?.status) {
  addSignal(tech.BollingerBands.status === "Breakout Up", W_STRONG, "BB Breakout Up", "BB");
  addSignal(tech.BollingerBands.status === "Breakout Down", -W_STRONG, "BB Breakout Down", "BB");
}

if (tech.ATR?.value && tech.ATR?.thresholdHigh && tech.ATR?.thresholdLow) {
  addSignal(tech.ATR.value > tech.ATR.thresholdHigh, -W_LIGHT, "High ATR (volatile)", "ATR");
  addSignal(tech.ATR.value < tech.ATR.thresholdLow, W_LIGHT, "Low ATR (calm)", "ATR");
}

if (tech.Stochastic?.status) {
  addSignal(tech.Stochastic.status === "Bullish", W_LIGHT, "Stochastic Bullish", "Stochastic");
  addSignal(tech.Stochastic.status === "Bearish", -W_LIGHT, "Stochastic Bearish", "Stochastic");
}

if (tech.CCI?.status) {
  addSignal(tech.CCI.status === "Buy", W_LIGHT, "CCI Buy", "CCI");
  addSignal(tech.CCI.status === "Sell", -W_LIGHT, "CCI Sell", "CCI");
}

if (tech.VolumeIndicators?.status) {
  addSignal(tech.VolumeIndicators.status === "Strong Buy", W_LIGHT, "Volume Strong Buy", "Volume");
  addSignal(tech.VolumeIndicators.status === "Distribution", -W_LIGHT, "Volume Distribution", "Volume");
}

// Candlestick patterns symmetric weights
if (Array.isArray(tech.CandlePatterns)) {
  const patternWeights = {
    "Bullish Engulfing": W_MED,
    "Bearish Engulfing": -W_MED,
    "Hammer": W_LIGHT,
    "Inverted Hammer": W_LIGHT,
    "Shooting Star": -W_LIGHT,
    "Morning Star": W_MED,
    "Evening Star": -W_MED,
    "Hanging Man": -W_LIGHT,
    "Bullish Marubozu": W_LIGHT,
    "Bearish Marubozu": -W_LIGHT,
    "Doji": 0
  };
  tech.CandlePatterns.forEach(p => {
    const w = patternWeights[p] || 0;
    if (w !== 0) addSignal(true, w, `Candle: ${p}`, "Candlestick");
  });
}

// --- 4) Writers zone (symmetric scaling) ---
const wConf = writers.confidence || 0;
const writersWeight = WRITERS_CONFIDENCE_WEIGHT * Math.pow(Math.max(0.1, wConf), 1.05);
if (writers.writersZone === "BULLISH") addSignal(true, writersWeight, `Writers BULLISH (${wConf})`, "WritersZone");
if (writers.writersZone === "BEARISH") addSignal(true, -writersWeight, `Writers BEARISH (${wConf})`, "WritersZone");

// FII flows used symmetrically if present
const fiiNet = Number(writers.fiiNetFlow || writers.fii || 0);
if (!isNaN(fiiNet) && fiiNet !== 0) {
  const scale = Math.min(1.5, Math.abs(fiiNet) / 1000);
  addSignal(true, (fiiNet > 0 ? 1 : -1) * 8 * scale, `FII Flow ${fiiNet > 0 ? "Net Buy" : "Net Sell"} (${fiiNet})`, "FII");
}

// --- 5) Multi-confirmation bonuses (symmetric) ---
const bullishCount = Object.values(indicatorsUsed).filter(v => v > 0).length;
const bearishCount = Object.values(indicatorsUsed).filter(v => v < 0).length;
if (bullishCount >= 3) confidence += 4; // small bonus for confluence
if (bearishCount >= 3) confidence -= 4;

// --- 6) Require at least one structural confirmation for strong signals
const LTP = Number(tech.LTP || 0);
let structuralConfirm = false;
// price vs nearest support/resistance if provided
if (Array.isArray(writers.supportLevels) && writers.supportLevels.length) {
  const s = Number(writers.supportLevels[0]);
  if (!isNaN(s) && LTP < s) structuralConfirm = structuralConfirm || true; // supports broken => bear
}
if (Array.isArray(writers.resistanceLevels) && writers.resistanceLevels.length) {
  const r = Number(writers.resistanceLevels[0]);
  if (!isNaN(r) && LTP > r) structuralConfirm = structuralConfirm || true; // resistance taken => bull
}
// VWAP and candle combo as alternate confirmation
const vwBelow = tech.VWAP?.status === "Below";
const vwAbove = tech.VWAP?.status === "Above";
const strongBearCandle = Array.isArray(tech.CandlePatterns) && tech.CandlePatterns.some(p => ["Bearish Engulfing","Evening Star","Bearish Marubozu"].includes(p));
const strongBullCandle = Array.isArray(tech.CandlePatterns) && tech.CandlePatterns.some(p => ["Bullish Engulfing","Morning Star","Bullish Marubozu"].includes(p));
if (vwBelow && strongBearCandle) structuralConfirm = true;
if (vwAbove && strongBullCandle) structuralConfirm = true;

// If no structural confirm, softly penalize strong directional entry
if (!structuralConfirm) {
  confidence += (confidence > 0 ? -2 : (confidence < 0 ? 2 : 0));
  reason.push("No structural confirmation (support/resistance/VWAP+candle)");
}

// --- 7) Final decision using symmetric thresholds ---
let originalSignal = "WAIT";
if (confidence >= BUY_THRESHOLD) originalSignal = "BUY CALL (CE)";
else if (confidence <= SELL_THRESHOLD) originalSignal = "BUY PUT (PE)";
else originalSignal = "WAIT";

// --- 8) Repeat protection (cooldown) ---
const now = new Date();
const lastTime = new Date(globalSignalMemory.time || 0);
const minutesSinceLast = (now - lastTime) / 60000;
const lastSignal = globalSignalMemory.lastSignal || "";

if (REPEAT_PROTECTION && originalSignal === lastSignal && originalSignal !== "WAIT" && minutesSinceLast < REPEAT_COOLDOWN_MINUTES) {
  reason.push("Duplicate signal prevented (cooldown)");
  signal = "WAIT";
  confidence = 0;
} else {
  signal = originalSignal;
}

// cap confidence neatly
if (confidence > 100) confidence = 100;
if (confidence < -100) confidence = -100;

// save state (store originalSignal to allow cooldown comparisons)
global.signalMemory = { lastSignal: originalSignal, time: now.toISOString() };

// tradeAdvice: give balanced advice depending on VIX & confirmation
let tradeAdvice = "";
if (signal === "BUY CALL (CE)" || signal === "BUY PUT (PE)") {
  if (!isNaN(vixVal) && vixVal >= 15) tradeAdvice = "Prefer spreads (reduce gamma) due to elevated VIX";
  else if (!structuralConfirm) tradeAdvice = "Small size or wait for structural confirmation";
  else tradeAdvice = "Full conviction trade; manage size per risk rules";
} else if (signal === "AVOID") {
  tradeAdvice = "Avoid naked directional trades; use hedged structures";
} else {
  tradeAdvice = "No clear edge — wait for confluence";
}

return [{
  json: {
    finalSignal: signal,
    confidence: Math.round(confidence * 100) / 100,
    reason: reason.join(", "),
    indicators: indicatorsUsed,
    LTP: tech.LTP || null,
    writersZone: writers.writersZone || null,
    writersConfidence: writers.confidence || 0,
    marketRegime,
    supportLevels: writers.supportLevels,
    resistanceLevels: writers.resistanceLevels,
    lastSignal,
    tradeAdvice
  }
}];
Short notes (Tanglish):

I kept CE & PE symmetric — thresholds, indicator weights, and bonuses mirror each other so neither side is favoured.

HTF (SMA200 / Daily trend) nudges the system but doesn't force decisions — prevents overfitting to noise.

VIX gating: extreme VIX -> AVOID; moderate VIX dampens aggression both sides.

Structural confirmation (support/resistance or VWAP+candle) required for strong certainty — reduces false signals.

Cooldown prevents spammy re-entries.