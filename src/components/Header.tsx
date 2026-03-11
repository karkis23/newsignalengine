import { RefreshCcw, Bell, Pause, Play } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  loading?: boolean;
  isPaused?: boolean;
  marketData: any;
  engineHealth: any;
  onRefresh: () => void;
  onTogglePolling: () => void;
}

export default function Header({
  title, subtitle, loading, isPaused,
  marketData, engineHealth, onRefresh, onTogglePolling
}: HeaderProps) {
  const isMarketOpen = marketData?.marketOpen;
  const isEngineOnline = engineHealth?.online === true;
  const mode = engineHealth?.engine_mode ?? 'STANDBY';

  return (
    <header className="header">
      {/* Left: Page Info */}
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Market Ticker */}
        <div className="ticker-pill">
          <div className="ticker-pill-item">
            <span className="ticker-label">Nifty 50</span>
            <span className="ticker-value" style={{ color: 'var(--text-1)' }}>
              {marketData?.niftyLTP ? marketData.niftyLTP.toLocaleString('en-IN') : '—'}
            </span>
          </div>
          <div className="ticker-pill-div" />
          <div className="ticker-pill-item">
            <span className="ticker-label">VIX</span>
            <span className="ticker-value" style={{
              color: (marketData?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)'
            }}>
              {marketData?.vix?.toFixed(2) ?? '—'}
            </span>
          </div>
          <div className="ticker-pill-div" />
          <div className="ticker-pill-item" style={{ gap: '5px' }}>
            <span className={`dot ${isMarketOpen ? 'dot-green' : 'dot-gray'}`} />
            <span style={{
              fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: isMarketOpen ? 'var(--profit)' : 'var(--text-3)'
            }}>
              {isMarketOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Engine Badge */}
        <div className={`status-pill ${isEngineOnline ? 'status-online' : 'status-standby'}`}>
          <span className={`dot ${isEngineOnline ? 'dot-green dot-pulse' : 'dot-yellow dot-pulse'}`} />
          <span>Engine {isEngineOnline ? 'Ready' : 'Standby'}</span>
          {isEngineOnline && (
            <span style={{ opacity: 0.55, fontSize: '10px', marginLeft: '2px' }}>
              · {mode}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Actions */}
        <button
          className="icon-btn"
          onClick={onTogglePolling}
          title={isPaused ? 'Resume polling' : 'Pause polling'}
          style={isPaused ? { color: 'var(--warn)', borderColor: 'rgba(245,158,11,0.3)' } : {}}
        >
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
        </button>

        <button
          className={`icon-btn ${loading ? 'spin' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCcw size={14} />
        </button>

        <button className="icon-btn" title="Notifications">
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}
