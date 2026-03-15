/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * Provides the primary navigation interface for the Zenith terminal.
 * Organizes tools and features into logical groups (Overview, Portfolio, Tools).
 */

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Briefcase, Clock,
    BarChart3, FlaskConical, Settings, ShieldCheck,
    Terminal, Sliders, Zap,
    type LucideIcon
} from 'lucide-react';
import ZenithLogo from './ZenithLogo';

/** Props for the Sidebar component */
interface SidebarProps {
    /** Current status of the engine ('online', 'offline', or 'warning') */
    systemStatus?: 'online' | 'offline' | 'warning';
    /** Number of active trades to display in the badge counter */
    activeTrades?: number;
}

/** Individual navigation item schema */
interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    badge?: string;     // Optional text badge (e.g. 'LIVE')
    counter?: boolean;  // If true, shows activeTrades count
}

/** Navigation groupings for the sidebar menu */
const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Overview',
        items: [
            { to: '/', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/signals', label: 'Market Signals', icon: Zap, badge: 'LIVE' },
        ]
    },
    {
        label: 'Portfolio',
        items: [
            { to: '/trades', label: 'Positions', icon: Briefcase, counter: true },
            { to: '/history', label: 'Trade History', icon: Clock },
            { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
    },
    {
        label: 'Tools',
        items: [
            { to: '/validation', label: 'Signal Audit', icon: ShieldCheck },
            { to: '/xai', label: 'Explainability', icon: BarChart3 },
            { to: '/tuning', label: 'Strategy Tuning', icon: Sliders },
            { to: '/engine', label: 'Python Engine', icon: Terminal },
            { to: '/backtest', label: 'Strategy Lab', icon: FlaskConical },
            { to: '/settings', label: 'Settings', icon: Settings },
        ]
    }
];

export default function Sidebar({ systemStatus = 'online', activeTrades = 0 }: SidebarProps) {
    return (
        <aside className="sidebar" style={{ background: 'var(--bg-subtle)', borderRight: '1px solid var(--border-strong)' }}>
            {/* Logo Section */}
            <div style={{
                padding: '32px 24px 28px',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-40px', left: '-40px',
                    width: '120px', height: '120px',
                    background: 'var(--accent-glow)', filter: 'blur(40px)',
                    opacity: 0.3, borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <ZenithLogo size={44} />
                    <div>
                        <div style={{
                            fontSize: '20px', fontWeight: 900,
                            letterSpacing: '0.05em', color: 'var(--text-1)',
                            lineHeight: 1, textShadow: '0 0 30px var(--accent-glow)'
                        }}>
                            ZENITH
                        </div>
                        <div style={{
                            fontSize: '9px', fontWeight: 800,
                            letterSpacing: '0.15em', color: 'var(--accent-light)',
                            textTransform: 'uppercase', marginTop: '6px',
                            opacity: 0.9
                        }}>
                            Quantum Terminal
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav" style={{ padding: '20px 12px' }}>
                {navGroups.map(group => (
                    <div key={group.label} className="sidebar-section" style={{ marginBottom: '24px' }}>
                        <div className="sidebar-section-label" style={{ padding: '0 12px', marginBottom: '8px', color: 'var(--text-4)' }}>{group.label}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {group.items.map(({ to, label, icon: Icon, badge, counter }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === '/'}
                                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                                    style={({ isActive }) => ({
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                                        color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                                        border: isActive ? '1px solid rgba(80, 70, 229, 0.2)' : '1px solid transparent'
                                    })}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{label}</span>
                                            {badge && (
                                                <span style={{
                                                    fontSize: '8px', fontWeight: 800, letterSpacing: '0.08em',
                                                    padding: '2px 6px', borderRadius: '6px',
                                                    background: 'var(--profit-dim)', color: 'var(--profit)',
                                                    border: '1px solid currentColor'
                                                }}>
                                                    {badge}
                                                </span>
                                            )}
                                            {counter && activeTrades > 0 && (
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '10px',
                                                    background: 'var(--accent)', color: 'white',
                                                    fontSize: '10px', fontWeight: 800,
                                                    boxShadow: '0 2px 8px var(--accent-glow)'
                                                }}>
                                                    {activeTrades}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Enhanced Footer Status */}
            <div style={{
                padding: '24px 16px',
                borderTop: '1px solid var(--border)',
                background: 'linear-gradient(to top, var(--bg-base), transparent)'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 16px', borderRadius: '16px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '10px', height: '100%',
                            display: 'flex', alignItems: 'center'
                        }}>
                            <span className={`dot ${systemStatus === 'online' ? 'dot-green dot-pulse' :
                                    systemStatus === 'warning' ? 'dot-yellow' : 'dot-red'
                                }`} style={{ width: '10px', height: '100%', borderRadius: '4px' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '12px', fontWeight: 800,
                            color: 'var(--text-1)', letterSpacing: '0.01em'
                        }}>
                            {systemStatus === 'online' ? 'Cluster Active' : 'System Guard'}
                        </div>
                        <div style={{
                            fontSize: '10px', fontWeight: 600,
                            color: 'var(--text-3)', textTransform: 'uppercase',
                            letterSpacing: '0.05em', marginTop: '2px'
                        }}>
                            {systemStatus === 'online' ? 'v4.2.0 Telemetry Sync' : 'Intervention Required'}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
