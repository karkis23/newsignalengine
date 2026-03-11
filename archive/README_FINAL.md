# Complete No-Code Intraday Options Trading Bot - Final Version

A comprehensive automated trading system built with n8n that analyzes market data, uses AI confirmation, and executes bracket-style options trades via Angel One SmartAPI.

## ⚠️ CRITICAL DISCLAIMER

**This system is for educational and research purposes only. Trading involves significant financial risk. Always:**
- Start with paper trading mode for at least 30 days
- Test thoroughly before live trading
- Never risk more than you can afford to lose
- Understand all risks involved
- Consider consulting with a financial advisor

## 🚀 System Overview

This is a complete, production-ready automated trading bot that:

- **Analyzes Market Data**: Real-time spot prices, 5-minute candles, VIX levels
- **Calculates Technical Indicators**: RSI, MACD, Momentum, Volume Ratio, Candle Patterns
- **Evaluates Market Sentiment**: News and social media analysis
- **Detects Writers Zones**: Open Interest analysis for support/resistance
- **AI Trade Confirmation**: Machine learning model validates all signals
- **Executes Bracket Orders**: Entry + Stop Loss + Target orders automatically
- **Comprehensive Logging**: All activities tracked in Google Sheets
- **Risk Management**: VIX filtering, confidence thresholds, position limits

## 📁 Complete File Structure

```
trading-bot/
├── n8n_workflow_final.json          # Main trading workflow (25+ nodes)
├── exit_order_monitor.json          # Exit order monitoring workflow
├── ai_model_api.py                  # Flask AI model for trade confirmation
├── market_sentiment_api.py          # News/social sentiment analysis
├── requirements.txt                 # Python dependencies
├── sentiment_requirements.txt       # Sentiment API dependencies
├── Procfile                         # Render deployment config
├── deploy_ai_on_render.md          # AI model deployment guide
├── angel_api_setup.md              # Angel One API setup guide
├── sheet_logging_setup.md          # Google Sheets integration guide
├── paper_trading_mode.md           # Comprehensive testing framework
└── README_FINAL.md                 # This file
```

## 🔧 System Architecture

### Main Trading Workflow (n8n_workflow_final.json)
**25 Nodes - Complete Trading Pipeline:**

1. **Cron Trigger** - Every 5 minutes (9:15 AM - 3:15 PM)
2. **Time Filter** - Trading hours validation
3. **Angel One Login** - TOTP-based secure authentication
4. **Market Data Collection** - Spot price, candles, VIX
5. **Technical Analysis** - RSI, MACD, Momentum calculations
6. **Sentiment Analysis** - News/social media sentiment
7. **Writers Zone Detection** - Open Interest analysis
8. **AI Confirmation** - Machine learning trade validation
9. **Signal Filtering** - VIX < 18, Confidence > 75%
10. **Strike Calculation** - ATM option selection
11. **Entry Order** - Market order execution
12. **Fill Confirmation** - Order status verification
13. **SL/Target Calculation** - Risk level determination
14. **Stop Loss Order** - SL-M order placement
15. **Target Order** - LIMIT order placement
16. **Comprehensive Logging** - All data to Google Sheets

### Exit Order Monitor (exit_order_monitor.json)
**Automatic Bracket Order Management:**

- Monitors all active exit orders every 2 minutes
- Automatically cancels opposite order when one executes
- Calculates P&L and updates trade status
- Handles TARGET, STOP_LOSS, and EOD_CLOSE scenarios

### AI Model (ai_model_api.py)
**Machine Learning Trade Confirmation:**

- Random Forest classifier with 12+ features
- Confidence scoring for all predictions
- Continuous learning capability
- RESTful API with health monitoring

### Market Sentiment (market_sentiment_api.py)
**News & Social Media Analysis:**

- Real-time news sentiment from NewsAPI
- Twitter sentiment analysis (optional)
- Combined sentiment scoring
- Fear & Greed Index integration

## 📊 Google Sheets Integration

### Required Sheets:
1. **Signals** - All AI predictions and indicators
2. **Trades** - Complete trade lifecycle tracking
3. **Active_Exit_Orders** - SL/Target order monitoring
4. **Daily_Summary** - Performance analytics
5. **System_Logs** - Error tracking and debugging
6. **Risk_Monitoring** - Real-time risk assessment

