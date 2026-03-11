# Paper Trading Mode Setup

## Overview
Paper trading allows you to test the bot without risking real money. This mode simulates all trades while logging everything for analysis.

## Configuration Changes

### 1. Modify Order Placement Node

Replace the "Place Market Order" node with this paper trading version:

```json
{
  "parameters": {
    "jsCode": "// Paper Trading Mode - No real orders\nconst signal = $node['AI Trade Confirmation'].json.signal;\nconst spotPrice = $node['Get Spot Price'].json.data.ltp;\nconst strike = $node['Calculate Strike Price'].json.targetStrike;\nconst symbol = $node['Calculate Strike Price'].json.tradingSymbol;\n\n// Simulate order placement\nconst simulatedOrder = {\n  status: 'success',\n  data: {\n    orderid: 'PAPER_' + Date.now(),\n    orderstatus: 'complete',\n    tradingsymbol: symbol,\n    transactiontype: 'BUY',\n    quantity: '15',\n    price: (Math.random() * 100 + 50).toFixed(2), // Random price between 50-150\n    averageprice: (Math.random() * 100 + 50).toFixed(2),\n    exchange: 'NFO',\n    producttype: 'INTRADAY',\n    ordertype: 'MARKET',\n    variety: 'NORMAL'\n  }\n};\n\n// Log paper trade\nconsole.log(`PAPER TRADE: ${signal} ${symbol} at ${simulatedOrder.data.price}`);\n\nreturn simulatedOrder;"
  },
  "id": "paper-order",
  "name": "Paper Trading Order",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2
}
```

### 2. Update Environment Variables

Add these to your n8n environment:

```bash
# Paper Trading Mode
PAPER_TRADING_MODE=true
PAPER_INITIAL_BALANCE=100000
PAPER_COMMISSION_PER_TRADE=20
```

### 3. Enhanced Paper Trading Workflow

Create a separate workflow for paper trading:

```json
{
  "name": "Paper Trading Enhanced",
  "nodes": [
    {
      "parameters": {
        "jsCode": "// Paper Trading Manager\nconst fs = require('fs');\nconst path = './paper_trades.json';\n\n// Load existing trades\nlet paperTrades = [];\nif (fs.existsSync(path)) {\n  paperTrades = JSON.parse(fs.readFileSync(path, 'utf8'));\n}\n\n// Current trade data\nconst signal = $node['AI Trade Confirmation'].json.signal;\nconst confidence = $node['AI Trade Confirmation'].json.confidence;\nconst spotPrice = $node['Get Spot Price'].json.data.ltp;\nconst strike = $node['Calculate Strike Price'].json.targetStrike;\nconst symbol = $node['Calculate Strike Price'].json.tradingSymbol;\n\n// Simulate realistic option pricing\nfunction calculateOptionPrice(spot, strike, type, timeToExpiry = 0.1) {\n  const volatility = 0.2;\n  const riskFreeRate = 0.06;\n  \n  // Simplified Black-Scholes approximation\n  const d1 = (Math.log(spot / strike) + (riskFreeRate + volatility * volatility / 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));\n  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);\n  \n  let price;\n  if (type === 'CE') {\n    price = spot * normalCDF(d1) - strike * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);\n  } else {\n    price = strike * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) - spot * normalCDF(-d1);\n  }\n  \n  return Math.max(price, 0.5); // Minimum price\n}\n\nfunction normalCDF(x) {\n  return 0.5 * (1 + erf(x / Math.sqrt(2)));\n}\n\nfunction erf(x) {\n  const a1 = 0.254829592;\n  const a2 = -0.284496736;\n  const a3 = 1.421413741;\n  const a4 = -1.453152027;\n  const a5 = 1.061405429;\n  const p = 0.3275911;\n  \n  const sign = x < 0 ? -1 : 1;\n  x = Math.abs(x);\n  \n  const t = 1.0 / (1.0 + p * x);\n  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);\n  \n  return sign * y;\n}\n\n// Calculate entry price\nconst entryPrice = calculateOptionPrice(spotPrice, strike, signal.includes('CE') ? 'CE' : 'PE');\n\n// Create paper trade\nconst paperTrade = {\n  id: 'PAPER_' + Date.now(),\n  timestamp: new Date().toISOString(),\n  symbol: symbol,\n  signal: signal,\n  confidence: confidence,\n  entryPrice: entryPrice,\n  stopLoss: entryPrice - 15,\n  target: entryPrice + 30,\n  quantity: 15,\n  status: 'ACTIVE',\n  spotPrice: spotPrice,\n  strike: strike\n};\n\n// Add to trades array\npaperTrades.push(paperTrade);\n\n// Save to file\nfs.writeFileSync(path, JSON.stringify(paperTrades, null, 2));\n\nreturn paperTrade;"
      },
      "id": "paper-trade-manager",
      "name": "Paper Trade Manager",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2
    }
  ]
}
```

