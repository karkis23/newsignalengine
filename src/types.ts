// ===== Core Trading Types =====

export interface Signal {
    id: string;
    timestamp: string;
    finalSignal: 'BUY CALL (CE)' | 'BUY PUT (PE)' | 'WAIT' | 'HOLD' | 'AVOID';
    confidence: number;
    reason: string;
    indicators: Record<string, number>;
    ltp: number;
    writersZone: string;
    writersConfidence: number;
    marketRegime?: string;
    supportLevels?: number[];
    resistanceLevels?: number[];
    tradeAdvice?: string;
    engineVersion?: string;
    engineMode?: string;
    aiInsights?: string;
    gammaExposure?: number;
    ivSkew?: number;
}

export interface Trade {
    id: string;
    entryOrderId: string;
    slOrderId?: string;
    targetOrderId?: string;
    timestamp: string;
    symbol: string;
    optionType: 'CE' | 'PE';
    underlying: string;
    strikePrice: number;
    entryPrice: number;
    stopLoss: number;
    target: number;
    quantity: number;
    status: 'OPEN' | 'TARGET_HIT' | 'SL_HIT' | 'MANUAL_EXIT' | 'EXPIRED';
    exitPrice?: number;
    pnl?: number;
    exitType?: string;
    exitTimestamp?: string;
    riskRewardRatio: number;
    maxLoss: number;
    maxProfit: number;
    signal: string;
    signalConfidence: number;
}

export interface DailyPerformance {
    date: string;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    maxProfit: number;
    maxLoss: number;
    avgDuration: number;
}

export interface SystemHealth {
    status: 'online' | 'offline' | 'warning';
    apiStatus: {
        broker: boolean;
        aiModel: boolean;
        sheets: boolean;
    };
    lastHeartbeat: string;
    uptime: string;
    activeWorkflows: number;
    errorsToday: number;
}

export interface TradingConfig {
    paperTradingMode: boolean;
    underlying: 'NIFTY' | 'BANKNIFTY';
    lotSize: number;
    stopLossPoints: number;
    targetPoints: number;
    maxDailyLoss: number;
    vixThreshold: number;
    confidenceThreshold: number;
    maxPositions: number;
}

export interface MarketData {
    niftyPrice: number;
    niftyChange: number;
    niftyChangePercent: number;
    bankniftyPrice: number;
    bankniftyChange: number;
    bankniftyChangePercent: number;
    vix: number;
    vixChange: number;
    marketStatus: 'PRE_OPEN' | 'OPEN' | 'CLOSED';
    lastUpdate: string;
}

export type SignalType = Signal['finalSignal'];
export type TradeStatus = Trade['status'];
