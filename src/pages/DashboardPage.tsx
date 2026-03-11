import { useMemo } from 'react';
import {
    Activity, Globe, Target, Cpu,
    AlertCircle,
    TrendingUp, TrendingDown, Minus as Neutral
} from 'lucide-react';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useTrading } from '../hooks/useTrading';

const fmt = (v: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(v);

const fmtShort = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (abs >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
};

export function LogicTags({ reason }: { reason?: string }) {
    if (!reason) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {reason.split('|').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="chip">{tag}</span>
            ))}
        </div>
    );
}

function DirectionCard({ sig }: { sig: string }) {
    const isBull = sig?.includes('CE');
    const isBear = sig?.includes('PE');

    if (isBull) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'var(--profit-dim)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(34,197,94,0.15)'
            }}>
                <TrendingUp size={28} color="var(--profit)" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--profit)', letterSpacing: '-0.01em' }}>BULLISH</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>Current Bias</div>
            </div>
        </div>
    );

    if (isBear) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'var(--loss-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(239,68,68,0.15)'
            }}>
                <TrendingDown size={28} color="var(--loss)" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--loss)', letterSpacing: '-0.01em' }}>BEARISH</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>Current Bias</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.4 }}>
            <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Neutral size={28} color="var(--text-3)" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>NEUTRAL</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>Awaiting Signal</div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, accent }: { label: string; value: any; accent?: string }) {
    return (
        <div style={{
            padding: '14px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: accent || 'var(--text-1)', fontFamily: 'var(--font-mono, monospace)' }}>{value ?? '—'}</div>
        </div>
    );
}

const TooltipStyle = {
    contentStyle: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', fontSize: '12px', padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

export default function DashboardPage() {
    const { signals, stats, marketData, tradeSummary } = useTrading();
    const latest = signals[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = useMemo(() =>
        tradeSummary.filter(h => h.timestamp.startsWith(todayStr)),
        [tradeSummary, todayStr]
    );
    const todayPnL = todayTrades.reduce((s: number, t: any) => s + (t.pnl || 0), 0);

    const chartData = tradeSummary.slice().reverse().slice(-30);

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* ── Alert ──────────────────────────────────────────── */}
            {latest?.blockedReason && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--loss-dim)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--r-lg)'
                }}>
                    <AlertCircle size={16} color="var(--loss)" style={{ flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--loss)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Override Active</div>
                        <div style={{ fontSize: '13px', color: '#fca5a5', marginTop: '2px' }}>{latest.blockedReason}</div>
                    </div>
                </div>
            )}

            {/* ── KPIs ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                <div className="kpi-card" style={{ '--delay': '0ms' } as any}>
                    <div className="kpi-label"><Activity size={13} color="var(--accent-light)" /> Daily P&amp;L</div>
                    <div className="kpi-value" style={{ color: todayPnL >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                        {fmtShort(Math.round(todayPnL))}
                    </div>
                    <div className="kpi-sub">{todayTrades.length} trades today</div>
                </div>

                <div className="kpi-card" style={{ '--delay': '60ms' } as any}>
                    <div className="kpi-label"><Target size={13} color="var(--accent-light)" /> Total P&amp;L</div>
                    <div className="kpi-value" style={{ color: (stats?.totalPnL ?? 0) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                        {fmtShort(stats?.totalPnL ?? 0)}
                    </div>
                    <div className="kpi-sub">{stats?.totalTrades ?? 0} total trades</div>
                </div>

                <div className="kpi-card" style={{ '--delay': '120ms' } as any}>
                    <div className="kpi-label"><Cpu size={13} color="var(--accent-light)" /> Win Rate</div>
                    <div className="kpi-value">{stats?.winRate ?? 0}%</div>
                    <div className="kpi-sub">Profit factor: {stats?.profitFactor?.toFixed(2) ?? '0.00'}</div>
                </div>

                <div className="kpi-card" style={{ '--delay': '180ms' } as any}>
                    <div className="kpi-label"><Globe size={13} color="var(--accent-light)" /> Nifty 50</div>
                    <div className="kpi-value font-mono" style={{ fontSize: '22px' }}>
                        {marketData?.niftyLTP?.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className={`dot ${marketData?.marketOpen ? 'dot-green' : 'dot-gray'}`} />
                        {marketData?.marketOpen ? 'Market open' : 'Market closed'}
                    </div>
                </div>
            </div>

            {/* ── Main Grid ──────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

                {/* Equity Chart */}
                <div className="card" style={{ padding: '24px 24px 16px' }}>
                    <div className="section-header" style={{ marginBottom: '20px' }}>
                        <div>
                            <div className="section-title">Equity Curve</div>
                            <div className="section-meta">Cumulative P&L over time</div>
                        </div>
                        <span className="chip">Last 30 trades</span>
                    </div>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="timestamp" hide />
                                <YAxis
                                    axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                                    tickFormatter={(v: number) => fmtShort(v)}
                                    width={52}
                                />
                                <Tooltip {...TooltipStyle} formatter={(v: any) => [fmt(v), 'P&L']} />
                                <Area type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2}
                                    fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Signal Card */}
                <div className="card" style={{
                    padding: '28px 24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0', justifyContent: 'space-between'
                }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Mode</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginTop: '2px' }}>{latest?.engineMode ?? '—'}</div>
                        </div>
                        <div className="chip">{latest?.regime ?? 'STABLE'}</div>
                    </div>

                    <DirectionCard sig={latest?.finalSignal ?? 'WAIT'} />

                    <div style={{ width: '100%', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'center', marginBottom: '10px' }}>
                            Confidence
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{
                                width: `${Math.abs(latest?.confidence ?? 0)}%`,
                                background: 'var(--accent-grad)'
                            }} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', marginTop: '10px', letterSpacing: '-0.02em' }}>
                            {(latest?.confidence ?? 0).toFixed(0)}<span style={{ fontSize: '14px', opacity: 0.4 }}>%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mini Stats Grid ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px' }}>
                <MiniStat label="RSI" value={(latest as any)?.rsi?.toFixed(1)} />
                <MiniStat label="ADX" value={latest?.adx?.toFixed(1)} />
                <MiniStat label="Momentum" value={latest?.momentum?.toFixed(2)} />
                <MiniStat label="Super Trend" value={latest?.superTrend} />
                <MiniStat label="VIX" value={latest?.vix?.toFixed(2)} accent={(latest?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)'} />
                <MiniStat label="Engine" value={latest?.engineVersion ?? 'v4.0'} accent="var(--accent-light)" />
            </div>

            {/* ── Logic Trace ─────────────────────────────────────── */}
            {latest?.reason && (
                <div className="card" style={{ padding: '20px 24px' }}>
                    <div className="section-header" style={{ marginBottom: '14px' }}>
                        <div className="section-title">Decision Logic Trace</div>
                        <span className="chip">{signals.length} signals loaded</span>
                    </div>
                    <LogicTags reason={latest.reason} />
                </div>
            )}

        </div>
        </div>
    );
}