## Paper Trading Dashboard

### 1. Create Performance Tracker

```javascript
// Paper Trading Performance Calculator
function calculatePaperPerformance() {
  const trades = loadPaperTrades();
  const initialBalance = 100000;
  let currentBalance = initialBalance;
  let totalPnL = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  
  trades.forEach(trade => {
    if (trade.status === 'CLOSED') {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      totalPnL += pnl;
      currentBalance += pnl;
      
      if (pnl > 0) {
        winningTrades++;
      } else {
        losingTrades++;
      }
    }
  });
  
  const winRate = (winningTrades / (winningTrades + losingTrades)) * 100;
  const roi = ((currentBalance - initialBalance) / initialBalance) * 100;
  
  return {
    initialBalance,
    currentBalance,
    totalPnL,
    winningTrades,
    losingTrades,
    winRate,
    roi,
    totalTrades: trades.length
  };
}
```

### 2. Google Sheets Integration

Update your Google Sheets to include paper trading tabs:

**Sheet: "Paper Trades"**
```
A1: Trade ID
B1: Timestamp
C1: Symbol
D1: Signal
E1: Confidence
F1: Entry Price
G1: Stop Loss
H1: Target
I1: Quantity
J1: Status
K1: Exit Price
L1: PnL
M1: Exit Timestamp
```

**Sheet: "Paper Performance"**
```
A1: Date
B1: Balance
C1: Total PnL
D1: Win Rate
E1: Total Trades
F1: Daily PnL
```

## Exit Strategy Simulation

### 1. Monitor Price Movements

```javascript
// Check for SL/Target hits
function checkExitConditions() {
  const activeTrades = paperTrades.filter(t => t.status === 'ACTIVE');
  
  activeTrades.forEach(trade => {
    const currentPrice = getCurrentOptionPrice(trade.symbol);
    
    if (currentPrice <= trade.stopLoss) {
      // Stop loss hit
      closePaperTrade(trade.id, currentPrice, 'STOP_LOSS');
    } else if (currentPrice >= trade.target) {
      // Target hit
      closePaperTrade(trade.id, currentPrice, 'TARGET');
    }
  });
}
```

### 2. Time-based Exit

```javascript
// Close trades at 3:15 PM
function checkTimeBasedExit() {
  const currentTime = new Date();
  const marketCloseTime = new Date();
  marketCloseTime.setHours(15, 15, 0, 0);
  
  if (currentTime >= marketCloseTime) {
    const activeTrades = paperTrades.filter(t => t.status === 'ACTIVE');
    
    activeTrades.forEach(trade => {
      const currentPrice = getCurrentOptionPrice(trade.symbol);
      closePaperTrade(trade.id, currentPrice, 'EOD_CLOSE');
    });
  }
}
```

## Backtesting Module

### 1. Historical Data Testing

```javascript
// Backtest with historical data
function runBacktest(startDate, endDate) {
  const historicalData = loadHistoricalData(startDate, endDate);
  const results = [];
  
  historicalData.forEach(dayData => {
    // Simulate the trading bot for each day
    const signal = simulateAISignal(dayData);
    
    if (signal !== 'HOLD') {
      const trade = simulateTrade(signal, dayData);
      results.push(trade);
    }
  });
  
  return analyzeBacktestResults(results);
}
```

