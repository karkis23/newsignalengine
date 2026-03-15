import { RefreshCcw, Bell, Pause, Play, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  loading?: boolean;
  isPaused?: boolean;
  marketData: any;
  engineHealth: any;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onRefresh: () => void;
  onTogglePolling: () => void;
}

export default function Header({
  title, subtitle, loading, isPaused,
  marketData, engineHealth, theme, onToggleTheme, onRefresh, onTogglePolling
}: HeaderProps) {
  const isMarketOpen = marketData?.marketOpen;
  const isEngineOnline = engineHealth?.online === true;
  const mode = engineHealth?.engine_mode ?? 'STANDBY';

  return (
    <header className="header" style={{ height: '72px', borderBottom: '1px solid var(--border-strong)' }}>
      {/* Left: Page Info */}
      <div className="header-left">
        <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{title}</h1>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginTop: '2px' }}>{subtitle}</p>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Market Ticker */}
        <div className="ticker-pill" style={{ padding: '2px', background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)' }}>
          <div className="ticker-pill-item" style={{ padding: '6px 16px' }}>
            <span className="ticker-label" style={{ fontSize: '9px', opacity: 0.6 }}>NIFTY 50</span>
            <span className="ticker-value" style={{ color: 'var(--text-1)', fontSize: '13px', fontWeight: 700 }}>
              {marketData?.niftyLTP ? marketData.niftyLTP.toLocaleString('en-IN') : '—'}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-strong)', alignSelf: 'center' }} />
          <div className="ticker-pill-item" style={{ padding: '6px 16px' }}>
            <span className="ticker-label" style={{ fontSize: '9px', opacity: 0.6 }}>INDIA VIX</span>
            <span className="ticker-value" style={{
              fontSize: '13px', fontWeight: 700,
              color: (marketData?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)'
            }}>
              {marketData?.vix?.toFixed(2) ?? '—'}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-strong)', alignSelf: 'center' }} />
          <div className="ticker-pill-item" style={{ padding: '6px 16px', gap: '8px' }}>
            <span className={`dot ${isMarketOpen ? 'dot-green dot-pulse' : 'dot-gray'}`} style={{ width: '6px', height: '6px' }} />
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isMarketOpen ? 'var(--text-1)' : 'var(--text-3)'
            }}>
              {isMarketOpen ? 'Exchange Open' : 'Exchange Closed'}
            </span>
          </div>
        </div>

        {/* Engine Badge */}
        <div className={`status-pill ${isEngineOnline ? 'status-online' : 'status-standby'}`} style={{ 
          padding: '6px 14px', borderRadius: '10px', height: '36px',
          background: isEngineOnline ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
          border: '1px solid currentColor'
        }}>
          <span className={`dot ${isEngineOnline ? 'dot-green dot-pulse' : 'dot-yellow'}`} style={{ width: '8px', height: '8px' }} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{isEngineOnline ? 'Engine v4.0' : 'Engine Standby'}</span>
          {isEngineOnline && (
            <span style={{ opacity: 0.6, fontSize: '10px', fontWeight: 600, marginLeft: '6px', paddingLeft: '6px', borderLeft: '1px solid currentColor' }}>
              {mode}
            </span>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 32, background: 'var(--border-strong)' }} />

        {/* Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="icon-btn"
              onClick={onTogglePolling}
              title={isPaused ? 'Resume live feed' : 'Pause live feed'}
              style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: isPaused ? 'var(--warn-dim)' : 'transparent',
                  color: isPaused ? 'var(--warn)' : 'var(--text-3)',
                  borderColor: isPaused ? 'var(--warn)' : 'var(--border-strong)'
              }}
            >
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
            </button>

            <button
              className={`icon-btn ${loading ? 'spin' : ''}`}
              onClick={onRefresh}
              disabled={loading}
              title="Manual sync"
              style={{ width: '36px', height: '36px', borderRadius: '10px', borderColor: 'var(--border-strong)' }}
            >
              <RefreshCcw size={16} />
            </button>

            <button 
              className="icon-btn" 
              onClick={onToggleTheme}
              title={theme === 'light' ? "Midnight Mode" : "Daylight Mode"}
              style={{ width: '36px', height: '36px', borderRadius: '10px', borderColor: 'var(--border-strong)' }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button className="icon-btn" title="Alerts" style={{ width: '36px', height: '36px', borderRadius: '10px', borderColor: 'var(--border-strong)' }}>
              <Bell size={16} />
            </button>
        </div>
      </div>
    </header>
  );
}
