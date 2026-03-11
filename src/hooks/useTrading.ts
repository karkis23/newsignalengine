// ============================================================
// useTrading Hook — Live data polling from Google Sheets
// Auto-refreshes every 30s during market hours, 5min otherwise
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchSignals, fetchActiveTrades, fetchTradeSummary, fetchMarketData,
    computeTradeStats, fetchEngineHealth,
    type LiveSignal, type ActiveTrade, type TradeSummary,
    type MarketSnapshot, type TradeStats, type EngineHealth
} from '../services/sheetsApi';

export interface TradingState {
    signals: LiveSignal[];
    activeTrades: ActiveTrade[];
    tradeSummary: TradeSummary[];
    marketData: MarketSnapshot | null;
    stats: TradeStats | null;
    engineHealth: EngineHealth | null;
    loading: boolean;
    error: string | null;
    lastRefresh: Date | null;
    isLive: boolean;
    refresh: () => void;
    isPaused: boolean;
    togglePolling: () => void;
}

export function useTrading(): TradingState {
    const [signals, setSignals] = useState<LiveSignal[]>([]);
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [tradeSummary, setTradeSummary] = useState<TradeSummary[]>([]);
    const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
    const [stats, setStats] = useState<TradeStats | null>(null);
    const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // ... load implementation remains same
            const [sigsResult, tradesResult, summaryResult] = await Promise.allSettled([
                fetchSignals(5000),
                fetchActiveTrades(),
                fetchTradeSummary(),
            ]);

            let latestSignals: LiveSignal[] = [];
            if (sigsResult.status === 'fulfilled') {
                latestSignals = sigsResult.value;
                setSignals(latestSignals);
            }
            if (tradesResult.status === 'fulfilled') setActiveTrades(tradesResult.value);
            if (summaryResult.status === 'fulfilled') {
                setTradeSummary(summaryResult.value);
                setStats(computeTradeStats(summaryResult.value));
            }

            try {
                const [market, health] = await Promise.all([
                    fetchMarketData(latestSignals[0]),
                    fetchEngineHealth()
                ]);
                setMarketData(market);
                setEngineHealth(health);
            } catch (mErr) {
                console.warn('Market/Health data failed', mErr);
            }

            setLastRefresh(new Date());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const scheduleNext = useCallback(() => {
        clearTimeout(timerRef.current);
        if (isPaused) return;

        const now = new Date();
        const istMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330);
        const marketOpen = istMin >= 555 && istMin <= 930;
        const interval = marketOpen ? 30_000 : 180_000;
        timerRef.current = setTimeout(() => { load(); scheduleNext(); }, interval);
    }, [load, isPaused]);

    useEffect(() => {
        load();
        scheduleNext();
        return () => clearTimeout(timerRef.current);
    }, [load, scheduleNext]);

    const togglePolling = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    return {
        signals, activeTrades, tradeSummary,
        marketData, stats, engineHealth,
        loading, error, lastRefresh,
        isLive: !!marketData?.marketOpen,
        refresh: load,
        isPaused,
        togglePolling
    };
}
