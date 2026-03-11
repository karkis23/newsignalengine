import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { TrendingUp, Activity, Target, Wind, PieChart as PieIcon } from 'lucide-react';
import { useTrading } from '../hooks/useTrading';

const TooltipStyle = {
    contentStyle: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', fontSize: '12px', padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

export default function AnalyticsPage() {
    const { tradeSummary, stats } = useTrading();

    const closed = useMemo(() =>
        tradeSummary.filter(t => t.pnl !== 0 && t.status && !['ACTIVE', 'OPEN'].includes(t.status)),
        [tradeSummary]
    );

    const dailyPnL = useMemo(() => {
        const map: Record<string, number> = {};
        closed.forEach(t => {
            const date = t.timestamp?.slice(0, 10) || 'Unknown';
            map[date] = (map[date] || 0) + t.pnl;
        });
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, pnl]) => ({
                date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                pnl: Math.round(pnl),
            }));
    }, [closed]);

    const equityCurve = useMemo(() => {
        let running = 0;
        return [...closed].reverse().map((t, i) => {
            running += t.pnl;
            return { trade: i + 1, equity: Math.round(running) };
        });
    }, [closed]);

    const pieData = [
        { name: 'Target Hit',   value: closed.filter(t => t.exitType === 'TARGET').length, color: '#22c55e' },
        { name: 'Stop Loss',    value: closed.filter(t => ['STOPLOSS','SL'].includes(t.exitType)).length, color: '#ef4444' },
        { name: 'Manual/Other', value: closed.filter(t => !['TARGET','STOPLOSS','SL'].includes(t.exitType)).length, color: '#6366f1' },
    ].filter(d => d.value > 0);

    const vixBuckets = useMemo(() => {
        const b: Record<string, { trades: number; pnl: number; wins: number }> = {
            '<12': { trades:0, pnl:0, wins:0 },
            '12–15': { trades:0, pnl:0, wins:0 },
            '15–18': { trades:0, pnl:0, wins:0 },
            '>18': { trades:0, pnl:0, wins:0 },
        };
        closed.forEach(t => {
            const v = t.vix;
            const k = v < 12 ? '<12' : v < 15 ? '12–15' : v < 18 ? '15–18' : '>18';
            b[k].trades++; b[k].pnl += t.pnl;
            if (t.pnl > 0) b[k].wins++;
        });
        return Object.entries(b).map(([range, d]) => ({
            range, ...d,
            pnl: Math.round(d.pnl),
            winRate: d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0
        }));
    }, [closed]);

    const fmtPnl = (v: number) => {
        const abs = Math.abs(v);
        const sign = v >= 0 ? '+' : '-';
        if (abs >= 100000) return `${sign}₹${(abs/100000).toFixed(1)}L`;
        if (abs >= 1000)   return `${sign}₹${(abs/1000).toFixed(1)}K`;
        return `${sign}₹${abs.toFixed(0)}`;
    };

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Performance</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Analytics</h2>
                </div>
                <span className="badge badge-info" style={{ fontSize: '11px' }}>Live Testing Phase</span>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                {[
                    { label: 'Profit Factor', value: stats?.profitFactor?.toFixed(2) ?? '0.00', sub: 'Profit per ₹1 risk', color: 'var(--accent-light)', icon: <Target size={13} color="var(--accent-light)" /> },
                    { label: 'Win Rate',      value: `${stats?.winRate ?? 0}%`,  sub: 'Overall accuracy', color: 'var(--profit)',       icon: <Activity size={13} color="var(--accent-light)" /> },
                    { label: 'Avg Win',       value: `+₹${(stats?.avgWin ?? 0).toLocaleString('en-IN')}`,  sub: 'Per winning trade', color: 'var(--profit)',  icon: <TrendingUp size={13} color="var(--accent-light)" /> },
                    { label: 'Avg Loss',      value: `-₹${(stats?.avgLoss ?? 0).toLocaleString('en-IN')}`, sub: 'Per losing trade',  color: 'var(--loss)',    icon: <Wind size={13} color="var(--accent-light)" /> },
                ].map(c => (
                    <div key={c.label} className="kpi-card">
                        <div className="kpi-label">{c.icon} {c.label}</div>
                        <div className="kpi-value font-mono" style={{ color: c.color, fontSize: '24px' }}>{c.value}</div>
                        <div className="kpi-sub">{c.sub}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* Equity Curve */}
                <div className="card" style={{ padding: '24px 24px 16px' }}>
                    <div className="section-header" style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={15} color="var(--accent-light)" />
                            <span className="section-title">Profit Growth</span>
                        </div>
                        <span className="section-meta">{closed.length} closed trades</span>
                    </div>
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityCurve}>
                                <defs>
                                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="trade" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                                    tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}k`} width={48} />
                                <Tooltip {...TooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Equity']} />
                                <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2}
                                    fill="url(#eq)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily P&L */}
                <div className="card" style={{ padding: '24px 24px 16px' }}>
                    <div className="section-header" style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={15} color="var(--accent-light)" />
                            <span className="section-title">Daily Performance</span>
                        </div>
                        <span className="section-meta">{dailyPnL.length} trading days</span>
                    </div>
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyPnL} barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                                    tickFormatter={(v: number) => fmtPnl(v)} width={52} />
                                <Tooltip {...TooltipStyle} formatter={(v: any) => [fmtPnl(Number(v)), 'P&L']} />
                                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                    {dailyPnL.map((d, i) => (
                                        <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} opacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '14px' }}>

                {/* Exit Distribution Pie */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                        <PieIcon size={15} color="var(--accent-light)" />
                        <span className="section-title">Exit Breakdown</span>
                    </div>
                    {pieData.length > 0 ? (
                        <>
                            <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                                            paddingAngle={6} dataKey="value">
                                            {pieData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                                {pieData.map(d => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                                            <span style={{ color: 'var(--text-3)' }}>{d.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: '13px' }}>No closed trades yet</div>
                    )}
                </div>

                {/* VIX Performance */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wind size={15} color="var(--accent-light)" />
                        <span className="section-title">Performance by Volatility (VIX)</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>VIX Range</th>
                                <th>Trades</th>
                                <th>Win Rate</th>
                                <th>Net P&L</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vixBuckets.map(b => (
                                <tr key={b.range}>
                                    <td>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)' }}>
                                            VIX {b.range}
                                        </span>
                                    </td>
                                    <td className="font-mono" style={{ color: 'var(--text-2)', fontSize: '12.5px' }}>{b.trades}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ width: '60px' }}>
                                                <div className="progress-fill" style={{
                                                    width: `${b.winRate}%`,
                                                    background: b.winRate > 60 ? 'var(--profit)' : b.winRate > 40 ? 'var(--accent)' : 'var(--loss)'
                                                }} />
                                            </div>
                                            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>{b.winRate}%</span>
                                        </div>
                                    </td>
                                    <td className="font-mono" style={{ fontWeight: 700, fontSize: '12.5px', color: b.pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                                        {fmtPnl(b.pnl)}
                                    </td>
                                    <td>
                                        <span className={`badge ${b.pnl > 0 ? 'badge-buy' : b.pnl < 0 ? 'badge-sell' : 'badge-wait'}`}>
                                            {b.pnl > 0 ? 'Profitable' : b.pnl < 0 ? 'Losing' : 'Neutral'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Insight */}
                    {vixBuckets.some(b => b.trades > 0) && (
                        <div style={{ margin: '16px 20px', padding: '14px 16px', borderRadius: 'var(--r-lg)', background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Key Insight</div>
                            <div style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                                Best performance in VIX range <strong style={{ color: 'var(--text-1)' }}>
                                    {vixBuckets.reduce((prev, cur) => prev.pnl > cur.pnl ? prev : cur).range}
                                </strong>. Focus entries during these conditions.
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
        </div>
    );
}
