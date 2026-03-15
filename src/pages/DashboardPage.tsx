import { useMemo } from 'react';
import {
    Activity, Globe, Target, Cpu,
    AlertCircle,
    TrendingUp, TrendingDown, Minus as Neutral,
    Binary
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

                {/* Equity Chart */}
                <div className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header" style={{ marginBottom: '24px' }}>
                        <div>
                            <div className="section-title" style={{ fontSize: '16px' }}>Equity Growth Engine</div>
                            <div className="section-meta">Institutional performance tracking (Cumulative P&L)</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span className="chip" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', borderColor: 'rgba(99,102,241,0.2)' }}>Live Account</span>
                            <span className="chip">Last 30 cycles</span>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 280, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="timestamp" hide />
                                <YAxis
                                    axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }}
                                    tickFormatter={(v: number) => fmtShort(v)}
                                    width={56}
                                />
                                <Tooltip 
                                    {...TooltipStyle} 
                                    contentStyle={{ ...TooltipStyle.contentStyle, background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)' }}
                                    formatter={(v: any) => [fmt(v), 'Net P&L']} 
                                />
                                <Area type="monotone" dataKey="pnl" stroke="var(--accent-light)" strokeWidth={2.5}
                                    fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: 'var(--accent-light)', stroke: 'var(--bg-subtle)', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Precision Signal Card */}
                <div className="card" style={{
                    padding: '32px 28px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0', background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-4)' }}>Orchestrator</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-light)', marginTop: '4px' }}>{latest?.engineMode ?? 'STANDBY'}</div>
                        </div>
                        <div className="badge badge-accent" style={{ fontSize: '10px' }}>{latest?.regime || 'STABLE'}</div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DirectionCard sig={latest?.finalSignal ?? 'WAIT'} />
                    </div>

                    <div style={{ width: '100%', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                                Execution Confidence
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                                {(latest?.confidence ?? 0).toFixed(1)}<span style={{ fontSize: '11px', opacity: 0.4 }}>%</span>
                            </div>
                        </div>
                        <div className="progress-bar" style={{ height: '6px', background: 'var(--bg-elevated)' }}>
                            <div className="progress-fill" style={{
                                width: `${Math.abs(latest?.confidence ?? 0)}%`,
                                background: 'var(--accent-grad)',
                                boxShadow: '0 0 12px var(--accent-glow)'
                            }} />
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', fontStyle: 'italic' }}>
                            {latest?.confidence >= 30 ? 'Strong directional conviction' : 
                             latest?.confidence <= -30 ? 'High probability mean reversion' : 
                             'Awaiting institutional confirmation'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Deep Telemetry Grid ─────────────────────────────── */}
            <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                 <div style={{ 
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                     marginBottom: '20px', padding: '0 4px' 
                 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '3px', height: '16px', background: 'var(--accent)', borderRadius: '2px' }} />
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>v4.2.0 Deep Data Matrix</h3>
                        <span className="badge badge-accent" style={{ fontSize: '9px', padding: '2px 8px' }}>CLUSTER ACTIVE</span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Synchronized via Telemetry Sync v1.4
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '14px' }}>
                    <MiniStat label="PA Score" value={`${latest?.priceActionScore || 0}/100`} accent={latest?.priceActionScore >= 70 ? 'var(--profit)' : latest?.priceActionScore <= 30 ? 'var(--loss)' : 'var(--accent-light)'} />
                    <MiniStat label="POC Dist" value={latest?.pocDistance?.toFixed(2)} />
                    <MiniStat label="RSI (14)" value={latest?.rsi?.toFixed(1)} />
                    <MiniStat label="VOL (ATR)" value={latest?.volatilityATR?.toFixed(2)} />
                    <MiniStat label="Momentum" value={latest?.momentum?.toFixed(2)} />
                    <MiniStat label="Progress" value={`${((latest?.sessionProgress || 0) * 100).toFixed(0)}%`} accent="var(--warn)" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '14px' }}>
                <MiniStat label="ADX (Trend)" value={latest?.adx?.toFixed(1)} />
                <MiniStat label="GEX Expo" value={latest?.gammaExposure?.toFixed(3)} accent={(latest?.gammaExposure ?? 0) > 0 ? 'var(--profit)' : 'var(--loss)'} />
                <MiniStat label="IV Skew" value={latest?.ivSkew?.toFixed(3)} />
                <MiniStat label="VIX (Fear)" value={latest?.vix?.toFixed(2)} accent={(latest?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)'} />
                <MiniStat label="PCR Ratio" value={latest?.putCallRatio?.toFixed(3)} />
                <MiniStat label="Super" value={latest?.superTrend} accent="var(--accent-light)" />
            </div>

            {/* AI Insights Bar */}
            {latest?.aiInsights && (
                <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent)', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <div style={{ 
                             padding: '6px', borderRadius: '8px', background: 'var(--accent-dim)', color: 'var(--accent-light)'
                         }}>
                            <Binary size={16} />
                         </div>
                         <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Engine Insights</div>
                             <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginTop: '2px' }}>{latest.aiInsights}</div>
                         </div>
                    </div>
                </div>
            )}

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
