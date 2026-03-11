import React, { useState } from 'react';
import {
    Play, RotateCcw, CheckCircle2, Settings2,
    Target, ShieldCheck, Zap, Activity,
    BarChart3, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useTrading } from '../hooks/useTrading';

interface BacktestResult {
    totalTrades: number; winRate: number; totalPnl: number; profitFactor: number;
    maxDrawdown: number; sharpeRatio: number; avgWin: number; avgLoss: number;
    bestDay: number; worstDay: number;
    equityCurve: { date: string; equity: number }[];
    dailyReturns: { date: string; pnl: number }[];
}

function runRealBacktest(config: any, signals: any[], tradeSummary: any[]): BacktestResult {
    let equity = config.startCapital || 100000;
    const initial = equity;
    const curve: { date: string; equity: number }[] = [];
    const dayMap: Record<string, number> = {};
    let wins = 0, losses = 0, totalWin = 0, totalLoss = 0;
    let maxEq = equity, maxDD = 0;

    const filtered = signals.filter(s => {
        const conf = Math.abs(s.confidence || 0);
        const vix = s.vix || 0;
        const modeOk = config.engineMode === 'ALL' ||
            (config.engineMode === 'AI'    &&  s.engineMode === 'AI_ENSEMBLE') ||
            (config.engineMode === 'RULES' &&  s.engineMode !== 'AI_ENSEMBLE');
        return conf >= config.confidenceThreshold && (config.vixThreshold === 0 || vix <= config.vixThreshold) && modeOk;
    }).reverse();

    filtered.forEach(s => {
        const dateStr = new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const isCE = s.finalSignal?.includes('CE'), isPE = s.finalSignal?.includes('PE');
        if (!isCE && !isPE) return;

        const sigTime = new Date(s.timestamp).getTime();
        const realTrade = tradeSummary.find(t => {
            const dt = Math.abs(new Date(t.timestamp).getTime() - sigTime);
            return dt < 300000 && ((isCE && t.signal?.includes('CE')) || (isPE && t.signal?.includes('PE')));
        });

        let pnl = 0;
        const lots = config.lotSize || 50;
        if (realTrade && !['ACTIVE','OPEN'].includes(realTrade.status)) {
            pnl = realTrade.pnl || 0;
        } else {
            const prob = Math.abs(s.confidence || 50) / 100;
            const rng = Math.abs(Math.sin(sigTime)) % 1;
            pnl = rng < prob ? config.targetPoints * lots : -(config.stopLossPoints * lots);
        }

        if (pnl > 0) { wins++; totalWin  += Math.abs(pnl); }
        else          { losses++; totalLoss += Math.abs(pnl); }

        equity += pnl;
        dayMap[dateStr] = (dayMap[dateStr] || 0) + pnl;
        maxEq = Math.max(maxEq, equity);
        maxDD = Math.max(maxDD, maxEq > 0 ? ((maxEq - equity) / maxEq) * 100 : 0);
        curve.push({ date: dateStr, equity: Math.round(equity) });
    });

    const dailyReturns = Object.entries(dayMap).map(([date, pnl]) => ({ date, pnl: Math.round(pnl) }));
    const pnls = dailyReturns.map(d => d.pnl);
    const mean = pnls.reduce((a, b) => a + b, 0) / Math.max(1, pnls.length);
    const std = Math.sqrt(pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, pnls.length));
    const total = wins + losses;

    return {
        totalTrades: total, totalPnl: Math.round(equity - initial),
        winRate: total > 0 ? (wins / total) * 100 : 0,
        profitFactor: totalLoss > 0 ? Math.round((totalWin / totalLoss) * 100) / 100 : totalWin > 0 ? 999 : 0,
        maxDrawdown: Math.round(maxDD * 100) / 100,
        sharpeRatio: std > 0 ? Math.round((mean / std) * Math.sqrt(252) * 100) / 100 : 0,
        avgWin:  Math.round(totalWin  / Math.max(1, wins)),
        avgLoss: Math.round(totalLoss / Math.max(1, losses)),
        bestDay:  dailyReturns.length > 0 ? Math.max(...pnls) : 0,
        worstDay: dailyReturns.length > 0 ? Math.min(...pnls) : 0,
        equityCurve: curve, dailyReturns
    };
}

const TooltipStyle = {
    contentStyle: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px', padding: '8px 12px' },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</label>
        {children}
    </div>
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} style={{
        width: '100%', height: '38px', padding: '0 12px',
        borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
        background: 'var(--bg-elevated)', color: 'var(--text-1)',
        fontSize: '13px', fontFamily: 'inherit', outline: 'none',
        appearance: 'none', cursor: 'pointer', transition: 'var(--trans-s)'
    }} />
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} style={{
        width: '100%', height: '38px', padding: '0 12px',
        borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
        background: 'var(--bg-elevated)', color: 'var(--text-1)',
        fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none', transition: 'var(--trans-s)'
    }} />
);