### Features:
- Real-time P&L calculation
- Win rate and performance metrics
- Conditional formatting for visual indicators
- Automated daily/weekly reports
- Mobile-optimized views

## 🛡️ Security & Risk Management

### Security Features:
- **TOTP Authentication** - Time-based OTP for Angel One
- **API Key Management** - Secure credential storage
- **Service Account Access** - Google Sheets security
- **Rate Limiting** - API call optimization
- **Error Handling** - Comprehensive exception management

### Risk Controls:
- **VIX Filtering** - No trading when VIX > 18
- **Confidence Threshold** - Minimum 75% AI confidence
- **Position Limits** - Configurable lot sizes
- **Stop Loss** - Automatic 15-point protection
- **Target Orders** - 30-point profit targets
- **Daily Limits** - Maximum loss protection
- **Time Restrictions** - Trading hours only

## 🚀 Quick Start Guide

### 1. Prerequisites Setup
```bash
# Required Accounts
- Angel One trading account with API access
- Google Cloud account for Sheets API
- Render.com account for AI model hosting
- n8n instance (local or cloud)
```

### 2. Deploy AI Model
```bash
# Follow deploy_ai_on_render.md
1. Upload ai_model_api.py to GitHub
2. Connect to Render.com
3. Deploy as web service
4. Note the deployment URL
```

### 3. Configure Angel One API
```bash
# Follow angel_api_setup.md
1. Enable API access in Angel One account
2. Generate API key and credentials
3. Setup TOTP authentication
4. Test API connection
```

### 4. Setup Google Sheets
```bash
# Follow sheet_logging_setup.md
1. Create Google Cloud project
2. Enable Sheets API
3. Create service account
4. Setup sheet structure
5. Configure permissions
```

### 5. Import n8n Workflows
```bash
# In n8n interface
1. Import n8n_workflow_final.json
2. Import exit_order_monitor.json
3. Configure environment variables
4. Test all connections
```

### 6. Environment Variables
```bash
# Angel One API
ANGEL_API_KEY=your_api_key
ANGEL_CLIENT_ID=your_client_id
ANGEL_PASSWORD=your_password
ANGEL_TOTP=current_totp_code

# AI Model
AI_MODEL_URL=https://your-model.onrender.com
AI_API_KEY=your_api_key

# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Market Sentiment (Optional)
SENTIMENT_API_URL=https://your-sentiment-api.com
NEWS_API_KEY=your_news_api_key
TWITTER_BEARER_TOKEN=your_twitter_token
```

## 🧪 Testing & Validation

### Paper Trading Mode
**MANDATORY before live trading:**

1. **Enable Paper Mode** - Set PAPER_TRADING_MODE=true
2. **Run for 30 Days** - Minimum testing period
3. **Validate Performance** - Win rate > 60%, Max DD < 10%
4. **Test All Scenarios** - Bull/bear markets, high/low volatility
5. **Verify Logging** - All data accurately recorded
6. **Check Risk Controls** - SL/Target execution, daily limits

### Performance Criteria for Go-Live:
- [ ] 30+ days of paper trading
- [ ] Win rate > 60%
- [ ] Maximum drawdown < 10%
- [ ] Consistent daily performance
- [ ] All error scenarios handled
- [ ] Risk management validated
- [ ] Comprehensive logging verified

## 📈 Trading Logic

### Signal Generation Process:
1. **Market Data** - Collect real-time prices and indicators
2. **Technical Analysis** - Calculate RSI, MACD, Momentum
3. **Sentiment Check** - Analyze news and social media
4. **Writers Zone** - Detect high OI support/resistance
5. **AI Validation** - Machine learning confirmation
6. **Risk Filtering** - VIX and confidence thresholds
7. **Order Execution** - Entry + SL + Target placement

### Entry Criteria:
- AI Signal: BUY_CE or BUY_PE (not HOLD)
- Confidence: ≥ 75%
- VIX: < 18
- Trading Hours: 9:15 AM - 3:15 PM
- Technical Alignment: Multiple indicator confirmation

### Exit Strategy:
- **Stop Loss**: 15 points below entry (SL-M order)
- **Target**: 30 points above entry (LIMIT order)
- **Auto Cancel**: Opposite order cancelled when one executes
- **EOD Close**: All positions closed at 3:15 PM
- **Emergency Stop**: Manual override capability

