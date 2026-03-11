import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Zap, Briefcase, Clock,
    BarChart3, FlaskConical, Settings, ShieldCheck,
    Zap as Z
} from 'lucide-react';

interface SidebarProps {
    systemStatus?: 'online' | 'offline' | 'warning';
    activeTrades?: number;
}

import { LucideIcon } from 'lucide-react';

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    badge?: string;
    counter?: boolean;
}

const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Overview',
        items: [
            { to: '/',           label: 'Dashboard',       icon: LayoutDashboard },
            { to: '/signals',    label: 'Market Signals',  icon: Zap,        badge: 'LIVE' },
        ]
    },
    {
        label: 'Portfolio',
        items: [
            { to: '/trades',     label: 'Positions',       icon: Briefcase,  counter: true },
            { to: '/history',    label: 'Trade History',   icon: Clock },
            { to: '/analytics',  label: 'Analytics',       icon: BarChart3 },
        ]
    },
    {
        label: 'Tools',
        items: [
            { to: '/validation', label: 'Signal Audit',    icon: ShieldCheck },
            { to: '/backtest',   label: 'Strategy Lab',    icon: FlaskConical },
            { to: '/settings',   label: 'Settings',        icon: Settings },
        ]
    }
];

export default function Sidebar({ systemStatus = 'online', activeTrades = 0 }: SidebarProps) {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Z size={16} color="white" strokeWidth={2.5} />
                </div>
                <div>
                    <div className="sidebar-logo-text">ZENITH</div>
                    <div className="sidebar-logo-sub">Trading Terminal</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navGroups.map(group => (
                    <div key={group.label} className="sidebar-section" style={{ padding: '0 0 4px' }}>
                        <div className="sidebar-section-label">{group.label}</div>
                        {group.items.map(({ to, label, icon: Icon, badge, counter }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            >
                                <Icon size={16} strokeWidth={2} />
                                <span style={{ flex: 1 }}>{label}</span>
                                {badge && (
                                    <span style={{
                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                                        padding: '2px 6px', borderRadius: '4px',
                                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                                        border: '1px solid rgba(34,197,94,0.2)'
                                    }}>
                                        {badge}
                                    </span>
                                )}
                                {counter && activeTrades > 0 && (
                                    <span style={{
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: 'var(--accent)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 700
                                    }}>
                                        {activeTrades}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`dot ${
                        systemStatus === 'online' ? 'dot-green dot-pulse' :
                        systemStatus === 'warning' ? 'dot-yellow' : 'dot-red'
                    }`} />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 500 }}>
                        {systemStatus === 'online' ? 'All systems normal' :
                         systemStatus === 'warning' ? 'Degraded performance' : 'System offline'}
                    </span>
                </div>
            </div>
        </aside>
    );
}
