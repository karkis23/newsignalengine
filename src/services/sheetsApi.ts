// ============================================================
// GOOGLE SHEETS API SERVICE
// Reads live data from your actual trading Google Sheet
// Sheet ID: 1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU
//
// Uses public CSV export — to enable:
//   1. Open your Google Sheet
//   2. File → Share → Change to "Anyone with the link can VIEW"
//   3. Done. No API key needed.
// ============================================================

import axios from 'axios';

// Your Google Sheet ID (Dhan Signal Sheet)
const SHEET_ID = '1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU';

// Sheet GIDs from your workflow
const GID = {
    signals: 0,                 // Dhan_Signals (Same for both usually)
    activeTrades: 773018112,    // Dhan_Active_Trades
    tradeSummary: 2086062684,   // Dhan_Trade_Summary
};

// TradingView scanner for live prices
const TV_SCANNER = 'https://scanner.tradingview.com/india/scan';

// ============================================================
// Timestamp Parser
// Sheet stores dates as: "26/2/2026, 6:39:48 pm"  (Indian locale)
// new Date() cannot parse this → "Invalid Date" everywhere
// ============================================================
function parseSheetTimestamp(raw: string): string {
    if (!raw) return '';
    try {
        // Already ISO format
        if (raw.includes('T') && raw.includes('-')) return raw;

        // "26/2/2026, 6:39:48 pm"
        const match = raw.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)$/i
        );
        if (match) {
            const [, dd, mm, yyyy, hRaw, min, sec, ampm] = match;
            let hour = parseInt(hRaw);
            if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
            if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
            return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${min}:${sec}+05:30`;
        }
        return raw;
    } catch {
        return raw;
    }
}

// ============================================================
// CSV Parsing — handles quoted fields with commas inside
// e.g. "26/2/2026, 6:39:48 pm" is a single quoted field
// ============================================================
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim().replace(/\r/g, ''));
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim().replace(/\r/g, ''));
    return result;
}

function parseCSV(csv: string): Record<string, string>[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1)
        .map(line => {
            const values = parseCSVLine(line);
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
            return row;
        })
        .filter(row => Object.values(row).some(v => v !== ''));
}

// ============================================================
// Fetch a sheet as CSV
// ============================================================
async function fetchSheet(gid: number, sheetId = SHEET_ID): Promise<Record<string, string>[]> {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const { data } = await axios.get<string>(url, {
        timeout: 10000,
        headers: { 'Accept': 'text/csv' }
    });
    return parseCSV(data);
}

// ============================================================
// SIGNALS — Dhan_Signals sheet
// Real columns (verified from CSV):
//   Timestamp, Signal, Confidence, rawSignal, ADX, Regime,
//   blockedReason, streakCount, MACDFlip, SuperTrend, RSI,
//   MACD, Momentum, Volume Ratio, VIX, Sentiment,
//   Writers Zone, Candle Pattern, Spot Price, Market Strength,
//   Put Call Premium Ratio, Writers Confidence, ATM Strike,
//   gammaExposure, ivSkew, aiInsights, engineVersion, engineMode
// ============================================================
export interface LiveSignal {
    id: string;
    timestamp: string;
    finalSignal: string;
    confidence: number;
    rsi: number;
    macd: number;
    momentum: number;
    volumeRatio: number;
    vix: number;
    sentiment: string;
    writersZone: string;
    writersConfidence: number;
    spotPrice: number;
    marketStrength: string;
    atmStrike: number;
    putCallRatio: number;
    candlePattern: string;
    reason: string;
    regime: string;
    adx: number;
    rawSignal: string;
    streakCount: number;
    macdFlip: string;
    blockedReason: string;
    engineVersion: string;
    engineMode: string;
    aiInsights: string;
    gammaExposure: number;
    ivSkew: number;
    superTrend: string;
    // New fields for v4.2.0 Deep Data
    priceActionScore: number;
    pocDistance: number;
    volatilityATR: number;
    sessionProgress: number;
}

export async function fetchSignals(limit = 5000): Promise<LiveSignal[]> {
    const rows = await fetchSheet(GID.signals);
    return rows.map((r, i) => {
        const ts = parseSheetTimestamp(r['Timestamp'] || '');
        return {
            id: `sig_${i}_${ts}`,
            timestamp: ts,
            finalSignal: r['Signal'] || 'WAIT',
            confidence: parseFloat(r['Confidence']) || 0,
            rsi: parseFloat(r['RSI']) || 0,
            macd: parseFloat(r['MACD']) || 0,
            momentum: parseFloat(r['Momentum']) || 0,
            volumeRatio: parseFloat(r['Volume Ratio']) || 0,
            vix: parseFloat(r['VIX']) || 0,
            sentiment: r['Sentiment'] || r['Regime'] || '',
            writersZone: (r['Writers Zone'] || 'NEUTRAL').trim().toUpperCase(),
            writersConfidence: parseFloat(r['Writers Confidence']) || 0,
            spotPrice: parseFloat(r['Spot Price']) || 0,
            marketStrength: r['Market Structure'] || r['Market Strength'] || '',
            atmStrike: parseFloat(r['ATM Strike']) || 0,
            putCallRatio: parseFloat(r['Put Call Ratio / PCR']) || parseFloat(r['Put Call Ratio']) || 1,
            candlePattern: r['Candle Pattern'] || '',
            reason: r['Reason'] || '',
            regime: r['Regime'] || '',
            adx: parseFloat(r['ADX']) || 0,
            rawSignal: r['rawSignal'] || '',
            streakCount: parseInt(r['StreakCount'] || r['streakCount']) || 0,
            macdFlip: r['MACDFlip'] || r['macdFlip'] || '',
            blockedReason: r['BlockedReason'] || r['blockedReason'] || '',
            engineVersion: r['engineVersion'] || r['Engine Version'] || 'v3.0',
            engineMode: r['engineMode'] || r['Engine Mode'] || 'RULES_FALLBACK',
            aiInsights: r['aiInsights'] || r['AI Insights'] || '',
            gammaExposure: parseFloat(r['gammaExposure'] || r['GEX']) || 0,
            ivSkew: parseFloat(r['ivSkew'] || r['IV Skew']) || 0,
            superTrend: r['SuperTrend'] || r['superTrend'] || '',
            // v4.2.0 Deep Data mapping
            priceActionScore: parseFloat(r['priceActionScore'] || r['PA Score']) || 0,
            pocDistance: parseFloat(r['pocDistance'] || r['POC Dist']) || 0,
            volatilityATR: parseFloat(r['volatilityATR'] || r['ATR']) || 0,
            sessionProgress: parseFloat(r['sessionProgress'] || r['Progress']) || 0,
        };
    })
    .filter(s => s.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// ============================================================
// ACTIVE TRADES — Dhan_Active_Trades sheet
// Real columns: Entry Order ID, SL Order ID, Target Order ID,
//   Trading Symbol, Security ID, Entry Price, Stop Loss, Target,
//   Quantity, Risk Reward Ratio, Max Loss, Max Profit, Status,
//   Timestamp, Exit Type, Exit Price, PnL, Actual Risk Reward,
//   Exit Timestamp, Execution Time
// ============================================================
export interface ActiveTrade {
    entryOrderId: string;
    slOrderId: string;
    targetOrderId: string;
    tradingSymbol: string;
    securityId: string;
    entryPrice: number;
    stopLoss: number;
    target: number;
    quantity: number;
    rrRatio: number;
    maxLoss: number;
    maxProfit: number;
    status: string;
    timestamp: string;
    exitType: string;
    exitPrice: number;
    pnl: number;
    actualRR: number;
    exitTimestamp: string;
    executionTime: string;
}

export async function fetchActiveTrades(): Promise<ActiveTrade[]> {
    const rows = await fetchSheet(GID.activeTrades);
    return rows
        .filter(r => r['Status'] === 'ACTIVE' || r['Status'] === 'OPEN')
        .map(r => ({
            entryOrderId: r['Entry Order ID'] || '',
            slOrderId: r['SL Order ID'] || '',
            targetOrderId: r['Target Order ID'] || '',
            tradingSymbol: r['Trading Symbol'] || '',
            securityId: r['Security ID'] || '',
            entryPrice: parseFloat(r['Entry Price']) || 0,
            stopLoss: parseFloat(r['Stop Loss']) || 0,
            target: parseFloat(r['Target']) || 0,
            quantity: parseInt(r['Quantity']) || 0,
            rrRatio: parseFloat(r['Risk Reward Ratio']) || 0,
            maxLoss: parseFloat(r['Max Loss']) || 0,
            maxProfit: parseFloat(r['Max Profit']) || 0,
            status: r['Status'] || 'UNKNOWN',
            timestamp: parseSheetTimestamp(r['Timestamp'] || ''),
            exitType: r['Exit Type'] || '',
            exitPrice: parseFloat(r['Exit Price']) || 0,
            pnl: parseFloat(r['PnL']) || 0,
            actualRR: parseFloat(r['Actual Risk Reward']) || 0,
            exitTimestamp: parseSheetTimestamp(r['Exit Timestamp'] || ''),
            executionTime: r['Execution Time'] || '',
        }));
}

// ============================================================
// TRADE SUMMARY — Dhan_Trade_Summary sheet
// Real columns: Entry Order ID, Timestamp, Signal, Confidence,
//   Trading Symbol, Entry Price, Stop Loss, Target, Quantity,
//   Risk Reward Ratio, Max Loss, Max Profit, Writers Zone,
//   Market Strength, VIX, Status, Exit Price, PnL, Exit Type,
//   Actual Risk Reward, Exit Timestamp
// ============================================================
export interface TradeSummary {
    entryOrderId: string;
    timestamp: string;
    signal: string;
    confidence: number;
    tradingSymbol: string;
    entryPrice: number;
    stopLoss: number;
    target: number;
    quantity: number;
    rrRatio: number;
    maxLoss: number;
    maxProfit: number;
    writersZone: string;
    marketStrength: string;
    vix: number;
    status: string;
    exitPrice: number;
    pnl: number;
    exitType: string;
    actualRR: number;
    exitTimestamp: string;
}

export async function fetchTradeSummary(): Promise<TradeSummary[]> {
    const rows = await fetchSheet(GID.tradeSummary);
    return rows
        .reverse()  // newest first
        .map(r => ({
            entryOrderId: r['Entry Order ID'] || '',
            timestamp: parseSheetTimestamp(r['Timestamp'] || ''),
            signal: r['Signal'] || '',
            confidence: parseFloat(r['Confidence']) || 0,
            tradingSymbol: r['Trading Symbol'] || '',
            entryPrice: parseFloat(r['Entry Price']) || 0,
            stopLoss: parseFloat(r['Stop Loss']) || 0,
            target: parseFloat(r['Target']) || 0,
            quantity: parseInt(r['Quantity']) || 0,
            rrRatio: parseFloat(r['Risk Reward Ratio']) || 0,
            maxLoss: parseFloat(r['Max Loss']) || 0,
            maxProfit: parseFloat(r['Max Profit']) || 0,
            writersZone: r['Writers Zone'] || '',
            marketStrength: r['Market Strength'] || '',
            vix: parseFloat(r['VIX']) || 0,
            status: r['Status'] || '',
            exitPrice: parseFloat(r['Exit Price']) || 0,
            pnl: parseFloat(r['PnL']) || 0,
            exitType: r['Exit Type'] || '',
            actualRR: parseFloat(r['Actual Risk Reward']) || 0,
            exitTimestamp: parseSheetTimestamp(r['Exit Timestamp'] || ''),
        }));
}

// ============================================================
// LIVE MARKET DATA — TradingView Scanner
// Note: CORS blocks this in browser; falls back to sheet data
// ============================================================
export interface EngineHealth {
    status: string;        // raw value from python: 'healthy' | 'online' | 'offline'
    model_loaded: boolean;
    engine_mode: string;
    online: boolean;       // true when python server responded successfully
}

export async function fetchEngineHealth(): Promise<EngineHealth> {
    try {
        const { data } = await axios.get('http://localhost:8000/health', { timeout: 3000 });
        // Python API returns { status: 'healthy', model_loaded: false, engine_mode: '...' }
        return {
            status: data.status ?? 'healthy',
            model_loaded: data.model_loaded ?? false,
            engine_mode: data.engine_mode ?? 'RULES_FALLBACK',
            online: true,
        };
    } catch {
        return { status: 'offline', model_loaded: false, engine_mode: 'OFFLINE', online: false };
    }
}

export interface MarketSnapshot {
    niftyLTP: number;
    vix: number;
    lastUpdate: string;
    marketOpen: boolean;
}

export async function fetchMarketData(fallbackSignal?: LiveSignal): Promise<MarketSnapshot> {
    const now = new Date();
    const istMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330);
    const marketOpen = istMin >= 555 && istMin <= 930;

    try {
        const [niftyRes, vixRes] = await Promise.all([
            axios.post(TV_SCANNER, {
                symbols: { tickers: ['NSE:NIFTY'] },
                columns: ['close', 'change', 'change_abs']
            }, { timeout: 5000 }),
            axios.post(TV_SCANNER, {
                symbols: { tickers: ['NSE:INDIAVIX'] },
                columns: ['close']
            }, { timeout: 5000 })
        ]);

        const niftyClose = niftyRes.data?.data?.[0]?.d?.[0] ?? 0;
        const vixClose = vixRes.data?.data?.[0]?.d?.[0] ?? 0;

        if (niftyClose > 0) {
            return {
                niftyLTP: Math.round(niftyClose * 100) / 100,
                vix: Math.round(vixClose * 100) / 100,
                lastUpdate: new Date().toISOString(),
                marketOpen,
            };
        }
    } catch {
        // CORS or network error — fall through to sheet-based fallback silently
    }

    // ✅ Fallback: use latest signal's spot price + VIX from the sheet
    if (fallbackSignal && fallbackSignal.spotPrice > 0) {
        return {
            niftyLTP: fallbackSignal.spotPrice,
            vix: fallbackSignal.vix,
            lastUpdate: fallbackSignal.timestamp || new Date().toISOString(),
            marketOpen,
        };
    }

    // Last resort: return zeros — keeps UI stable instead of throwing
    return { niftyLTP: 0, vix: 0, lastUpdate: new Date().toISOString(), marketOpen };
}

// ============================================================
// ANALYTICS — compute stats from trade history
// ============================================================
export interface TradeStats {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    avgRR: number;
    ceTrades: number;
    peTrades: number;
}

export function computeTradeStats(trades: TradeSummary[]): TradeStats {
    const closed = trades.filter(t => t.status && t.status !== 'ACTIVE' && t.status !== 'OPEN' && t.pnl !== 0);
    const wins = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl < 0);

    const totalPnL = closed.reduce((sum, t) => sum + t.pnl, 0);
    const totalWin = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    let peak = 0, maxDD = 0, running = 0;
    closed.forEach(t => {
        running += t.pnl;
        if (running > peak) peak = running;
        const dd = peak - running;
        if (dd > maxDD) maxDD = dd;
    });

    return {
        totalTrades: closed.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        winRate: closed.length ? Math.round((wins.length / closed.length) * 100) : 0,
        totalPnL: Math.round(totalPnL),
        avgWin: wins.length ? Math.round(totalWin / wins.length) : 0,
        avgLoss: losses.length ? Math.round(totalLoss / losses.length) : 0,
        profitFactor: totalLoss > 0 ? Math.round((totalWin / totalLoss) * 100) / 100 : 0,
        maxDrawdown: Math.round(maxDD),
        avgRR: closed.length ? Math.round(closed.reduce((s, t) => s + t.actualRR, 0) / closed.length * 100) / 100 : 0,
        ceTrades: closed.filter(t => t.signal?.includes('CE')).length,
        peTrades: closed.filter(t => t.signal?.includes('PE')).length,
    };
}
