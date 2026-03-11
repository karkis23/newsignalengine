import { useMemo } from 'react';
import {
    Clock, ShieldCheck, Briefcase,
    TrendingUp, TrendingDown, Target, Activity
} from 'lucide-react';
import { useTrading } from '../hooks/useTrading';

const fmt = (n: number) => {
    const abs = Math.abs(n);
    const sign = n >= 0 ? '+' : '-';
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
};

const fmtTime = (iso: string) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
        });
    } catch { return iso; }
};

export default function TradesPage() {
    const { activeTrades, tradeSummary, loading } = useTrading();

    const closedTrades = tradeSummary.filter(t => t.status && !['ACTIVE', 'OPEN', ''].includes(t.status));
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayTrades = closedTrades.filter(t => t.timestamp?.startsWith(todayStr));
    const todayPnL = todayTrades.reduce((s, t) => s + t.pnl, 0);

    const todayWinRate = useMemo(() => {
        const wins = todayTrades.filter(t => t.pnl > 0).length;
        return todayTrades.length ? Math.round((wins / todayTrades.length) * 100) : 0;
    }, [todayTrades]);

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Page header */}
            <div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Asset Management</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Positions</h2>
            </div>

            {/* KPI bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                <div className="kpi-card">
                    <div className="kpi-label"><Activity size={13} color="var(--accent-light)" /> Session P&L</div>
                    <div className="kpi-value" style={{ color: todayPnL >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                        {fmt(Math.round(todayPnL))}
                    </div>
                    <div className="kpi-sub">{todayTrades.length} settled today</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Briefcase size={13} color="var(--accent-light)" /> Active</div>
                    <div className="kpi-value font-mono">{activeTrades.length}</div>
                    <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className={`dot ${activeTrades.length > 0 ? 'dot-green dot-pulse' : 'dot-gray'}`} />
                        {activeTrades.length > 0 ? 'Capital deployed' : 'Flat'}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Target size={13} color="var(--accent-light)" /> Session Win Rate</div>
                    <div className="kpi-value">{todayWinRate}%</div>
                    <div className="kpi-sub">{todayTrades.filter(t => t.pnl > 0).length} wins · {todayTrades.filter(t => t.pnl < 0).length} losses</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><ShieldCheck size={13} color="var(--accent-light)" /> Risk Profile</div>
                    <div className="kpi-value">1 : 2</div>
                    <div className="kpi-sub">Target reward ratio</div>
                </div>
            </div>

            {/* Active Positions */}
            <div>
                <div className="section-header" style={{ marginBottom: '14px' }}>
                    <div className="section-title">Open Positions</div>
                    {activeTrades.length > 0 && <span className="badge badge-live">LIVE</span>}
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                        {[1,2,3].map(i => (
                            <div key={i} className="card" style={{ height: 200, opacity: 0.3, animation: 'none' }} />
                        ))}
                    </div>
                ) : activeTrades.length === 0 ? (
                    <div className="card" style={{
                        padding: '60px 24px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '10px', textAlign: 'center'
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px'
                        }}>
                            <Target size={22} color="var(--text-4)" />
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-2)' }}>No Open Positions</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: '280px', lineHeight: 1.6 }}>
                            The engine is monitoring the market. No capital is currently at risk.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
                        {activeTrades.map(t => {
                            const isCE = t.tradingSymbol?.includes('CE');
                            return (
                                <div key={t.entryOrderId} className="card" style={{ padding: '20px' }}>
                                    {/* Top row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '3px' }}>Active Position</div>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)' }}>{t.tradingSymbol}</div>
                                        </div>
                                        <span className={`badge ${isCE ? 'badge-buy' : 'badge-sell'}`}>
                                            {isCE ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {isCE ? 'CALL' : 'PUT'}
                                        </span>
                                    </div>

                                    {/* Price grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                        {[
                                            { label: 'Entry', value: `₹${t.entryPrice}` },
                                            { label: 'Qty', value: t.quantity },
                                            { label: 'Stop Loss', value: `₹${t.stopLoss}`, color: 'var(--loss)' },
                                            { label: 'Target', value: `₹${t.target}`, color: 'var(--profit)' },
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                padding: '10px 12px', background: 'var(--bg-elevated)',
                                                borderRadius: 8, border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '3px' }}>{item.label}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: (item as any).color || 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* R:R bar */}
                                    <div className="progress-bar" style={{ marginBottom: '8px' }}>
                                        <div className="progress-fill" style={{ width: '40%', background: 'var(--loss)', opacity: 0.6, borderRadius: '99px 0 0 99px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)' }}>
                                        <span style={{ color: 'var(--loss)' }}>SL: ₹{t.stopLoss}</span>
                                        <span style={{ color: 'var(--profit)' }}>TGT: ₹{t.target}</span>
                                    </div>

                                    {/* Footer */}
                                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-3)' }}>
                                            <Clock size={11} />
                                            {fmtTime(t.timestamp)}
                                        </div>
                                        <span className="badge badge-info">MANAGED</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* History Table */}
            <div>
                <div className="section-header" style={{ marginBottom: '14px' }}>
                    <div className="section-title">Recent Settlement History</div>
                    <span className="section-meta">{closedTrades.length} total closed</span>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Settled</th>
                                <th>Symbol</th>
                                <th>Side</th>
                                <th>Entry / Exit</th>
                                <th>Realized P&L</th>
                                <th>Exit Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {closedTrades.slice(0, 50).map(t => {
                                const win = t.pnl > 0;
                                const isCE = t.signal?.includes('CE');
                                return (
                                    <tr key={t.entryOrderId}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: '12.5px' }}>{fmtTime(t.timestamp).split(',')[1]?.trim()}</div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '1px' }}>{fmtTime(t.timestamp).split(',')[0]}</div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{t.tradingSymbol}</td>
                                        <td><span className={`badge ${isCE ? 'badge-buy' : 'badge-sell'}`}>{isCE ? 'CALL' : 'PUT'}</span></td>
                                        <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                                            {t.entryPrice} → {t.exitPrice || '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontWeight: 700, fontSize: '13px', color: win ? 'var(--profit)' : 'var(--loss)' }}>
                                            {fmt(Math.round(t.pnl))}
                                        </td>
                                        <td>
                                            <span className="chip" style={{ color: win ? 'var(--profit)' : 'var(--loss)' }}>
                                                {t.exitType || 'SYSTEM'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {closedTrades.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', fontSize: '13px' }}>No closed trades yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        </div>
    );
}
