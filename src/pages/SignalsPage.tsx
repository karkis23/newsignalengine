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
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }} />
                                <th>Time</th>
                                <th>Direction</th>
                                <th>Confidence</th>
                                <th>Spot Price</th>
                                <th>RSI</th>
                                <th>ADX</th>
                                <th>Regime</th>
                                <th>Mode</th>
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
                                            <span className="font-mono" style={{
                                                fontWeight: 700, fontSize: '13px',
                                                color: s.confidence >= 25 ? 'var(--profit)' : s.confidence <= -25 ? 'var(--loss)' : 'var(--text-2)'
                                            }}>
                                                {s.confidence >= 0 ? '+' : ''}{s.confidence.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ fontWeight: 500 }}>
                                            {s.spotPrice?.toLocaleString('en-IN') || '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px' }}>
                                            {(s as any).rsi?.toFixed(1) || '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px' }}>
                                            {s.adx?.toFixed(1) || '—'}
                                        </td>
                                        <td><span className="chip">{s.regime || 'NORMAL'}</span></td>
                                        <td><span className="chip" style={{ color: 'var(--accent-light)', borderColor: 'rgba(99,102,241,0.2)' }}>{s.engineMode || '—'}</span></td>
                                    </tr>

                                    {expanded === s.id && (
                                        <tr>
                                            <td colSpan={9} style={{ padding: 0, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                <div className="slide-up" style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    {/* Indicator Grid */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
                                                        {[
                                                            { label: 'SuperTrend', value: s.superTrend },
                                                            { label: 'Momentum', value: s.momentum?.toFixed(2) },
                                                            { label: 'PCR', value: s.putCallRatio?.toFixed(2) },
                                                            { label: 'IV Skew', value: (s.ivSkew as any)?.toFixed(2) },
                                                            { label: 'Writers Zone', value: s.writersZone },
                                                            { label: 'Streak', value: s.streakCount },
                                                        ].map(item => (
                                                            <div key={item.label} style={{
                                                                padding: '12px', borderRadius: 'var(--r-md)',
                                                                background: 'var(--bg-elevated)', border: '1px solid var(--border)'
                                                            }}>
                                                                <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '4px' }}>{item.label}</div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{item.value || '—'}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-light)', marginBottom: '8px' }}>Signal Reasoning</div>
                                                            <LogicTags reason={s.reason} />
                                                        </div>
                                                        {s.blockedReason && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                                                padding: '14px 16px', borderRadius: 'var(--r-lg)',
                                                                background: 'var(--loss-dim)', border: '1px solid rgba(239,68,68,0.2)',
                                                                maxWidth: '340px'
                                                            }}>
                                                                <ShieldAlert size={15} color="var(--loss)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                                                <div>
                                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--loss)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Blocked</div>
                                                                    <div style={{ fontSize: '12.5px', color: '#fca5a5', marginTop: '3px' }}>{s.blockedReason}</div>
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
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)', fontSize: '13px' }}>No signals match your filters</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        </div>
    );
}
