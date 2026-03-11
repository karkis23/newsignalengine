# 🚀 Deployment & Setup Guide: Dhan Trading Bot

## 📋 Complete Setup Instructions

This comprehensive guide covers the complete setup and deployment of the Dhan trading bot, from account creation to live trading deployment.

## 🔧 Prerequisites

### 1. Required Accounts
- **Dhan Trading Account**: Active demat and trading account
- **Google Account**: For Google Sheets integration
- **n8n Instance**: Self-hosted or cloud-based n8n installation
- **AI/ML Service**: Optional for advanced signal confirmation

### 2. System Requirements
- **n8n Version**: 1.0.0 or higher
- **Node.js**: Version 18+ recommended
- **Memory**: Minimum 2GB RAM
- **Storage**: 10GB available space
- **Network**: Stable internet connection with low latency

## 🏗️ Step-by-Step Setup

### Step 1: Dhan Account Setup

#### 1.1 Create Dhan Account
```bash
# Visit Dhan website
https://dhan.co

# Complete KYC process
# Fund your account with minimum capital
# Enable API access in account settings
```

#### 1.2 Generate API Credentials
```bash
# Login to Dhan web platform
# Navigate to: Settings > API Management
# Generate new API credentials
# Note down: Client ID, Password, 2FA setup
```

#### 1.3 API Access Verification
```bash
# Test API access
curl -X POST https://api.dhan.co/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_client_id",
    "password": "your_password",
    "twoFA": "your_2fa_token",
    "appName": "WEB"
  }'
```

### Step 2: n8n Environment Setup

#### 2.1 Install n8n (if not already installed)
```bash
# Using npm
npm install -g n8n

# Using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### 2.2 Configure Environment Variables
```bash
# Create .env file in n8n directory
cat > ~/.n8n/.env << EOF
# Dhan API Credentials
DHAN_CLIENT_ID=your_dhan_client_id
DHAN_PASSWORD=your_dhan_password
DHAN_2FA=your_2fa_token

# Google Sheets Integration
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key"

# Optional: AI/ML Service
AI_MODEL_URL=your_ai_service_url
AI_API_KEY=your_ai_api_key

# Optional: Market Sentiment API
SENTIMENT_API_URL=your_sentiment_api_url
SENTIMENT_API_KEY=your_sentiment_api_key

# Notification Settings
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your_email
EMAIL_SMTP_PASS=your_app_password
EOF
```

#### 2.3 Start n8n
```bash
# Start n8n with environment variables
n8n start

# Access n8n interface
# Open browser: http://localhost:5678
```

### Step 3: Google Sheets Setup

#### 3.1 Create Google Sheets
```bash
# Create new Google Sheet with following tabs:
# 1. Dhan_Signals - For signal logging
# 2. Dhan_Active_Trades - For active trade tracking
# 3. Dhan_Trade_Summary - For trade performance
# 4. Performance_Analytics - For analytics
```

#### 3.2 Setup Service Account
```bash
# Go to Google Cloud Console
# Create new project or select existing
# Enable Google Sheets API
# Create service account
# Download JSON key file
# Share Google Sheet with service account email
```

#### 3.3 Configure Sheet Headers
```javascript
// Dhan_Signals sheet headers
const signalHeaders = [
  'Timestamp', 'Signal', 'Confidence', 'RSI', 'MACD', 'Momentum',
  'Volume Ratio', 'VIX', 'Sentiment', 'Writers Zone', 'Candle Pattern',
  'Spot Price', 'Market Strength', 'Put Call Premium Ratio',
  'Writers Confidence', 'ATM Strike'
];

// Dhan_Active_Trades sheet headers
const activeTradeHeaders = [
  'Entry Order ID', 'SL Order ID', 'Target Order ID', 'Trading Symbol',
  'Security ID', 'Entry Price', 'Stop Loss', 'Target', 'Quantity',
  'Risk Reward Ratio', 'Max Loss', 'Max Profit', 'Status', 'Timestamp'
];

// Dhan_Trade_Summary sheet headers
const tradeSummaryHeaders = [
  'Entry Order ID', 'Timestamp', 'Signal', 'Confidence', 'Trading Symbol',
  'Entry Price', 'Stop Loss', 'Target', 'Quantity', 'Risk Reward Ratio',
  'Max Loss', 'Max Profit', 'Writers Zone', 'Market Strength', 'VIX', 'Status'
];
```

### Step 4: Import Trading Workflow

#### 4.1 Import Workflow JSON
```bash
# In n8n interface:
# 1. Click "Import from File"
# 2. Select DHAN_TRADING_BOT_WORKFLOW.json
# 3. Click "Import"
# 4. Verify all nodes are imported correctly
```

#### 4.2 Configure Node Credentials
```bash
# Configure Google Sheets nodes:
# 1. Click on any Google Sheets node
# 2. Add new credential
# 3. Upload service account JSON
# 4. Test connection

