import { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Clock, Download } from 'lucide-react';
import { useTrading } from '../hooks/useTrading';

const fmtPnl = (n: number) =>
    `${n >= 0 ? '+' : '-'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

const fmtShort = (n: number) => {
    const abs = Math.abs(n);
    const sign = n >= 0 ? '+' : '-';
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
};

const fmtDt = (iso: string) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
        });
    } catch { return iso; }
};

const FILTERS = [
    { key: 'ALL',    label: 'All' },
    { key: 'WIN',    label: 'Wins' },
    { key: 'LOSS',   label: 'Losses' },
    { key: 'CE',     label: 'Call' },
    { key: 'PE',     label: 'Put' },
    { key: 'ACTIVE', label: 'Open' },
];

export default function HistoryPage() {
    const { tradeSummary, stats } = useTrading();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    const allTrades = useMemo(() =>
        tradeSummary.filter(t => t.entryOrderId || t.tradingSymbol),
        [tradeSummary]
    );

    const filtered = useMemo(() => allTrades.filter(t => {
        const ok =
            filter === 'ALL' ||
            (filter === 'WIN'    && t.pnl > 0) ||
            (filter === 'LOSS'   && t.pnl < 0) ||
            (filter === 'CE'     && t.signal?.includes('CE')) ||
            (filter === 'PE'     && t.signal?.includes('PE')) ||
            (filter === 'ACTIVE' && (t.status === 'ACTIVE' || t.status === 'OPEN'));
        const q = search.toLowerCase();
        const match = !q ||
            (t.tradingSymbol || '').toLowerCase().includes(q) ||
            (t.entryOrderId  || '').toLowerCase().includes(q);
        return ok && match;
    }), [allTrades, search, filter]);

    const handleExport = () => {
        const rows = ['Time,Symbol,Side,Entry,Exit,P&L,Reason,Status',
            ...filtered.map(t => `${t.timestamp},${t.tradingSymbol},${t.signal?.includes('CE') ? 'CALL' : 'PUT'},${t.entryPrice},${t.exitPrice || ''},${Math.round(t.pnl)},${t.exitType},${t.status}`)
        ].join('\n');
        const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
        Object.assign(document.createElement('a'), { href: url, download: `zenith_history_${new Date().toISOString().split('T')[0]}.csv` }).click();
    };

    const winCount  = allTrades.filter(t => t.pnl > 0).length;
    const lossCount = allTrades.filter(t => t.pnl < 0).length;

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Page title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Portfolio</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Trade History</h2>
                </div>
                <button onClick={handleExport} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '7px 16px', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                    color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                }}>
                    <Download size={13} /> Export
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                <div className="kpi-card">
                    <div className="kpi-label">Total P&L</div>
                    <div className="kpi-value" style={{ color: (stats?.totalPnL ?? 0) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                        {fmtShort(stats?.totalPnL ?? 0)}
                    </div>
                    <div className="kpi-sub">{stats?.totalTrades ?? 0} trades logged</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Win Rate</div>
                    <div className="kpi-value" style={{ color: 'var(--profit)' }}>{stats?.winRate ?? 0}%</div>
                    <div className="kpi-sub">{winCount} wins · {lossCount} losses</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Average Win</div>
                    <div className="kpi-value font-mono" style={{ color: 'var(--profit)' }}>
                        +₹{(stats?.avgWin ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="kpi-sub">Per winning trade</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Average Loss</div>
                    <div className="kpi-value font-mono" style={{ color: 'var(--loss)' }}>
                        -₹{(stats?.avgLoss ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="kpi-sub">Per losing trade</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: '6px 14px', borderRadius: '99px',
                        border: `1px solid ${filter === f.key ? 'var(--border-strong)' : 'var(--border)'}`,
                        background: filter === f.key ? 'var(--bg-elevated)' : 'transparent',
                        color: filter === f.key ? 'var(--text-1)' : 'var(--text-3)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'var(--trans-s)'
                    }}>
                        {f.label}
                    </button>
                ))}

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0 12px', height: '34px', marginLeft: 'auto',
                    border: '1px solid var(--border)', borderRadius: '99px',
                    background: 'var(--bg-elevated)'
                }}>
                    <Search size={13} color="var(--text-3)" />
                    <input
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '160px', color: 'var(--text-1)', fontFamily: 'inherit' }}
                        placeholder="Search symbol or order ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 500 }}>
                    {filtered.length} records
                </span>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Symbol</th>
                                <th>Side</th>
                                <th>Entry</th>
                                <th>Exit</th>
                                <th>P&L</th>
                                <th>Reason</th>
                                <th>RR</th>
                                <th>VIX</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t, i) => {
                                const isWin    = t.pnl > 0;
                                const isActive = t.status === 'ACTIVE' || t.status === 'OPEN';
                                const isCE     = t.signal?.includes('CE');
                                return (
                                    <tr key={t.entryOrderId || i}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
                                                <Clock size={11} />
                                                {fmtDt(t.timestamp)}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px' }}>
                                            {t.tradingSymbol || '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${isCE ? 'badge-buy' : 'badge-sell'}`}>
                                                {isCE ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {isCE ? 'CALL' : 'PUT'}
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px' }}>₹{t.entryPrice || '—'}</td>
                                        <td className="font-mono" style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>{t.exitPrice ? `₹${t.exitPrice}` : '—'}</td>
                                        <td className="font-mono" style={{
                                            fontWeight: 700, fontSize: '13px',
                                            color: isActive ? 'var(--accent-light)' : isWin ? 'var(--profit)' : t.pnl < 0 ? 'var(--loss)' : 'var(--text-3)'
                                        }}>
                                            {isActive ? 'OPEN' : t.pnl ? fmtPnl(t.pnl) : '—'}
                                        </td>
                                        <td>
                                            {t.exitType === 'TARGET'
                                                ? <span className="badge badge-buy">Target</span>
                                                : t.exitType === 'STOPLOSS' || t.exitType === 'SL'
                                                ? <span className="badge badge-sell">Stop Loss</span>
                                                : isActive
                                                ? <span className="badge badge-info">Active</span>
                                                : <span className="badge badge-wait">{t.exitType || '—'}</span>}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{t.actualRR || t.rrRatio || '—'}</td>
                                        <td className="font-mono" style={{ fontSize: '11.5px', color: t.vix >= 18 ? 'var(--loss)' : 'var(--text-3)' }}>{t.vix || '—'}</td>
                                        <td>
                                            <span className={`badge ${isActive ? 'badge-info' : isWin ? 'badge-buy' : t.pnl < 0 ? 'badge-sell' : 'badge-wait'}`}>
                                                {isActive ? 'OPEN' : (t.status || '—')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)', fontSize: '13px' }}>
                                        {allTrades.length === 0 ? 'No trade history available' : 'No trades match your filters'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        </div>
    );
}
