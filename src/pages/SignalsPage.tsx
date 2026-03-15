import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { useTrading } from '../hooks/useTrading';
import { LogicTags } from './DashboardPage';

function SignalBadge({ sig }: { sig: string }) {
    if (sig.includes('CE')) return <span className="badge badge-buy"><TrendingUp size={10} strokeWidth={2.5} /> BUY</span>;
    if (sig.includes('PE')) return <span className="badge badge-sell"><TrendingDown size={10} strokeWidth={2.5} /> SELL</span>;
    return <span className="badge badge-wait">{sig}</span>;
}


export default function SignalsPage() {
    const { signals } = useTrading();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('ALL');
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtered = useMemo(() => signals.filter(s => {
        const f = filter === 'ALL' ? true
            : filter === 'CE' ? s.finalSignal.includes('CE')
            : filter === 'PE' ? s.finalSignal.includes('PE')
            : s.finalSignal === 'WAIT' || s.finalSignal === 'AVOID' || s.finalSignal === 'SIDEWAYS';
        const q = search.toLowerCase();
        const m = !q || s.finalSignal.toLowerCase().includes(q) || (s.regime || '').toLowerCase().includes(q);
        return f && m;
    }), [signals, filter, search]);

    const counts = {
        all: signals.length,
        ce: signals.filter(s => s.finalSignal.includes('CE')).length,
        pe: signals.filter(s => s.finalSignal.includes('PE')).length,
    };

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Real-time Feed</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Market Signals</h2>
                </div>
                <span className="badge badge-live" style={{ fontSize: '11px' }}>
                    <span className="dot dot-green dot-pulse" /> {counts.all} signals
                </span>
            </div>

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                    { key: 'ALL', label: `All — ${counts.all}`, color: 'var(--text-1)' },
                    { key: 'CE',  label: `Buy (CE) — ${counts.ce}`, color: 'var(--profit)' },
                    { key: 'PE',  label: `Sell (PE) — ${counts.pe}`, color: 'var(--loss)' },
                    { key: 'WAIT',label: `Wait — ${counts.all - counts.ce - counts.pe}`, color: 'var(--text-3)' },
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '99px',
                            border: `1px solid ${filter === key ? 'var(--border-strong)' : 'var(--border)'}`,
                            background: filter === key ? 'var(--bg-elevated)' : 'transparent',
                            color: filter === key ? color : 'var(--text-3)',
                            fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', transition: 'var(--trans-s)'
                        }}
                    >
                        {label}
                    </button>
                ))}

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0 12px', height: '34px',
                    border: '1px solid var(--border)', borderRadius: '99px',
                    background: 'var(--bg-elevated)', marginLeft: 'auto'
                }}>
                    <Search size={13} color="var(--text-3)" />
                    <input
                        className="input-field"
                        style={{
                            border: 'none', background: 'transparent', width: '160px',
                            height: '100%', padding: '0', fontSize: '12.5px'
                        }}
                        placeholder="Search signals..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                            <tr>
                                <th style={{ width: 40, borderBottom: '1px solid var(--border)' }} />
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Time / Date</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Signal</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Confidence</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>LTP (Spot)</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>RSI (14)</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>ADX</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>PA Score</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Engine Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <React.Fragment key={s.id}>
                                    <tr onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                                        style={{ cursor: 'pointer' }}>
                                        <td style={{ textAlign: 'center', paddingLeft: '12px' }}>
                                            {expanded === s.id
                                                ? <ChevronDown size={13} color="var(--accent-light)" />
                                                : <ChevronRight size={13} color="var(--text-3)" />
                                            }
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '12.5px' }}>
                                                {new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '1px' }}>
                                                {new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td><SignalBadge sig={s.finalSignal} /></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '40px', height: '3px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                                                     <div style={{ 
                                                         width: `${Math.abs(s.confidence)}%`, 
                                                         height: '100%', 
                                                         background: s.confidence >= 0 ? 'var(--profit)' : 'var(--loss)' 
                                                     }} />
                                                </div>
                                                <span className="font-mono" style={{
                                                    fontWeight: 700, fontSize: '13px',
                                                    color: s.confidence >= 25 ? 'var(--profit)' : s.confidence <= -25 ? 'var(--loss)' : 'var(--text-2)'
                                                }}>
                                                    {s.confidence >= 0 ? '+' : ''}{s.confidence.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="font-mono" style={{ fontWeight: 500 }}>
                                            {s.spotPrice?.toLocaleString('en-IN') || '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px' }}>
                                            {s.rsi?.toFixed(1) || '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px' }}>
                                            {s.adx?.toFixed(1) || '—'}
                                        </td>
                                        <td>
                                            <span className="font-mono" style={{ 
                                                fontWeight: 600, 
                                                color: s.priceActionScore >= 70 ? 'var(--profit)' : s.priceActionScore <= 30 ? 'var(--loss)' : 'var(--text-2)'
                                            }}>
                                                {s.priceActionScore || '0'}<span style={{ fontSize: '10px', opacity: 0.5 }}>/100</span>
                                            </span>
                                        </td>
                                        <td><span className="chip" style={{ color: 'var(--accent-light)', borderColor: 'rgba(99,102,241,0.2)' }}>{s.engineMode || '—'}</span></td>
                                    </tr>

                                    {expanded === s.id && (
                                        <tr>
                                            <td colSpan={9} style={{ padding: 0, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                <div className="slide-up" style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                    
                                                    {/* Indicator Grid */}
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: '12px' }}>Technical Matrix</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px' }}>
                                                            {[
                                                                { label: 'SuperTrend', value: s.superTrend },
                                                                { label: 'Momentum', value: s.momentum?.toFixed(2) },
                                                                { label: 'PCR (Put/Call)', value: s.putCallRatio?.toFixed(3) },
                                                                { label: 'VIX Impact', value: s.vix?.toFixed(2) },
                                                                { label: 'Writers Zone', value: s.writersZone },
                                                                { label: 'Trend Streak', value: s.streakCount },
                                                            ].map(item => (
                                                                <div key={item.label} style={{
                                                                    padding: '14px', borderRadius: 'var(--r-md)',
                                                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)'
                                                                }}>
                                                                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '6px' }}>{item.label}</div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{item.value || '—'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Deep Data Telemetry */}
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-light)', marginBottom: '12px' }}>v4.2.0 Deep Telemetry</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                                                            {[
                                                                { label: 'PA Score', value: `${s.priceActionScore}/100`, sub: 'Price Action Integrity' },
                                                                { label: 'POC Distance', value: s.pocDistance?.toFixed(2), sub: 'Points from Value Area' },
                                                                { label: 'Volatility ATR', value: s.volatilityATR?.toFixed(2), sub: 'True range (14)' },
                                                                { label: 'Session Progress', value: `${(s.sessionProgress * 100).toFixed(0)}%`, sub: 'Market day completion' },
                                                                { label: 'GEX Exposure', value: s.gammaExposure?.toLocaleString(), sub: 'Gamma Exposure Units' },
                                                                { label: 'IV Skew', value: s.ivSkew?.toFixed(3), sub: 'Options Sentiment' },
                                                            ].map(item => (
                                                                <div key={item.label} style={{
                                                                    padding: '14px', borderRadius: 'var(--r-md)',
                                                                    background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)'
                                                                }}>
                                                                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-light)', marginBottom: '6px' }}>{item.label}</div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{item.value || '—'}</div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>{item.sub}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* AI Insights (if available for specific signal) */}
                                                    {s.aiInsights && (
                                                        <div style={{ 
                                                            padding: '20px', borderRadius: 'var(--r-lg)', 
                                                            background: 'linear-gradient(90deg, var(--bg-elevated) 0%, transparent 100%)',
                                                            border: '1px solid var(--border)',
                                                            borderLeft: '4px solid var(--accent)'
                                                        }}>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-light)', marginBottom: '8px' }}>AI Engine Commentary</div>
                                                            <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 500 }}>{s.aiInsights}</div>
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-light)', marginBottom: '10px' }}>Signal Reasoning</div>
                                                            <LogicTags reason={s.reason} />
                                                        </div>
                                                        {s.blockedReason && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                                padding: '16px', borderRadius: 'var(--r-lg)',
                                                                background: 'var(--loss-dim)', border: '1px solid rgba(244, 63, 94, 0.2)',
                                                                maxWidth: '400px'
                                                            }}>
                                                                <ShieldAlert size={18} color="var(--loss)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                                <div>
                                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--loss)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Filter Blocked Execution</div>
                                                                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.5 }}>{s.blockedReason}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}

                            {filtered.length === 0 && (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '64px', color: 'var(--text-3)', fontSize: '14px' }}>No signals match the current filter criteria</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        </div>
    );
}
