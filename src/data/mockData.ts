import { Signal, Trade, DailyPerformance, SystemHealth, MarketData, TradingConfig } from '../types';

// ===== Generate realistic mock signals =====
const signalReasons = [
    'MACD Bearish, EMA20 Bearish, Price Below VWAP, SuperTrend Sell, BB Breakout Down',
    'RSI Oversold, MACD Bullish, SuperTrend Buy, EMA20 Bullish, Volume Strong Buy',
    'Stochastic Bullish, CCI Buy, Price Above VWAP, Writers BULLISH (0.82)',
    'RSI Overbought, MACD Bearish, SuperTrend Sell, Writers BEARISH (0.76)',
    'Mixed signals — no clear edge, No structural confirmation',
    'SuperTrend Buy, MACD Bullish, BB Breakout Up, Writers BULLISH (0.65)',
    'High Volatility (VIX), Very High VIX — avoid naked CE/PE',
    'EMA20 Bearish, SMA50 Bearish, Price Below VWAP, Support broken at 24150',
    'RSI Oversold, Stochastic Bullish, Hammer candle, Strong Volume Buy',
    'SuperTrend Sell, MACD Bearish, CCI Sell, Writers BEARISH (0.88)',
];

const signalTypes: Signal['finalSignal'][] = [
    'BUY CALL (CE)', 'BUY PUT (PE)', 'WAIT', 'HOLD', 'AVOID',
    'BUY CALL (CE)', 'BUY PUT (PE)', 'WAIT', 'BUY CALL (CE)', 'BUY PUT (PE)',
];

export function generateMockSignals(count: number = 50): Signal[] {
    const signals: Signal[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const ts = new Date(now - i * 5 * 60 * 1000);
        const idx = i % 10;
        const signal = signalTypes[idx];
        const conf = signal === 'WAIT' || signal === 'HOLD' ? Math.random() * 30 :
            signal === 'AVOID' ? -20 - Math.random() * 30 :
                50 + Math.random() * 45;

        signals.push({
            id: `sig-${i}`,
            timestamp: ts.toISOString(),
            finalSignal: signal,
            confidence: Math.round(conf * 100) / 100,
            reason: signalReasons[idx],
            indicators: {
                RSI: signal.includes('CE') ? 8 : -8,
                MACD: signal.includes('CE') ? 12 : -12,
                SuperTrend: signal.includes('CE') ? 12 : -12,
                EMA20: signal.includes('CE') ? 8 : -8,
                VWAP: signal.includes('CE') ? 8 : -8,
                WritersZone: signal.includes('CE') ? 10 : -10,
            },
            ltp: 24100 + Math.round((Math.random() - 0.5) * 400),
            writersZone: signal.includes('CE') ? 'BULLISH' : signal.includes('PE') ? 'BEARISH' : 'NEUTRAL',
            writersConfidence: 0.5 + Math.random() * 0.45,
            marketRegime: signal.includes('CE') ? 'bull' : signal.includes('PE') ? 'bear' : 'neutral',
            supportLevels: [24050, 23950, 23800],
            resistanceLevels: [24250, 24350, 24500],
            tradeAdvice: signal.includes('CE') || signal.includes('PE')
                ? 'Full conviction trade; manage size per risk rules'
                : 'No clear edge — wait for confluence',
        });
    }

    return signals;
}

// ===== Generate mock trades =====
export function generateMockTrades(count: number = 30): Trade[] {
    const trades: Trade[] = [];
    const now = Date.now();
    const symbols = [
        'NIFTY 24200 CE', 'NIFTY 24150 PE', 'NIFTY 24250 CE', 'NIFTY 24100 PE',
        'NIFTY 24300 CE', 'NIFTY 24050 PE', 'NIFTY 24350 CE', 'NIFTY 23950 PE',
    ];
    const statuses: Trade['status'][] = ['TARGET_HIT', 'SL_HIT', 'TARGET_HIT', 'TARGET_HIT', 'SL_HIT', 'OPEN'];

    for (let i = 0; i < count; i++) {
        const ts = new Date(now - i * 45 * 60 * 1000);
        const sym = symbols[i % symbols.length];
        const isCall = sym.includes('CE');
        const entryPrice = 80 + Math.round(Math.random() * 120);
        const sl = entryPrice - 12;
        const target = entryPrice + 25;
        const status = i < 2 ? 'OPEN' : statuses[i % statuses.length];
        const isWin = status === 'TARGET_HIT';
        const exitPrice = status === 'OPEN' ? undefined :
            isWin ? target + Math.round(Math.random() * 5) : sl - Math.round(Math.random() * 3);
        const qty = 50;
        const pnl = exitPrice ? (exitPrice - entryPrice) * qty : undefined;

        trades.push({
            id: `trade-${i}`,
            entryOrderId: `ORD-${100000 + i}`,
            slOrderId: `ORD-${200000 + i}`,
            targetOrderId: `ORD-${300000 + i}`,
            timestamp: ts.toISOString(),
            symbol: sym,
            optionType: isCall ? 'CE' : 'PE',
            underlying: 'NIFTY',
            strikePrice: parseInt(sym.split(' ')[1]),
            entryPrice,
            stopLoss: sl,
            target,
            quantity: qty,
            status,
            exitPrice,
            pnl,
            exitType: status === 'OPEN' ? undefined : isWin ? 'TARGET' : 'STOPLOSS',
            exitTimestamp: status === 'OPEN' ? undefined : new Date(ts.getTime() + Math.random() * 60 * 60000).toISOString(),
            riskRewardRatio: 2.08,
            maxLoss: 12 * qty,
            maxProfit: 25 * qty,
            signal: isCall ? 'BUY CALL (CE)' : 'BUY PUT (PE)',
            signalConfidence: 70 + Math.random() * 25,
        });
    }

    return trades;
}

