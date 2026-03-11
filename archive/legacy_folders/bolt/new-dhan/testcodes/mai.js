// ✅ Sample Input Data (Mock)
function main(){


const ohlcData = [
  { open: "19850", high: "19880", low: "19840", close: "19860", volume: "120000" },
  { open: "19860", high: "19870", low: "19830", close: "19835", volume: "100000" },
  { open: "19835", high: "19845", low: "19820", close: "19840", volume: "110000" },
  { open: "19840", high: "19870", low: "19835", close: "19865", volume: "130000" },
  { open: "19865", high: "19890", low: "19860", close: "19888", volume: "125000" },
  { open: "19888", high: "19890", low: "19855", close: "19858", volume: "90000" },
  { open: "19858", high: "19860", low: "19850", close: "19855", volume: "85000" },
  { open: "19855", high: "19870", low: "19820", close: "19825", volume: "140000" },
  { open: "19825", high: "19830", low: "19790", close: "19800", volume: "160000" },
  { open: "19800", high: "19805", low: "19785", close: "19790", volume: "110000" },
  { open: "19790", high: "19850", low: "19770", close: "19840", volume: "150000" },
  { open: "19840", high: "19842", low: "19810", close: "19820", volume: "90000" }
];

const currentPrice = parseFloat("19820");
const vix = parseFloat("14.25");
const sentiment = "BULLISH";

// ✅ Technical Indicator Calculations

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const delta = prices[i] - prices[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }
  return losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(prices.slice(-26), 12);
  const ema26 = calculateEMA(prices.slice(-26), 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([macd], 9);
  return { macd, signal, histogram: macd - signal };
}

function calculateMomentum(prices, period = 10) {
  if (prices.length < period) return 0;
  const current = prices.at(-1);
  const previous = prices.at(-period);
  return previous ? ((current - previous) / previous) * 100 : 0;
}

function calculateVolumeRatio(data, period = 20) {
  if (data.length < period) return 1.0;
  const currentVolume = parseFloat(data.at(-1).volume || 0);
  const avgVolume = data.slice(-period).reduce((sum, d) => sum + parseFloat(d.volume || 0), 0) / period;
  return avgVolume > 0 ? currentVolume / avgVolume : 1.0;
}

// ✅ Candle Pattern Detection
function detectCandlePattern(candle, prev = null, prev2 = null) {
  if (!candle || !candle.open || !candle.high || !candle.low || !candle.close) return "NORMAL";

  const o = parseFloat(candle.open), c = parseFloat(candle.close);
  const h = parseFloat(candle.high), l = parseFloat(candle.low);
  const body = Math.abs(c - o), range = h - l;
  const upper = h - Math.max(o, c), lower = Math.min(o, c) - l;
  const isBull = c > o, isBear = c < o;

  const bodyRatio = body / range;
  const upperRatio = upper / body;
  const lowerRatio = lower / body;

  if (range === 0) return "NORMAL";
  if (bodyRatio < 0.1) return "DOJI";
  if (lowerRatio > 2 && upperRatio < 0.5) return "HAMMER";
  if (upperRatio > 2 && lowerRatio < 0.5) return "SHOOTING_STAR";
  if (upper < range * 0.05 && lower < range * 0.05) return "MARUBOZU";
  if (bodyRatio < 0.25 && upperRatio > 1 && lowerRatio > 1) return "SPINNING_TOP";
  if (upperRatio > 4 && bodyRatio < 0.15) return "GRAVESTONE_DOJI";
  if (lowerRatio > 4 && bodyRatio < 0.15) return "DRAGONFLY_DOJI";
  if (lower > 2 * body && upper < body) return "INVERTED_HAMMER";
  if (upper > 2 * body && lower < body) return "LONG_UPPER_WICK";

  if (prev) {
    const pO = parseFloat(prev.open), pC = parseFloat(prev.close);
    const isPBull = pC > pO, isPBear = pC < pO;
    const pH = parseFloat(prev.high), pL = parseFloat(prev.low);

    if (isBear && isPBull && o > pC && c < pO) return "BEARISH_ENGULFING";
    if (isBull && isPBear && o < pC && c > pO) return "BULLISH_ENGULFING";
    if (h < pH && l > pL) return "INSIDE_BAR";
    if (h > pH && l < pL) return "OUTSIDE_BAR";

    if (prev2) {
      const p2O = parseFloat(prev2.open), p2C = parseFloat(prev2.close);
      const isP2Bear = p2C < p2O;
      const isP2Bull = p2C > p2O;
      const p2Body = Math.abs(p2C - p2O);
      const p1Body = Math.abs(pC - pO);

      if (isP2Bear && p1Body < p2Body * 0.5 && isBull && c > ((p2O + p2C) / 2)) return "MORNING_STAR";
      if (isP2Bull && p1Body < p2Body * 0.5 && isBear && c < ((p2O + p2C) / 2)) return "EVENING_STAR";
    }
  }

  return "NORMAL";
}

// ✅ Market Strength Logic
function analyzeMarket(rsi, macd, momentum, volumeRatio, vix) {
  let strength = 0, signals = [];

  if (rsi < 35) { strength += 2; signals.push("NIFTY_RSI_OVERSOLD"); }
  else if (rsi > 65) { strength -= 2; signals.push("NIFTY_RSI_OVERBOUGHT"); }

  if (macd.macd > 0 && macd.histogram > 0) { strength += 1.5; signals.push("NIFTY_MACD_BULLISH"); }
  else if (macd.macd < 0 && macd.histogram < 0) { strength -= 1.5; signals.push("NIFTY_MACD_BEARISH"); }

  if (momentum > 1.5) { strength += 1; signals.push("NIFTY_MOMENTUM_BULLISH"); }
  else if (momentum < -1.5) { strength -= 1; signals.push("NIFTY_MOMENTUM_BEARISH"); }

  if (volumeRatio > 1.3) { strength += 0.5; signals.push("NIFTY_VOLUME_SURGE"); }

  if (vix > 20) { strength *= 0.8; signals.push("HIGH_VIX_CAUTION"); }

  return { strength, signals };
}

// ✅ Run All
const closePrices = ohlcData.map(d => parseFloat(d.close)).filter(n => !isNaN(n));
const last = ohlcData.at(-1), prev = ohlcData.at(-2), prev2 = ohlcData.at(-3);

const rsi = calculateRSI(closePrices);
const macd = calculateMACD(closePrices);
const momentum = calculateMomentum(closePrices);
const volumeRatio = calculateVolumeRatio(ohlcData);
const candlePattern = detectCandlePattern(last, prev, prev2);
const market = analyzeMarket(rsi, macd, momentum, volumeRatio, vix);

// ✅ Final Output
const indicators = {
  rsi: +rsi.toFixed(2),
  macd: {
    macd: +macd.macd.toFixed(2),
    signal: +macd.signal.toFixed(2),
    histogram: +macd.histogram.toFixed(2)
  },
  momentum: +momentum.toFixed(2),
  volumeRatio: +volumeRatio.toFixed(2),
  spotPrice: currentPrice,
  vix: +vix.toFixed(2),
  sentiment: sentiment.toUpperCase(),
  candlePattern,
  underlying: "NIFTY",
  marketStrength: +market.strength.toFixed(2),
  detectedSignals: market.signals,
  signalCount: market.signals.length,
  volatilityRegime: vix > 20 ? "HIGH" : vix > 15 ? "MEDIUM" : "LOW",
  trendDirection: market.strength > 1 ? "BULLISH" : market.strength < -1 ? "BEARISH" : "SIDEWAYS",
  timestamp: new Date().toISOString(),
  dataPoints: closePrices.length,
  priceChange: closePrices.length > 1 ? +(((closePrices.at(-1) - closePrices.at(-2)) / closePrices.at(-2)) * 100).toFixed(2) : 0
};

return { indicators };
}


console.log( main());