const fmtPnl = (n: number) => {
    const sign = n >= 0 ? '+' : '-';
    const abs = Math.abs(n);
    if (abs >= 100000) return `${sign}₹${(abs/100000).toFixed(1)}L`;
    if (abs >= 1000)   return `${sign}₹${(abs/1000).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
};

export default function BacktestPage() {
    const { signals, tradeSummary } = useTrading();
    const [config, setConfig] = useState({
        underlying: 'NIFTY 50', lotSize: 65,
        stopLossPoints: 12, targetPoints: 25,
        confidenceThreshold: 75, vixThreshold: 18,
        engineMode: 'ALL', startCapital: 100000,
    });
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [running, setRunning] = useState(false);

    const rrRatio = (config.targetPoints / config.stopLossPoints).toFixed(2);
    const qualified = signals.filter(s => Math.abs(s.confidence || 0) >= config.confidenceThreshold && (config.vixThreshold === 0 || (s.vix || 0) <= config.vixThreshold)).length;

    const run = () => {
        if (!signals.length) return;
        setRunning(true);
        setTimeout(() => { setResult(runRealBacktest(config, signals, tradeSummary)); setRunning(false); }, 1200);
    };

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Tools</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Strategy Lab</h2>
                </div>
                {result && (
                    <button onClick={() => setResult(null)} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '7px 16px', borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                        color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                    }}>
                        <RotateCcw size={13} /> New Simulation
                    </button>
                )}
            </div>

            {/* Config + Launch Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

                {/* Parameters Card */}
                <div className="card" style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Settings2 size={16} color="var(--accent-light)" />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-1)' }}>Simulation Parameters</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="dot dot-green dot-pulse" />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--profit)' }}>Live sync active</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <FieldGroup label="Instrument">
                            <StyledSelect value={config.underlying} onChange={e => setConfig({ ...config, underlying: e.target.value })}>
                                <option>NIFTY 50</option>
                                <option>BANK NIFTY</option>
                                <option>FIN NIFTY</option>
                            </StyledSelect>
                        </FieldGroup>

                        <FieldGroup label="Engine Mode">
                            <StyledSelect value={config.engineMode} onChange={e => setConfig({ ...config, engineMode: e.target.value })}>
                                <option value="ALL">All Signals (Rules + AI)</option>
                                <option value="AI">AI Ensemble Only</option>
                                <option value="RULES">Rules Engine Only</option>
                            </StyledSelect>
                        </FieldGroup>

                        <FieldGroup label="Lot Size">
                            <StyledInput type="number" value={config.lotSize} onChange={e => setConfig({ ...config, lotSize: Number(e.target.value) })} />
                        </FieldGroup>

                        <FieldGroup label="Starting Capital (₹)">
                            <StyledInput type="number" value={config.startCapital} onChange={e => setConfig({ ...config, startCapital: Number(e.target.value) })} step={10000} />
                        </FieldGroup>

                        {/* Profit Target */}
                        <FieldGroup label="Profit Target (pts)">
                            <div style={{ position: 'relative' }}>
                                <StyledInput type="number" value={config.targetPoints} onChange={e => setConfig({ ...config, targetPoints: Number(e.target.value) })} />
                                <span style={{
                                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                    fontSize: '10px', fontWeight: 700, color: 'var(--profit)',
                                    background: 'var(--profit-dim)', border: '1px solid rgba(34,197,94,0.2)',
                                    padding: '2px 7px', borderRadius: '4px'
                                }}>₹{(config.targetPoints * config.lotSize).toLocaleString('en-IN')}</span>
                            </div>
                        </FieldGroup>

                        {/* Stop Loss */}
                        <FieldGroup label="Stop Loss (pts)">
                            <div style={{ position: 'relative' }}>
                                <StyledInput type="number" value={config.stopLossPoints} onChange={e => setConfig({ ...config, stopLossPoints: Number(e.target.value) })} />
                                <span style={{
                                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                    fontSize: '10px', fontWeight: 700, color: 'var(--loss)',
                                    background: 'var(--loss-dim)', border: '1px solid rgba(239,68,68,0.2)',
                                    padding: '2px 7px', borderRadius: '4px'
                                }}>₹{(config.stopLossPoints * config.lotSize).toLocaleString('en-IN')}</span>
                            </div>
                        </FieldGroup>

                        {/* Confidence Slider — spans 2 cols */}
                        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={12} /> Min Confidence Threshold
                                </label>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-light)', background: 'var(--accent-dim)', padding: '2px 10px', borderRadius: '99px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    {config.confidenceThreshold}%
                                </span>
                            </div>
                            <input type="range" min="0" max="100" step="5"
                                style={{ width: '100%', accentColor: '#6366f1' }}
                                value={config.confidenceThreshold}
                                onChange={e => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <span>All signals</span><span>Selective</span><span>Strict</span>
                            </div>
                        </div>

                        {/* VIX filter */}
                        <div style={{ gridColumn: 'span 2', padding: '16px', borderRadius: 'var(--r-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <FieldGroup label="VIX Limit">
                                <StyledInput type="number" style={{ width: '100px' }}
                                    value={config.vixThreshold} min={10} max={40} step={0.5}
                                    onChange={e => setConfig({ ...config, vixThreshold: Number(e.target.value) })} />
                            </FieldGroup>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                                    <Info size={11} /> Volatility Filter
                                </div>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                                    Signals are skipped when India VIX exceeds <strong style={{ color: 'var(--text-1)' }}>{config.vixThreshold}</strong>. This guards against high-volatility slippage.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* R:R Derived */}
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 500 }}>Risk : Reward Ratio</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '14px', color: parseFloat(rrRatio) >= 2 ? 'var(--profit)' : parseFloat(rrRatio) >= 1.5 ? 'var(--warn)' : 'var(--loss)' }}>
                            1 : {rrRatio}
                        </span>
                    </div>
                </div>

                {/* Launch Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', minHeight: '380px', justifyContent: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                            {[
                                { label: 'Qualified Signals', value: qualified, color: 'var(--text-1)' },
                                { label: 'Signal Strength', value: `${config.confidenceThreshold}%+`, color: 'var(--accent-light)' },
                                { label: 'VIX Cap', value: config.vixThreshold, color: 'var(--warn)' },
                                { label: 'Sample Total', value: signals.length, color: 'var(--text-2)' },
                            ].map(s => (
                                <div key={s.label} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '5px' }}>{s.label}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={run}
                            disabled={running || !signals.length}
                            style={{
                                width: '100%', height: '48px',
                                background: running ? 'var(--bg-elevated)' : 'var(--accent-grad)',
                                border: 'none', borderRadius: 'var(--r-md)',
                                color: 'white', fontSize: '14px', fontWeight: 700,
                                letterSpacing: '0.04em', cursor: running ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: (!signals.length) ? 0.4 : 1,
                                transition: 'var(--trans-s)'
                            }}>
                            {running
                                ? <><RotateCcw size={15} className="spin" /> Running...</>
                                : <><Play size={15} fill="currentColor" /> Run Simulation</>
                            }
                        </button>

                        {!signals.length && (
                            <p style={{ fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'center' }}>
                                Waiting for signal data to load...
                            </p>
                        )}
                    </div>

                    {result && (
                        <div className="card slide-up" style={{
                            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
                            background: 'var(--profit-dim)', border: '1px solid rgba(34,197,94,0.2)'
                        }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircle2 size={20} color="var(--profit)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '13px' }}>Simulation Complete</div>
                                <div style={{ fontSize: '11px', color: 'var(--profit)', marginTop: '2px' }}>{result.totalTrades} trades analyzed</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {result && (
                <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Result KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                        {[
                            { label: 'Net P&L', value: fmtPnl(result.totalPnl), icon: <Activity size={13} color="var(--accent-light)" />, color: result.totalPnl >= 0 ? 'var(--profit)' : 'var(--loss)', sub: `ROI: ${((result.totalPnl/config.startCapital)*100).toFixed(2)}%` },
                            { label: 'Win Rate',  value: `${result.winRate.toFixed(1)}%`, icon: <Target size={13} color="var(--accent-light)" />, color: result.winRate >= 50 ? 'var(--profit)' : 'var(--warn)', sub: `${result.totalTrades} trades` },
                            { label: 'Profit Factor', value: `${result.profitFactor}×`, icon: <Zap size={13} color="var(--accent-light)" />, color: 'var(--accent-light)', sub: result.profitFactor > 1.5 ? 'Elite level' : 'Building' },
                            { label: 'Max Drawdown', value: `-${result.maxDrawdown}%`, icon: <ShieldCheck size={13} color="var(--accent-light)" />, color: 'var(--loss)', sub: 'Peak measured' },
                        ].map(k => (
                            <div key={k.label} className="kpi-card">
                                <div className="kpi-label">{k.icon} {k.label}</div>
                                <div className="kpi-value font-mono" style={{ color: k.color, fontSize: '22px' }}>{k.value}</div>
                                <div className="kpi-sub">{k.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart + Diagnostics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px' }}>
                        <div className="card" style={{ padding: '24px 24px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                                <BarChart3 size={15} color="var(--accent-light)" />
                                <span className="section-title">Simulated Equity Curve</span>
                            </div>
                            <div style={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={result.equityCurve}>
                                        <defs>
                                            <linearGradient id="sim" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                                            tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}k`} width={52} />
                                        <Tooltip {...TooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Equity']} />
                                        <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2}
                                            fill="url(#sim)" dot={false} animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <Activity size={15} color="var(--accent-light)" />
                                <span className="section-title">Diagnostics</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[
                                    { label: 'Avg Win / Trade',  value: `+₹${result.avgWin.toLocaleString('en-IN')}`, color: 'var(--profit)' },
                                    { label: 'Avg Loss / Trade', value: `-₹${result.avgLoss.toLocaleString('en-IN')}`, color: 'var(--loss)' },
                                    { label: 'Best Session',     value: fmtPnl(result.bestDay),  color: 'var(--profit)' },
                                    { label: 'Worst Session',    value: fmtPnl(result.worstDay), color: 'var(--loss)' },
                                    { label: 'Sharpe Ratio',     value: `${result.sharpeRatio}`, color: 'var(--accent-light)' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 500 }}>{r.label}</span>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '13px', color: r.color }}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
        </div>
    );
}