// ===== Generate daily performance data =====
export function generateDailyPerformance(days: number = 30): DailyPerformance[] {
    const data: DailyPerformance[] = [];
    const now = Date.now();

    for (let i = 0; i < days; i++) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const totalTrades = 3 + Math.floor(Math.random() * 5);
        const winningTrades = Math.floor(totalTrades * (0.5 + Math.random() * 0.3));
        const losingTrades = totalTrades - winningTrades;
        const avgWin = 800 + Math.random() * 600;
        const avgLoss = -(400 + Math.random() * 400);
        const totalPnl = winningTrades * avgWin + losingTrades * avgLoss;

        data.push({
            date: date.toISOString().split('T')[0],
            totalTrades,
            winningTrades,
            losingTrades,
            winRate: Math.round((winningTrades / totalTrades) * 100),
            totalPnl: Math.round(totalPnl),
            maxProfit: Math.round(avgWin * 1.5),
            maxLoss: Math.round(avgLoss * 1.3),
            avgDuration: 30 + Math.floor(Math.random() * 60),
        });
    }

    return data.reverse();
}

// ===== System Health =====
export const mockSystemHealth: SystemHealth = {
    status: 'online',
    apiStatus: {
        broker: true,
        aiModel: true,
        sheets: true,
    },
    lastHeartbeat: new Date().toISOString(),
    uptime: '4d 12h 35m',
    activeWorkflows: 2,
    errorsToday: 0,
};

// ===== Market Data =====
export const mockMarketData: MarketData = {
    niftyPrice: 24187.30,
    niftyChange: 87.45,
    niftyChangePercent: 0.36,
    bankniftyPrice: 51234.50,
    bankniftyChange: -123.75,
    bankniftyChangePercent: -0.24,
    vix: 13.42,
    vixChange: -0.87,
    marketStatus: 'CLOSED',
    lastUpdate: new Date().toISOString(),
};

// ===== Trading Config =====
export const mockConfig: TradingConfig = {
    paperTradingMode: true,
    underlying: 'NIFTY',
    lotSize: 50,
    stopLossPoints: 12,
    targetPoints: 25,
    maxDailyLoss: 5000,
    vixThreshold: 18,
    confidenceThreshold: 75,
    maxPositions: 3,
};

// ===== PnL Chart Data =====
export function generatePnlChartData(days: number = 30) {
    const data: { date: string; pnl: number; cumPnl: number }[] = [];
    let cumPnl = 0;
    const now = Date.now();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const dailyPnl = Math.round((Math.random() - 0.4) * 3000);
        cumPnl += dailyPnl;
        data.push({
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            pnl: dailyPnl,
            cumPnl,
        });
    }

    return data;
}

// ===== Win/Loss Distribution =====
export function generateWinLossData() {
    return [
        { name: 'Target Hit', value: 18, color: '#10b981' },
        { name: 'SL Hit', value: 8, color: '#ef4444' },
        { name: 'Manual Exit', value: 4, color: '#f59e0b' },
    ];
}

// ===== Signal Distribution =====
export function generateSignalDistribution() {
    return [
        { name: 'BUY CE', count: 22, color: '#10b981' },
        { name: 'BUY PE', count: 18, color: '#ef4444' },
        { name: 'WAIT', count: 35, color: '#f59e0b' },
        { name: 'HOLD', count: 15, color: '#6b7280' },
        { name: 'AVOID', count: 10, color: '#8b5cf6' },
    ];
}
