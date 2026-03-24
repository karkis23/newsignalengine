/**
 * SUPABASE API SERVICE LAYER
 * 
 * This module acts as the primary telemetry bridge between the Zenith Frontend 
 * and the remote PostgreSQL signal database. It maps snake_case database fields 
 * to camelCase TypeScript interfaces used throughout the UI.
 */
import { supabase } from './supabaseClient';
import axios from 'axios';

/** TradingView Scanner Endpoint for Indian Equity */
const TV_SCANNER = 'https://scanner.tradingview.com/india/scan';

// ============================================================
// TYPES (Mirrored from sheetsApi.ts)
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
    priceActionScore: number;
    pocDistance: number;
    volatilityATR: number;
    sessionProgress: number;
    lastFireTime?: string;
    lastSignal?: string;
    ivSkewBias?: string;
    gexRegime?: string;
    gammaFlipLevel?: number;
}

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

// ============================================================
// FETCH FUNCTIONS (Pulling from Supabase)
// ============================================================

export async function fetchSignals(limit = 100): Promise<LiveSignal[]> {
    const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching signals from Supabase:', error);
        return [];
    }

    const parseJSONNum = (val: any, fieldKey: string): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            if (val.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(val);
                    return Number(parsed[fieldKey] ?? 0);
                } catch {
                    return Number(val) || 0;
                }
            }
            return Number(val) || 0;
        }
        if (typeof val === 'object') {
            return Number(val[fieldKey] ?? 0);
        }
        return 0;
    };

    return (data || []).map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        finalSignal: r.signal,
        confidence: Number(r.confidence),
        rsi: Number(r.rsi),
        macd: Number(r.macd),
        momentum: Number(r.momentum),
        volumeRatio: Number(r.volume_ratio),
        vix: Number(r.vix),
        sentiment: r.sentiment,
        writersZone: r.writers_zone,
        writersConfidence: Number(r.writers_confidence),
        spotPrice: Number(r.spot_price),
        marketStrength: r.market_strength,
        atmStrike: Number(r.atm_strike),
        putCallRatio: Number(r.put_call_ratio),
        candlePattern: r.candle_pattern,
        reason: r.reason,
        regime: r.regime,
        adx: Number(r.adx),
        rawSignal: r.raw_signal,
        streakCount: r.streak_count,
        macdFlip: r.macd_flip,
        blockedReason: r.blocked_reason,
        engineVersion: r.engine_version,
        engineMode: r.engine_mode,
        aiInsights: r.ai_insights,
        gammaExposure: parseJSONNum(r.gamma_exposure, 'total_gex'),
        ivSkew: parseJSONNum(r.iv_skew, 'skew'),
        superTrend: r.super_trend,
        priceActionScore: Number(r.price_action_score),
        pocDistance: Number(r.poc_distance),
        volatilityATR: Number(r.volatility_atr),
        sessionProgress: Number(r.session_progress),
        lastFireTime: r.LastFireTime,
        lastSignal: r.LastSignal,
        ivSkewBias: r.IV_skew_bias,
        gexRegime: r.GEX_Regime,
        gammaFlipLevel: Number(r["Gamma_Flip Level"]),
    }));
}

export async function fetchActiveTrades(): Promise<ActiveTrade[]> {
    const { data, error } = await supabase
        .from('active_exit_orders')
        .select('*')
        .eq('status', 'ACTIVE');

    if (error) {
        console.error('Error fetching active trades from Supabase:', error);
        return [];
    }

    return (data || []).map(r => ({
        entryOrderId: r.entry_order_id,
        slOrderId: r.sl_order_id,
        targetOrderId: r.target_order_id,
        tradingSymbol: r.symbol,
        securityId: r.security_id || '',
        entryPrice: Number(r.entry_price),
        stopLoss: Number(r.sl_price),
        target: Number(r.target_price),
        quantity: r.quantity,
        rrRatio: Number(r.risk_reward_ratio),
        maxLoss: Number(r.max_loss),
        maxProfit: Number(r.max_profit),
        status: r.status,
        timestamp: r.timestamp,
        exitType: r.exit_type,
        exitPrice: Number(r.exit_price),
        pnl: Number(r.pnl),
        actualRR: Number(r.actual_rr),
        exitTimestamp: r.exit_timestamp,
        executionTime: r.execution_time
    }));
}

export async function fetchTradeSummary(limit = 100): Promise<TradeSummary[]> {
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching trade summary from Supabase:', error);
        return [];
    }

    return (data || []).map(r => ({
        entryOrderId: r.entry_order_id,
        timestamp: r.timestamp,
        signal: r.signal,
        confidence: Number(r.confidence),
        tradingSymbol: r.symbol,
        entryPrice: Number(r.entry_price),
        stopLoss: Number(r.stop_loss),
        target: Number(r.target),
        quantity: r.quantity,
        rrRatio: Number(r.risk_reward_ratio),
        maxLoss: Number(r.max_loss),
        maxProfit: Number(r.max_profit),
        writersZone: r.writers_zone || '',
        marketStrength: r.market_strength || '',
        vix: Number(r.vix) || 0,
        status: r.status,
        exitPrice: Number(r.exit_price),
        pnl: Number(r.pnl),
        exitType: r.exit_type,
        actualRR: Number(r.actual_rr),
        exitTimestamp: r.exit_timestamp
    }));
}

// ============================================================
// HEALTH & MARKET DATA (Unchanged Logic, uses local/external API)
// ============================================================

export interface EngineHealth {
    status: string;
    model_loaded: boolean;
    engine_mode: string;
    online: boolean;
}

export async function fetchEngineHealth(): Promise<EngineHealth> {
    try {
        const { data } = await axios.get('http://localhost:8000/health', { timeout: 3000 });
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
    } catch { }

    if (fallbackSignal && fallbackSignal.spotPrice > 0) {
        return {
            niftyLTP: fallbackSignal.spotPrice,
            vix: fallbackSignal.vix,
            lastUpdate: fallbackSignal.timestamp || new Date().toISOString(),
            marketOpen,
        };
    }

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