### 2. Performance Metrics

```javascript
// Calculate comprehensive metrics
function calculateMetrics(trades) {
  return {
    totalTrades: trades.length,
    winRate: calculateWinRate(trades),
    averageWin: calculateAverageWin(trades),
    averageLoss: calculateAverageLoss(trades),
    profitFactor: calculateProfitFactor(trades),
    maxDrawdown: calculateMaxDrawdown(trades),
    sharpeRatio: calculateSharpeRatio(trades),
    calmarRatio: calculateCalmarRatio(trades)
  };
}
```

## Risk Management Testing

### 1. Position Sizing

```javascript
// Test different position sizes
const positionSizes = [1, 2, 3, 5]; // lot sizes
const results = {};

positionSizes.forEach(size => {
  const testResults = runBacktest(startDate, endDate, { lotSize: size });
  results[size] = testResults;
});
```

### 2. Stop Loss Optimization

```javascript
// Test different SL levels
const stopLossLevels = [10, 15, 20, 25];
const results = {};

stopLossLevels.forEach(sl => {
  const testResults = runBacktest(startDate, endDate, { stopLoss: sl });
  results[sl] = testResults;
});
```

## Reporting and Analysis

### 1. Daily Report

```javascript
// Generate daily paper trading report
function generateDailyReport() {
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = paperTrades.filter(t => t.timestamp.startsWith(today));
  
  const report = {
    date: today,
    totalTrades: todayTrades.length,
    activeTrades: todayTrades.filter(t => t.status === 'ACTIVE').length,
    closedTrades: todayTrades.filter(t => t.status === 'CLOSED').length,
    totalPnL: todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    winRate: calculateWinRate(todayTrades.filter(t => t.status === 'CLOSED'))
  };
  
  return report;
}
```

### 2. Weekly Analysis

```javascript
// Generate weekly analysis
function generateWeeklyAnalysis() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekTrades = paperTrades.filter(t => new Date(t.timestamp) >= oneWeekAgo);
  
  return {
    totalTrades: weekTrades.length,
    bestDay: findBestTradingDay(weekTrades),
    worstDay: findWorstTradingDay(weekTrades),
    avgDailyPnL: calculateAvgDailyPnL(weekTrades),
    consistency: calculateConsistency(weekTrades)
  };
}
```

## Testing Checklist

### Pre-Live Trading Validation

- [ ] Paper trading for minimum 2 weeks
- [ ] Win rate > 60%
- [ ] Maximum drawdown < 10%
- [ ] Consistent daily performance
- [ ] All edge cases handled
- [ ] Error handling tested
- [ ] Risk management working
- [ ] Logging complete and accurate

### Go-Live Criteria

- [ ] Paper trading profitable for 30 days
- [ ] System runs without errors
- [ ] All APIs functioning correctly
- [ ] Risk limits properly configured
- [ ] Emergency stop procedures tested
- [ ] Live monitoring setup complete

## Monitoring Tools

### 1. Real-time Dashboard

Create a simple HTML dashboard:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Paper Trading Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h1>Paper Trading Performance</h1>
    <div id="pnl-chart"></div>
    <div id="trades-table"></div>
    <script>
        // Load and display paper trading data
        loadPaperTradingData();
    </script>
</body>
</html>
```

### 2. Alerts and Notifications

```javascript
// Send alerts for significant events
function sendAlert(message, type = 'info') {
  const alertData = {
    timestamp: new Date().toISOString(),
    message: message,
    type: type,
    balance: getCurrentBalance(),
    activeTrades: getActiveTrades().length
  };
  
  // Log to console and optionally send email/webhook
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Save to alerts log
  saveAlert(alertData);
}
```

Remember: Paper trading is essential for validating your strategy before risking real money. Take it seriously and gather sufficient data before going live.