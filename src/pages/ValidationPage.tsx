import { useMemo, useState, Fragment } from 'react';
import {
    ShieldCheck, Globe, Activity,
    FileText, ChevronDown, ChevronRight,
    Download, Cpu, TrendingUp, TrendingDown
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, Tooltip,
    ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useTrading } from '../hooks/useTrading';

const TooltipStyle = {
    contentStyle: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', fontSize: '12px', padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

export default function ValidationPage() {
    const { signals, marketData } = useTrading();
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    /**
     * SIGNAL AUDIT RESULT CALCULATION (Fixed)
     * 
     * Previous bug: All signals compared against the live Nifty price,
     * causing results to flip every time the price updated.
     * 
     * Correct approach:
     * 1. Signals < 10 mins old  → PENDING (too early to evaluate)
     * 2. Signals 10-30 mins old → Compare against LIVE price (evaluation window)
     * 3. Signals > 30 mins old  → Compare against the spot price from a LATER
     *    signal row (closest to 15-30 mins after). This LOCKS IN the result
     *    permanently so it never changes again.
     */
    const analyzed = useMemo(() => {
        const liveNifty = marketData?.niftyLTP ?? 0;
        const nowMs = Date.now();

        // Signals are sorted newest-first, so we work with a time-sorted copy
        // to find the "comparison price" from a later signal for old entries
        const chronological = [...signals].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return signals.map(s => {
            const entry = s.spotPrice ?? 0;
            const signalTimeMs = new Date(s.timestamp).getTime();
            const ageMinutes = (nowMs - signalTimeMs) / 60000;

            let comparePrice = 0;
            let priceSource: 'PENDING' | 'LIVE' | 'LOCKED' = 'PENDING';

            if (ageMinutes < 10) {
                // Too early — not enough time for price to move
                comparePrice = 0;
                priceSource = 'PENDING';
            } else if (ageMinutes < 30) {
                // Evaluation window — use live price
                comparePrice = liveNifty;
                priceSource = 'LIVE';
            } else {
                // Signal is old enough — find the spot price from a later signal
                // that was generated 10-30 minutes after this one (locked result)
                const targetWindowStart = signalTimeMs + 10 * 60000; // +10 min
                const targetWindowEnd = signalTimeMs + 45 * 60000;   // +45 min (wide window)

                let bestMatch: typeof signals[0] | null = null;
                let bestTimeDiff = Infinity;

                for (const later of chronological) {
                    const laterMs = new Date(later.timestamp).getTime();
                    if (laterMs <= signalTimeMs) continue; // Skip same or earlier
                    if (laterMs < targetWindowStart) continue; // Too close
                    if (laterMs > targetWindowEnd) break; // Past the window

                    // Prefer the signal closest to 15 minutes after
                    const idealTarget = signalTimeMs + 15 * 60000;
                    const diff = Math.abs(laterMs - idealTarget);
                    if (diff < bestTimeDiff && later.spotPrice > 0) {
                        bestTimeDiff = diff;
                        bestMatch = later;
                    }
                }

                if (bestMatch && bestMatch.spotPrice > 0) {
                    comparePrice = bestMatch.spotPrice;
                    priceSource = 'LOCKED';
                } else {
                    // No later signal found in window — use live as fallback
                    // (this can happen for the most recent signals on the boundary)
                    comparePrice = liveNifty;
                    priceSource = liveNifty > 0 ? 'LIVE' : 'PENDING';
                }
            }

            const diff = comparePrice > 0 ? comparePrice - entry : 0;
            const pct = entry && comparePrice ? (diff / entry) * 100 : 0;

            let status = 'PENDING';
            if (priceSource !== 'PENDING' && comparePrice > 0 && entry > 0) {
                if (s.finalSignal.includes('CE')) {
                    status = diff > 0 ? 'CORRECT' : diff < 0 ? 'INCORRECT' : 'PENDING';
                } else if (s.finalSignal.includes('PE')) {
                    status = diff < 0 ? 'CORRECT' : diff > 0 ? 'INCORRECT' : 'PENDING';
                }
            }

            const qScore = (s.confidence > 25 ? 3 : 1) + ((s.adx ?? 0) > 25 ? 3 : 1) + (Math.abs(s.momentum ?? 0) > 10 ? 4 : 2);
            return { ...s, comparePrice, priceSource, status, diff, pct, qScore };
        });
    }, [signals, marketData]);

    const regimeStats = useMemo(() => {
        const map: Record<string, { regime: string; total: number; correct: number }> = {};
        analyzed.forEach(s => {
            const r = s.regime || 'NORMAL';
            if (!map[r]) map[r] = { regime: r, total: 0, correct: 0 };
            map[r].total++;
            if (s.status === 'CORRECT') map[r].correct++;
        });
        return Object.values(map).map(r => ({
            ...r,
            winRate: Math.round((r.correct / (r.total || 1)) * 100)
        })).sort((a, b) => b.winRate - a.winRate);
    }, [analyzed]);

    const hourly = useMemo(() => {
        const h: Record<number, { hour: string; total: number; correct: number }> = {};
        analyzed.forEach(s => {
            const hr = new Date(s.timestamp).getHours();
            if (!h[hr]) h[hr] = { hour: `${hr}:00`, total: 0, correct: 0 };
            h[hr].total++;
            if (s.status === 'CORRECT') h[hr].correct++;
        });
        return Object.values(h).map(x => ({
            ...x,
            winRate: Math.round((x.correct / (x.total || 1)) * 100)
        })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }, [analyzed]);

    const correct = analyzed.filter(a => a.status === 'CORRECT').length;
    const tradeable = analyzed.filter(a => a.status !== 'PENDING').length;
    const accuracy = tradeable > 0 ? (correct / tradeable) * 100 : 0;

    const handleExport = () => {
        const csv = [
            'Timestamp,Signal,Entry Price,Compare Price,Price Source,Move %,Status,RSI,Confidence,ADX',
            ...analyzed.map(a => `${a.timestamp},${a.finalSignal},${a.spotPrice},${a.comparePrice},${a.priceSource},${a.pct.toFixed(2)},${a.status},${(a as any).rsi?.toFixed(1)},${a.confidence},${a.adx?.toFixed(1)}`)
        ].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        Object.assign(document.createElement('a'), { href: url, download: `zenith_audit_${new Date().toISOString().split('T')[0]}.csv` }).click();
    };

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Strategy Verification</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Signal Audit</h2>
                </div>
                <button
                    onClick={handleExport}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '7px 16px', borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                        color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600,
                        cursor: 'pointer', transition: 'var(--trans-s)'
                    }}
                >
                    <Download size={13} /> Export CSV
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                <div className="kpi-card">
                    <div className="kpi-label"><ShieldCheck size={13} color="var(--accent-light)" /> Accuracy</div>
                    <div className="kpi-value" style={{ color: accuracy > 60 ? 'var(--profit)' : 'var(--accent-light)' }}>
                        {accuracy.toFixed(1)}%
                    </div>
                    <div className="kpi-sub">{correct} of {tradeable} correct</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Globe size={13} color="var(--accent-light)" /> Live Nifty</div>
                    <div className="kpi-value font-mono" style={{ fontSize: '22px' }}>
                        {marketData?.niftyLTP?.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="kpi-sub">Reference price</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Activity size={13} color="var(--accent-light)" /> VIX</div>
                    <div className="kpi-value" style={{ color: (marketData?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)' }}>
                        {marketData?.vix?.toFixed(2) ?? '—'}
                    </div>
                    <div className="kpi-sub">Risk: {(marketData?.vix ?? 0) > 18 ? 'Elevated' : 'Normal'}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Cpu size={13} color="var(--accent-light)" /> Sample Size</div>
                    <div className="kpi-value font-mono">{analyzed.length}</div>
                    <div className="kpi-sub">{analyzed.filter(a => a.priceSource === 'LOCKED').length} locked · {analyzed.filter(a => a.priceSource === 'PENDING').length} pending</div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={15} color="var(--accent-light)" />
                        <span className="section-title">Signal Performance Log</span>
                    </div>
                    <span className="section-meta">Showing all {analyzed.length} entries</span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                            <tr>
                                <th style={{ width: 40, borderBottom: '1px solid var(--border)' }} />
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Time</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Direction</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Entry Price</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Compare Price</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Move</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Result</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Quality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyzed.map((a, i) => (
                                <Fragment key={i}>
                                    <tr onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                        style={{ cursor: 'pointer' }}>
                                        <td style={{ textAlign: 'center', paddingLeft: '12px' }}>
                                            {expandedRow === i
                                                ? <ChevronDown size={13} color="var(--accent-light)" />
                                                : <ChevronRight size={13} color="var(--text-3)" />
                                            }
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '12.5px' }}>
                                                {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '1px' }}>
                                                {new Date(a.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${a.finalSignal.includes('CE') ? 'badge-buy' : a.finalSignal.includes('PE') ? 'badge-sell' : 'badge-wait'}`}>
                                                {a.finalSignal.includes('CE') ? <TrendingUp size={10} /> : a.finalSignal.includes('PE') ? <TrendingDown size={10} /> : null}
                                                {a.finalSignal}
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                                            {a.spotPrice?.toFixed(2) ?? '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px', color: 'var(--text-1)' }}>
                                            {a.priceSource === 'PENDING' ? (
                                                <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Awaiting…</span>
                                            ) : (
                                                <div>
                                                    <span>{a.comparePrice?.toFixed(2)}</span>
                                                    <span style={{
                                                        marginLeft: '6px', fontSize: '9px', fontWeight: 700,
                                                        padding: '1px 5px', borderRadius: '4px',
                                                        background: a.priceSource === 'LOCKED' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                                                        color: a.priceSource === 'LOCKED' ? 'var(--profit)' : 'var(--accent-light)',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {a.priceSource === 'LOCKED' ? '🔒 LOCKED' : '⏱ LIVE'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-mono" style={{ fontWeight: 700, color: a.priceSource === 'PENDING' ? 'var(--text-3)' : a.diff > 0 ? 'var(--profit)' : a.diff < 0 ? 'var(--loss)' : 'var(--text-3)' }}>
                                            {a.priceSource === 'PENDING' ? '—' : `${a.diff > 0 ? '+' : ''}${a.pct.toFixed(2)}%`}
                                        </td>
                                        <td>
                                            {a.status === 'CORRECT'
                                                ? <span className="badge badge-buy"><TrendingUp size={10} /> HIT</span>
                                                : a.status === 'INCORRECT'
                                                ? <span className="badge badge-sell"><TrendingDown size={10} /> MISS</span>
                                                : <span className="badge badge-wait">—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="progress-bar" style={{ width: '60px' }}>
                                                    <div className="progress-fill" style={{ width: `${(a.qScore / 10) * 100}%`, background: 'var(--accent-grad)' }} />
                                                </div>
                                                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.qScore}/10</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedRow === i && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 0, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                <div className="slide-up" style={{ padding: '20px 40px', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
                                                    {[
                                                        { label: 'RSI', value: (a as any).rsi?.toFixed(1) },
                                                        { label: 'ADX', value: a.adx?.toFixed(1) },
                                                        { label: 'Confidence', value: `${a.confidence}%` },
                                                        { label: 'PCR', value: a.putCallRatio?.toFixed(2) },
                                                        { label: 'Mode', value: a.engineMode },
                                                        { label: 'Price Move', value: `${a.diff > 0 ? '+' : ''}${a.diff.toFixed(1)} (${a.pct.toFixed(2)}%)` }
                                                    ].map(item => (
                                                        <div key={item.label} style={{
                                                            padding: '10px 12px', background: 'var(--bg-elevated)',
                                                            borderRadius: 8, border: '1px solid var(--border)'
                                                        }}>
                                                            <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '4px' }}>{item.label}</div>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>{item.value ?? '—'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analytics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Regime table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span className="section-title">Accuracy by Market Regime</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Regime</th>
                                <th>Samples</th>
                                <th>Accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regimeStats.map(r => (
                                <tr key={r.regime}>
                                    <td><span className="chip">{r.regime}</span></td>
                                    <td className="font-mono">{r.total}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ width: '50px' }}>
                                                <div className="progress-fill" style={{
                                                    width: `${r.winRate}%`,
                                                    background: r.winRate > 60 ? 'var(--profit)' : 'var(--accent)'
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '12.5px', color: r.winRate > 60 ? 'var(--profit)' : 'var(--text-2)' }}>{r.winRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Hourly chart */}
                <div className="card" style={{ padding: '20px 20px 16px' }}>
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <span className="section-title">Hourly Accuracy</span>
                    </div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourly} barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} />
                                <Tooltip {...TooltipStyle} formatter={(v: any) => [`${v}%`, 'Accuracy']} />
                                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                                    {hourly.map((e, i) => (
                                        <Cell key={i} fill={e.winRate > 60 ? '#22c55e' : '#6366f1'} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
        </div>
    );
}
