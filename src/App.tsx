import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SignalsPage from './pages/SignalsPage';
import TradesPage from './pages/TradesPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BacktestPage from './pages/BacktestPage';
import SettingsPage from './pages/SettingsPage';
import ValidationPage from './pages/ValidationPage';
import PythonEnginePage from './pages/PythonEnginePage';
import XAIPage from './pages/XAIPage';
import StrategyTuningPage from './pages/StrategyTuningPage';
import { useTrading } from './hooks/useTrading';
import './index.css';

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('zenith-theme') as 'light' | 'dark') || 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zenith-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
}

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Live performance and market operational metrics' },
  '/signals': { title: 'Market Signals', subtitle: 'Real-time signal feed and decision logic' },
  '/trades': { title: 'Positions', subtitle: 'Active engagements and recently closed trades' },
  '/history': { title: 'Settled P&L', subtitle: 'Comprehensive ledger of historical performance' },
  '/analytics': { title: 'Deep Analytics', subtitle: 'Advanced statistical breakdown and strategy metrics' },
  '/backtest': { title: 'Strategy Sim', subtitle: 'Historical simulation and model verification' },
  '/settings': { title: 'Global Config', subtitle: 'Environment parameters and system controls' },
  '/validation': { title: 'Signal Audit', subtitle: 'Accuracy verification against live market telemetery' },
  '/engine': { title: 'Engine Telemetry', subtitle: 'Operational core diagnostics and service health' },
  '/xai': { title: 'AI Explainability', subtitle: 'Live feature importance and model interpretation' },
  '/tuning': { title: 'Strategy Tuning', subtitle: 'Dynamic parameter optimization and live adjustment' },
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const info = pageInfo[location.pathname] || pageInfo['/'];
  const { marketData, activeTrades, engineHealth, refresh, loading, isPaused, togglePolling } = useTrading();
  const { theme, toggleTheme } = useTheme();


  return (
    <div className="app-container" style={{ 
      background: 'var(--bg-base)',
      height: '100vh',
      display: 'flex',
      color: 'var(--text-1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Ambient Background */}
      <div style={{
        position: 'absolute', top: '0%', left: '0%',
        width: '100%', height: '100%',
        background: `radial-gradient(circle at 50% 0%, var(--accent-glow) 0%, transparent 70%)`,
        opacity: theme === 'dark' ? 0.08 : 0.04, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '40%', height: '40%',
        background: 'var(--accent-glow)', filter: 'blur(120px)',
        opacity: theme === 'dark' ? 0.1 : 0.05, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '30%', height: '30%',
        background: 'var(--accent-glow)', filter: 'blur(100px)',
        opacity: theme === 'dark' ? 0.05 : 0.03, pointerEvents: 'none', zIndex: 0
      }} />

      <Sidebar systemStatus={engineHealth?.online ? 'online' : 'warning'} activeTrades={activeTrades.length} />
      
      <div className="main-wrapper" style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        minWidth: 0, position: 'relative', zIndex: 1,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden'
      }}>
        <Header 
          title={info.title} 
          subtitle={info.subtitle}
          marketData={marketData}
          engineHealth={engineHealth}
          isPaused={isPaused}
          onTogglePolling={togglePolling}
          onRefresh={refresh}
          theme={theme}
          onToggleTheme={toggleTheme}
          loading={loading}
        />
        
        <main className="main-content" style={{ 
          flex: 1, display: 'flex', flexDirection: 'column',
          minWidth: 0, overflow: 'hidden'
        }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/validation" element={<ValidationPage />} />
            <Route path="/engine" element={<PythonEnginePage />} />
            <Route path="/xai" element={<XAIPage />} />
            <Route path="/tuning" element={<StrategyTuningPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
