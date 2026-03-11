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
import { useTrading } from './hooks/useTrading';
import './index.css';

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/':           { title: 'Dashboard',      subtitle: 'Live performance and market operational metrics' },
  '/signals':    { title: 'Market Signals', subtitle: 'Real-time signal feed and decision logic' },
  '/trades':     { title: 'Positions',      subtitle: 'Active engagements and recently closed trades' },
  '/history':    { title: 'Trade History',  subtitle: 'Comprehensive ledger of settled positions' },
  '/analytics':  { title: 'Analytics',      subtitle: 'Statistical breakdown and strategy performance' },
  '/backtest':   { title: 'Strategy Lab',   subtitle: 'Historical simulation and model verification' },
  '/settings':   { title: 'Settings',       subtitle: 'Global parameters and system configuration' },
  '/validation': { title: 'Signal Audit',   subtitle: 'Accuracy verification against live market data' },
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const info = pageInfo[location.pathname] || pageInfo['/'];
  const { marketData, activeTrades, engineHealth, refresh, loading, isPaused, togglePolling } = useTrading();

  const systemStatus = engineHealth?.online
    ? 'online'
    : marketData
    ? 'warning'
    : 'offline';

  return (
    <div className="app-layout">
      <Sidebar
        systemStatus={systemStatus as 'online' | 'offline' | 'warning'}
        activeTrades={activeTrades.length}
      />
      <main className="main-content">
        <Header
          title={info.title}
          subtitle={info.subtitle}
          loading={loading}
          isPaused={isPaused}
          marketData={marketData}
          engineHealth={engineHealth}
          onRefresh={refresh}
          onTogglePolling={togglePolling}
        />
        <Routes>
          <Route path="/"           element={<DashboardPage />} />
          <Route path="/signals"    element={<SignalsPage />} />
          <Route path="/trades"     element={<TradesPage />} />
          <Route path="/history"    element={<HistoryPage />} />
          <Route path="/analytics"  element={<AnalyticsPage />} />
          <Route path="/backtest"   element={<BacktestPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="/validation" element={<ValidationPage />} />
        </Routes>
      </main>
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