# Configure HTTP Request nodes:
# 1. Verify all Dhan API endpoints
# 2. Check header configurations
# 3. Test API connectivity
```

#### 4.3 Validate Workflow
```bash
# Test workflow execution:
# 1. Click "Execute Workflow" button
# 2. Monitor execution in real-time
# 3. Check for any errors
# 4. Verify data flow between nodes
```

### Step 5: Security Configuration

#### 5.1 API Security
```bash
# Secure API credentials
chmod 600 ~/.n8n/.env

# Use environment variable encryption
n8n export:credentials --encrypt --key="your_encryption_key"

# Regular credential rotation
# Update API keys monthly
# Monitor API usage logs
```

#### 5.2 Network Security
```bash
# Configure firewall rules
ufw allow 5678/tcp  # n8n interface
ufw enable

# Use HTTPS for production
# Configure SSL certificates
# Enable VPN for remote access
```

#### 5.3 Access Control
```bash
# Set up n8n authentication
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=secure_password

# Configure user permissions
# Limit workflow editing access
# Enable audit logging
```

### Step 6: Monitoring & Alerting Setup

#### 6.1 System Monitoring
```bash
# Install monitoring tools
npm install -g pm2  # Process manager

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'n8n-trading-bot',
    script: 'n8n',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 6.2 Log Management
```bash
# Configure log rotation
cat > /etc/logrotate.d/n8n << EOF
/home/user/.n8n/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 user user
}
EOF
```

#### 6.3 Alert Configuration
```bash
# Setup Slack notifications
# Create Slack webhook URL
# Configure alert thresholds
# Test notification delivery
```

### Step 7: Testing & Validation

#### 7.1 Paper Trading Test
```bash
# Enable paper trading mode
export PAPER_TRADING=true

# Run workflow for 1 week
# Monitor signal generation
# Validate order logic
# Check risk management
```

#### 7.2 Performance Testing
```bash
# Load testing
# API response time testing
# Memory usage monitoring
# Error rate analysis
```

#### 7.3 Backtesting
```bash
# Historical data testing
# Strategy performance validation
# Risk metric calculation
# Optimization parameter tuning
```

### Step 8: Production Deployment

#### 8.1 Production Environment
```bash
# Setup production server
# Configure production database
# Enable production logging
# Setup backup systems
```

#### 8.2 Go-Live Checklist
```bash
# ✅ All API credentials verified
# ✅ Google Sheets integration working
# ✅ Workflow tested end-to-end
# ✅ Risk management validated
# ✅ Monitoring systems active
# ✅ Alert systems configured
# ✅ Backup systems in place
# ✅ Emergency procedures documented
```

#### 8.3 Initial Capital Allocation
```bash
# Start with small capital (₹50,000 - ₹1,00,000)
# Monitor performance for 2 weeks
# Gradually increase capital based on performance
# Maintain maximum 2% risk per trade
```

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Authentication Failures
```bash
# Issue: Dhan login fails
# Solution: Check credentials, 2FA token
# Verify: API access enabled in Dhan account

# Issue: Google Sheets access denied
# Solution: Check service account permissions
# Verify: Sheet shared with service account email
```

#### 2. API Rate Limiting
```bash
# Issue: Too many API requests
# Solution: Implement rate limiting
# Add delays between API calls
# Use batch requests where possible
```

#### 3. Order Placement Failures
```bash
# Issue: Orders getting rejected
# Solution: Check account balance
# Verify option liquidity
# Validate order parameters
```

#### 4. Data Quality Issues
```bash
# Issue: Incorrect market data
# Solution: Validate data sources
# Implement data quality checks
# Use multiple data feeds
```

### Performance Optimization

#### 1. Speed Optimization
```bash
# Optimize API calls
# Use connection pooling
# Implement caching
# Minimize data processing
```

#### 2. Memory Management
```bash
# Monitor memory usage
# Implement garbage collection
# Optimize data structures
# Clear unused variables
```

#### 3. Error Recovery
```bash
# Implement retry mechanisms
# Use circuit breakers
# Setup fallback systems
# Monitor error rates
```

## 📊 Maintenance Schedule

### Daily Tasks
- [ ] Check system health
- [ ] Review trade performance
- [ ] Monitor error logs
- [ ] Validate data quality

### Weekly Tasks
- [ ] Performance analysis
- [ ] Risk metric review
- [ ] System backup
- [ ] Security audit

### Monthly Tasks
- [ ] Credential rotation
- [ ] Strategy optimization
- [ ] Performance reporting
- [ ] System updates

## 🚨 Emergency Procedures

### System Failure Response
1. **Immediate Actions**
   - Stop all active workflows
   - Check system status
   - Identify failure cause
   - Implement temporary fixes

2. **Recovery Steps**
   - Restore from backup
   - Validate data integrity
   - Test system functionality
   - Resume operations gradually

3. **Post-Incident**
   - Document incident
   - Analyze root cause
   - Implement preventive measures
   - Update procedures

### Trading Emergency
1. **Market Crisis Response**
   - Activate emergency stop
   - Close all positions
   - Assess market conditions
   - Implement risk controls

2. **System Recovery**
   - Wait for market stability
   - Validate system integrity
   - Test with small positions
   - Resume normal operations

This comprehensive setup guide ensures a robust, secure, and reliable deployment of your Dhan trading bot system.