## 📊 Performance Monitoring

### Real-time Dashboards:
- **Active Positions** - Current trades and P&L
- **Daily Performance** - Win rate, profit/loss
- **System Health** - API status, error rates
- **Risk Metrics** - Drawdown, exposure limits

### Automated Reports:
- **Daily Summary** - Trade count, P&L, win rate
- **Weekly Analysis** - Performance trends
- **Monthly Review** - Comprehensive metrics
- **Risk Assessment** - Exposure and limits

### Key Metrics Tracked:
- Total trades executed
- Win rate percentage
- Average profit per trade
- Maximum drawdown
- Sharpe ratio
- System uptime
- API response times
- Error rates

## 🔧 Maintenance & Updates

### Daily Tasks:
- [ ] Check system logs for errors
- [ ] Verify TOTP authentication
- [ ] Review trade executions
- [ ] Monitor P&L performance
- [ ] Validate data accuracy

### Weekly Tasks:
- [ ] Update TOTP secrets
- [ ] Review AI model performance
- [ ] Analyze trading results
- [ ] Check API rate limits
- [ ] Backup configuration

### Monthly Tasks:
- [ ] Rotate API keys
- [ ] Retrain AI model with new data
- [ ] Review and optimize parameters
- [ ] Update documentation
- [ ] Performance analysis

## 🆘 Troubleshooting

### Common Issues:

**TOTP Authentication Fails:**
```bash
Solution: Update ANGEL_TOTP with current code
Check: System time synchronization
```

**AI Model Not Responding:**
```bash
Solution: Check Render.com deployment status
Verify: AI_MODEL_URL environment variable
```

**Orders Not Executing:**
```bash
Solution: Verify Angel One API credentials
Check: Available margin and funds
```

**Google Sheets Not Updating:**
```bash
Solution: Check service account permissions
Verify: GOOGLE_SHEET_ID is correct
```

### Emergency Procedures:
1. **Stop All Trading** - Disable n8n workflows
2. **Close Positions** - Manual order cancellation
3. **Check Logs** - Identify root cause
4. **Contact Support** - Angel One, Google, Render
5. **Restore Service** - Fix issues and restart

## 📞 Support & Resources

### Documentation:
- **Angel One API**: [smartapi.angelone.in/docs](https://smartapi.angelone.in/docs)
- **n8n Documentation**: [docs.n8n.io](https://docs.n8n.io)
- **Google Sheets API**: [developers.google.com/sheets](https://developers.google.com/sheets)
- **Render.com**: [render.com/docs](https://render.com/docs)

### Support Contacts:
- **Angel One API**: smartapisupport@angelbroking.com
- **n8n Community**: [community.n8n.io](https://community.n8n.io)
- **Technical Issues**: Create GitHub issue with logs

### Community:
- **Trading Automation**: Join relevant Discord/Telegram groups
- **n8n Users**: Active community for workflow help
- **Angel One Developers**: API-specific support

## 📜 Legal & Compliance

### Important Notes:
- This system is for educational purposes only
- Trading involves significant financial risk
- Past performance does not guarantee future results
- Always comply with local trading regulations
- Consider tax implications of automated trading
- Maintain proper records for regulatory compliance

### Liability:
- Users are solely responsible for trading decisions
- No warranty or guarantee of profitability
- System may have bugs or unexpected behavior
- Always test thoroughly before live trading
- Use appropriate position sizing and risk management

## 🔄 Version History

### v3.0 (Final) - Current
- Complete bracket order implementation
- Exit order monitoring system
- Enhanced Google Sheets integration
- Comprehensive paper trading mode
- Production-ready error handling
- Full documentation suite

### v2.0 - Enhanced
- Added SL/Target order placement
- Improved AI model accuracy
- Enhanced risk management
- Better logging and monitoring

### v1.0 - Initial
- Basic trading workflow
- AI confirmation system
- Angel One API integration
- Google Sheets logging

---

**Remember**: This is a powerful automated trading system. Always start with paper trading, understand all risks, and never trade with money you cannot afford to lose. Success in trading requires discipline, proper risk management, and continuous learning.

**Good luck and trade responsibly!** 🚀📈