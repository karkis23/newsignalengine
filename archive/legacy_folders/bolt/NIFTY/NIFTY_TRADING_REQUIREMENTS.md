# 🎯 NIFTY Trading Bot - Complete Requirements & Setup Guide

## 📋 Overview

This document provides comprehensive requirements and setup instructions for the NIFTY-only trading bot using Dhan API with n8n automation.

## 🎯 Key Changes for NIFTY Trading

### 1. **Underlying Asset Changes**
- **From**: BANKNIFTY (Security ID: 13)
- **To**: NIFTY (Security ID: 25)
- **Lot Size**: 50 (vs BANKNIFTY's 25)
- **Strike Intervals**: 50 points (vs BANKNIFTY's 100 points)

### 2. **Risk Management Adjustments**
- **Stop Loss**: 12 points (vs BANKNIFTY's 15 points)
- **Target**: 25 points (vs BANKNIFTY's 30 points)
- **Premium Threshold**: ₹3 minimum (vs BANKNIFTY's ₹5)
- **ATM Range**: ±300 points (vs BANKNIFTY's ±500 points)

### 3. **Technical Analysis Modifications**
- **RSI Thresholds**: 35/65 (vs BANKNIFTY's 30/70)
- **Momentum Threshold**: ±1.5% (vs BANKNIFTY's ±2%)
- **Volume Surge**: 1.3x (vs BANKNIFTY's 1.5x)
- **Premium Ratio**: 0.85/1.15 (vs BANKNIFTY's 0.8/1.2)

## 🔧 Environment Variables Required

```bash
# Dhan API Credentials
DHAN_CLIENT_ID=your_dhan_client_id
DHAN_PASSWORD=your_dhan_password
DHAN_2FA=your_2fa_token

# Google Sheets Integration
GOOGLE_SHEET_ID=your_google_sheet_id

# Optional: AI/ML Service
AI_MODEL_URL=your_ai_service_url
AI_API_KEY=your_ai_api_key

# Optional: Market Sentiment API
SENTIMENT_API_URL=your_sentiment_api_url
SENTIMENT_API_KEY=your_sentiment_api_key

# Notification Settings
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 📊 Google Sheets Structure

### Required Sheets with NIFTY-specific naming:

#### 1. **NIFTY_Signals** Sheet
```
Timestamp | Signal | Confidence | RSI | MACD | Momentum | Volume Ratio | VIX | Sentiment | Writers Zone | Candle Pattern | Spot Price | Market Strength | Put Call Premium Ratio | Writers Confidence | ATM Strike
```

#### 2. **NIFTY_Active_Trades** Sheet
```
Entry Order ID | SL Order ID | Target Order ID | Trading Symbol | Security ID | Underlying | Entry Price | Stop Loss | Target | Quantity | Risk Reward Ratio | Max Loss | Max Profit | Status | Timestamp | Exit Type | Exit Price | PnL | Actual Risk Reward | Exit Timestamp | Execution Time
```

#### 3. **NIFTY_Trade_Summary** Sheet
```
Entry Order ID | Timestamp | Signal | Confidence | Trading Symbol | Underlying | Entry Price | Stop Loss | Target | Quantity | Risk Reward Ratio | Max Loss | Max Profit | Writers Zone | Market Strength | VIX | Status | Exit Price | PnL | Exit Type | Actual Risk Reward | Exit Timestamp
```

#### 4. **NIFTY_Performance_Log** Sheet
```
Date | Underlying | Session Executions | Session PnL | Target Hits | Stop Loss Hits | Average PnL | Last Update
```

#### 5. **NIFTY_Alert_Log** Sheet
```
Timestamp | Underlying | Alert Type | Severity | Message | PnL
```

## 🎯 NIFTY-Specific Configuration Details

### 1. **Security IDs for NIFTY**
```javascript
const NIFTY_SECURITY_IDS = {
  NIFTY_INDEX: "25",        // NIFTY 50 Index
  INDIA_VIX: "27",          // India VIX (same as BANKNIFTY)
  NIFTY_OPTIONS: "NSE_FNO"  // Exchange segment for NIFTY options
};
```

### 2. **NIFTY Option Chain Filtering**
```javascript
// Filter criteria for NIFTY options
const niftyFilterCriteria = {
  instrument: 'OPTIDX',
  tradingSymbolPrefix: 'NIFTY',
  excludePattern: 'NIFTYBANK',  // Exclude Bank Nifty
  strikeInterval: 50,           // NIFTY strikes are in multiples of 50
  atmRange: 300,                // ±300 points from ATM
  lotSize: 50                   // NIFTY lot size
};
```

### 3. **NIFTY Risk Parameters**
```javascript
const niftyRiskParams = {
  stopLossPoints: 12,           // 12 points SL
  targetPoints: 25,             // 25 points target
  minimumPremium: 3,            // ₹3 minimum premium
  maxPositions: 3,              // Maximum 3 NIFTY positions
  riskPerTrade: 2,              // 2% risk per trade
  maxDailyLoss: 8               // 8% maximum daily loss
};
```

### 4. **NIFTY Technical Thresholds**
```javascript
const niftyTechnicalThresholds = {
  rsi: {
    oversold: 35,               // NIFTY RSI oversold
    overbought: 65              // NIFTY RSI overbought
  },
  momentum: {
    bullish: 1.5,               // 1.5% bullish momentum
    bearish: -1.5               // -1.5% bearish momentum
  },
  volumeRatio: {
    surge: 1.3                  // 1.3x volume surge
  },
  premiumRatio: {
    callHeavy: 0.85,            // Call heavy market
    putHeavy: 1.15              // Put heavy market
  }
};
```

## 🚀 Deployment Requirements

### 1. **System Requirements**
- **n8n Version**: 1.0.0 or higher
- **Node.js**: Version 18+ recommended
- **Memory**: Minimum 2GB RAM
- **Storage**: 10GB available space
- **Network**: Stable internet with low latency

### 2. **Dhan Account Requirements**
- **Active Dhan Trading Account** with F&O enabled
- **API Access Enabled** in account settings
- **Minimum Capital**: ₹50,000 recommended
- **2FA Setup**: Google Authenticator or similar

### 3. **Google Cloud Setup**
- **Google Cloud Project** with Sheets API enabled
- **Service Account** with JSON key file
- **Sheet Permissions**: Service account as Editor

## 📈 NIFTY Trading Strategy Specifics

### 1. **Entry Conditions**
- **VIX Filter**: < 18 (same as BANKNIFTY)
- **RSI Conditions**: < 35 (oversold) or > 65 (overbought)
- **MACD Confirmation**: Histogram alignment with trend
- **Writers Zone**: Premium-based bias confirmation
- **Confidence Threshold**: ≥ 75%

### 2. **Option Selection Logic**
- **ATM Strike**: Rounded to nearest 50
- **Strike Selection**: ATM or ±50 points based on signal
- **Premium Filter**: Minimum ₹3 premium
- **Liquidity Check**: Ensure tradeable options

### 3. **Risk Management**
- **Position Size**: 50 lots (NIFTY lot size)
- **Stop Loss**: Entry price - 12 points
- **Target**: Entry price + 25 points
- **Risk-Reward**: ~1:2 ratio
- **Maximum Positions**: 3 concurrent NIFTY trades

### 4. **Exit Management**
- **Monitoring Frequency**: Every 2 minutes
- **Auto Cancellation**: Opposite order cancelled on execution
- **Status Tracking**: Real-time order status monitoring
- **Performance Logging**: Complete trade lifecycle tracking

## 🔍 Key Differences from BANKNIFTY

| Parameter | BANKNIFTY | NIFTY |
|-----------|-----------|-------|
| **Security ID** | 13 | 25 |
| **Lot Size** | 25 | 50 |
| **Strike Interval** | 100 | 50 |
| **Stop Loss** | 15 points | 12 points |
| **Target** | 30 points | 25 points |
| **Min Premium** | ₹5 | ₹3 |
| **ATM Range** | ±500 | ±300 |
| **RSI Oversold** | 30 | 35 |
| **RSI Overbought** | 70 | 65 |
| **Momentum Threshold** | ±2% | ±1.5% |
| **Volume Surge** | 1.5x | 1.3x |
| **Premium Ratio** | 0.8/1.2 | 0.85/1.15 |

## 🎯 Performance Expectations

### 1. **Expected Metrics**
- **Win Rate**: 55-65% (similar to BANKNIFTY)
- **Risk-Reward**: 1:2 average
- **Maximum Drawdown**: < 10%
- **Daily Trades**: 2-5 trades per day
- **Average Holding Time**: 30-90 minutes

### 2. **Capital Requirements**
- **Minimum Capital**: ₹50,000
- **Recommended Capital**: ₹1,00,000+
- **Risk Per Trade**: 2% of capital
- **Maximum Daily Risk**: 8% of capital

### 3. **System Performance**
- **API Response Time**: < 500ms
- **Order Execution**: < 2 seconds
- **Monitoring Frequency**: Every 2 minutes
- **Data Accuracy**: > 99%

## 🔧 Setup Checklist

### Pre-Deployment
- [ ] Dhan account created and funded
- [ ] API access enabled and credentials generated
- [ ] Google Cloud project setup with Sheets API
- [ ] Service account created and JSON key downloaded
- [ ] Google Sheets created with proper structure
- [ ] n8n environment variables configured
- [ ] Slack webhook setup (optional)

### Testing Phase
- [ ] Individual node testing completed
- [ ] End-to-end workflow testing successful
- [ ] Paper trading validation (1 week minimum)
- [ ] Error handling scenarios tested
- [ ] Performance benchmarks met

### Production Deployment
- [ ] Small capital deployment (₹10,000-20,000)
- [ ] Real-time monitoring active
- [ ] Alert systems functional
- [ ] Performance tracking operational
- [ ] Risk controls validated

## 🚨 Risk Warnings

### 1. **Market Risks**
- **Volatility**: NIFTY can be highly volatile
- **Liquidity**: Ensure sufficient option liquidity
- **Gap Risk**: Overnight gaps can affect positions
- **System Risk**: Technical failures can cause losses

### 2. **Operational Risks**
- **API Failures**: Dhan API downtime
- **Network Issues**: Internet connectivity problems
- **Data Quality**: Incorrect market data
- **Order Execution**: Slippage and rejection risks

### 3. **Mitigation Strategies**
- **Position Sizing**: Never risk more than 2% per trade
- **Stop Losses**: Always use protective stops
- **Monitoring**: Continuous system monitoring
- **Backup Plans**: Manual intervention procedures

This comprehensive guide ensures successful deployment of your NIFTY trading bot with proper risk management and monitoring capabilities.