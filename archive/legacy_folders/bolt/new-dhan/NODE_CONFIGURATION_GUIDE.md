# 🔧 Complete Node Configuration Guide: Dhan Trading Bot

## 📋 Overview

This comprehensive guide provides step-by-step instructions to configure every single node in both the Main Trading Bot and Exit Order Monitor workflows for 100% real-time working setup.

## 🚀 Prerequisites Setup

### 1. Environment Variables Configuration

Before configuring any nodes, set up these environment variables in your n8n instance:

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

### 2. Google Sheets Setup

Create a Google Sheet with these exact tab names and headers:

#### Sheet 1: "Dhan_Signals"
```
Timestamp | Signal | Confidence | RSI | MACD | Momentum | Volume Ratio | VIX | Sentiment | Writers Zone | Candle Pattern | Spot Price | Market Strength | Put Call Premium Ratio | Writers Confidence | ATM Strike
```

#### Sheet 2: "Dhan_Active_Trades"
```
Entry Order ID | SL Order ID | Target Order ID | Trading Symbol | Security ID | Entry Price | Stop Loss | Target | Quantity | Risk Reward Ratio | Max Loss | Max Profit | Status | Timestamp | Exit Type | Exit Price | PnL | Actual Risk Reward | Exit Timestamp | Execution Time
```

#### Sheet 3: "Dhan_Trade_Summary"
```
Entry Order ID | Timestamp | Signal | Confidence | Trading Symbol | Entry Price | Stop Loss | Target | Quantity | Risk Reward Ratio | Max Loss | Max Profit | Writers Zone | Market Strength | VIX | Status | Exit Price | PnL | Exit Type | Actual Risk Reward | Exit Timestamp
```

#### Sheet 4: "Dhan_Performance_Log"
```
Date | Session Executions | Session PnL | Target Hits | Stop Loss Hits | Average PnL | Win Rate | Profit Factor | Max Drawdown | Last Update
```

#### Sheet 5: "Dhan_Alert_Log"
```
Timestamp | Alert Type | Severity | Message | PnL | Trading Symbol | Action Taken | Resolution Status
```

## 🎯 Main Trading Bot Workflow Configuration

### Node 1: Trading Hours Cron

**Node Type**: Cron
**Node Name**: "Trading Hours Cron"

**Configuration Steps:**
1. Click on the Cron node
2. In the "Rule" section, select "Expression"
3. Set the cron expression: `*/5 9-15 * * 1-5`
4. **Explanation**: Runs every 5 minutes from 9 AM to 3 PM, Monday to Friday

**Settings:**
- **Interval**: Custom Expression
- **Expression**: `*/5 9-15 * * 1-5`
- **Timezone**: Asia/Kolkata (if available, otherwise use your local timezone)

### Node 2: Trading Hours Filter

**Node Type**: IF
**Node Name**: "Trading Hours Filter"

**Configuration Steps:**
1. Click on the IF node
2. Add condition: "Date & Time"
3. Configure the condition:
   - **Value 1**: `{{new Date().getHours()}}`
   - **Operation**: "between"
   - **Value 2**: `9`
   - **Value 3**: `15`

**Purpose**: Double-check that we're within trading hours

### Node 3: Dhan Authentication

**Node Type**: HTTP Request
**Node Name**: "Dhan Authentication"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `https://api.dhan.co/login`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json"
   }
   ```
4. **Body** (JSON):
   ```json
   {
     "userId": "{{$env.DHAN_CLIENT_ID}}",
     "password": "{{$env.DHAN_PASSWORD}}",
     "twoFA": "{{$env.DHAN_2FA}}",
     "appName": "WEB"
   }
   ```

**Critical Settings:**
- **Authentication**: None
- **Response**: JSON
- **Timeout**: 30 seconds

### Node 4: Get Bank Nifty OHLC Data

**Node Type**: HTTP Request
**Node Name**: "Get Bank Nifty OHLC Data"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://api.dhan.co/v2/charts/intraday`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Query Parameters**:
   ```json
   {
     "securityId": "13",
     "exchangeSegment": "NSE_EQ",
     "instrument": "INDEX",
     "interval": "5"
   }
   ```

**Critical Notes:**
- Security ID "13" is for BANKNIFTY
- Interval "5" means 5-minute candles

### Node 5: Get Bank Nifty LTP

**Node Type**: HTTP Request
**Node Name**: "Get Bank Nifty LTP"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://api.dhan.co/v2/marketfeed/ltp`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Query Parameters**:
   ```json
   {
     "securityId": "13",
     "exchangeSegment": "NSE_EQ",
     "instrument": "INDEX"
   }
   ```

### Node 6: Get India VIX Data

**Node Type**: HTTP Request
**Node Name**: "Get India VIX Data"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://api.dhan.co/v2/marketfeed/ltp`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Query Parameters**:
   ```json
   {
     "securityId": "27",
     "exchangeSegment": "NSE_EQ",
     "instrument": "INDEX"
   }
   ```

**Note**: Security ID "27" is for India VIX

### Node 7: VIX Filter (< 18)

**Node Type**: IF
**Node Name**: "VIX Filter (< 18)"

**Configuration Steps:**
1. Add condition: "Number"
2. Configure:
   - **Value 1**: `{{$node['Get India VIX Data'].json.data.LTP}}`
   - **Operation**: "smaller"
   - **Value 2**: `18`

**Purpose**: Only proceed if VIX is below 18 (low volatility environment)

### Node 8: Market Sentiment API

**Node Type**: HTTP Request
**Node Name**: "Market Sentiment API"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `{{$env.SENTIMENT_API_URL}}/market-sentiment`
3. **Headers**:
   ```json
   {
     "Authorization": "Bearer {{$env.SENTIMENT_API_KEY}}"
   }
   ```

**Note**: This is optional. If you don't have a sentiment API, you can skip this node and hardcode sentiment as "NEUTRAL" in the next nodes.

### Node 9: Get Dhan Instrument Master

**Node Type**: HTTP Request
**Node Name**: "Get Dhan Instrument Master"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://images.dhan.co/api-data/api-scrip-master.csv`
3. **Headers**:
   ```json
   {
     "Accept": "text/csv"
   }
   ```

**Critical Settings:**
- **Response**: Text (not JSON)
- **Timeout**: 60 seconds (large file download)

### Node 10: Build Option Chain from Master

**Node Type**: Code
**Node Name**: "Build Option Chain from Master"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the complete JavaScript code from the workflow JSON
3. **Key Functions**:
   - Parse CSV data
   - Filter BANKNIFTY options
   - Calculate expiry dates
   - Fetch LTP for each option

**Critical Code Sections:**
```javascript
// Get current Thursday expiry
const today = new Date();
const nextThursday = new Date(today);
const daysUntilThursday = (4 - today.getDay() + 7) % 7;

if (daysUntilThursday === 0 && today.getHours() >= 15) {
  nextThursday.setDate(today.getDate() + 7);
} else {
  nextThursday.setDate(today.getDate() + daysUntilThursday);
}

const expiryDateStr = nextThursday.toISOString().split('T')[0];
```

### Node 11: Calculate Technical Indicators

**Node Type**: Code
**Node Name**: "Calculate Technical Indicators"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the complete technical analysis code
3. **Key Calculations**:
   - RSI (14 period)
   - MACD (12, 26, 9)
   - Volume Ratio
   - Momentum
   - Candlestick patterns

**Critical Functions:**
```javascript
// RSI Calculation
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i-1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}
```

### Node 12: Writers Zone Analysis

**Node Type**: Code
**Node Name**: "Writers Zone Analysis"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the writers zone analysis code
3. **Key Analysis**:
   - Premium distribution analysis
   - ATM skew detection
   - Support/resistance identification
   - Confidence scoring

### Node 13: AI Trade Confirmation

**Node Type**: HTTP Request
**Node Name**: "AI Trade Confirmation"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `{{$env.AI_MODEL_URL}}/predict`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Authorization": "Bearer {{$env.AI_API_KEY}}"
   }
   ```
4. **Body**: Include all technical indicators and market data

**Note**: If you don't have an AI service, you can replace this with a Code node that generates signals based on technical indicators.

### Node 14: Signal & Confidence Filter

**Node Type**: IF
**Node Name**: "Signal & Confidence Filter"

**Configuration Steps:**
1. Add two conditions:
   - **Condition 1** (String):
     - **Value 1**: `{{$node['AI Trade Confirmation'].json.signal}}`
     - **Operation**: "not equal"
     - **Value 2**: `HOLD`
   - **Condition 2** (Number):
     - **Value 1**: `{{$node['AI Trade Confirmation'].json.confidence}}`
     - **Operation**: "larger equal"
     - **Value 2**: `0.75`

**Logic**: AND (both conditions must be true)

### Node 15: Log Signal to Sheets

**Node Type**: Google Sheets
**Node Name**: "Log Signal to Sheets"

**Configuration Steps:**
1. **Authentication**: Service Account
2. **Resource**: Spreadsheet
3. **Operation**: Append or Update
4. **Document ID**: `{{$env.GOOGLE_SHEET_ID}}`
5. **Sheet Name**: `Dhan_Signals`
6. **Data Mode**: Define Below
7. **Column to Match On**: A (Timestamp)
8. **Value to Match On**: `{{new Date().toISOString()}}`

**Fields Configuration**:
```json
{
  "Timestamp": "{{new Date().toISOString()}}",
  "Signal": "{{$node['AI Trade Confirmation'].json.signal}}",
  "Confidence": "{{$node['AI Trade Confirmation'].json.confidence}}",
  "RSI": "{{$node['Calculate Technical Indicators'].json.indicators.rsi}}",
  "MACD": "{{$node['Calculate Technical Indicators'].json.indicators.macd.macd}}",
  "Momentum": "{{$node['Calculate Technical Indicators'].json.indicators.momentum}}",
  "Volume Ratio": "{{$node['Calculate Technical Indicators'].json.indicators.volumeRatio}}",
  "VIX": "{{$node['Calculate Technical Indicators'].json.indicators.vix}}",
  "Sentiment": "{{$node['Calculate Technical Indicators'].json.indicators.sentiment}}",
  "Writers Zone": "{{$node['Writers Zone Analysis'].json.writersZone}}",
  "Candle Pattern": "{{$node['Calculate Technical Indicators'].json.indicators.candlePattern}}",
  "Spot Price": "{{$node['Calculate Technical Indicators'].json.indicators.spotPrice}}",
  "Market Strength": "{{$node['Calculate Technical Indicators'].json.indicators.marketStrength}}",
  "Put Call Premium Ratio": "{{$node['Writers Zone Analysis'].json.putCallPremiumRatio}}",
  "Writers Confidence": "{{$node['Writers Zone Analysis'].json.confidence}}",
  "ATM Strike": "{{$node['Writers Zone Analysis'].json.atmStrike}}"
}
```

### Node 16: Prepare Dhan Order

**Node Type**: Code
**Node Name**: "Prepare Dhan Order"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the order preparation code
3. **Key Logic**:
   - Determine option type based on signal
   - Select appropriate strike price
   - Calculate lot size
   - Build Dhan order object

**Critical Order Object**:
```javascript
const dhanOrder = {
  "securityId": selectedOption.securityId,
  "exchangeSegment": "NSE_FNO",
  "transactionType": "BUY",
  "quantity": 25,
  "orderType": "MARKET",
  "productType": "INTRADAY",
  "price": 0,
  "triggerPrice": 0,
  "disclosedQuantity": 0,
  "validity": "DAY",
  "afterMarketOrder": false,
  "boProfitValue": 0,
  "boStopLossValue": 0
};
```

### Node 17: Place Entry Order (Dhan)

**Node Type**: HTTP Request
**Node Name**: "Place Entry Order (Dhan)"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `https://api.dhan.co/v2/orders`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Body**: `{{$node['Prepare Dhan Order'].json.dhanOrder}}`

**Critical Settings:**
- **Response**: JSON
- **Timeout**: 30 seconds

### Node 18: Wait for Order Fill

**Node Type**: Wait
**Node Name**: "Wait for Order Fill"

**Configuration Steps:**
1. **Amount**: 30
2. **Unit**: seconds

**Purpose**: Allow time for order execution before checking status

### Node 19: Get Order Status & Fill Price

**Node Type**: HTTP Request
**Node Name**: "Get Order Status & Fill Price"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://api.dhan.co/v2/orders/{{$node['Place Entry Order (Dhan)'].json.data.orderId}}`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```

### Node 20: Calculate SL & Target Levels

**Node Type**: Code
**Node Name**: "Calculate SL & Target Levels"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the SL/Target calculation code
3. **Key Logic**:
   - Validate order execution
   - Calculate SL and Target prices
   - Create order objects for both SL and Target

**Critical Calculations**:
```javascript
// Calculate SL and Target levels
const stopLossPrice = fillPrice - 15;  // 15 points below entry
const targetPrice = fillPrice + 30;    // 30 points above entry

// Apply minimum value validation
const finalStopLoss = Math.max(stopLossPrice, 0.5);
const finalTarget = Math.max(targetPrice, fillPrice + 5);
```

### Node 21: Place Stop Loss Order

**Node Type**: HTTP Request
**Node Name**: "Place Stop Loss Order"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `https://api.dhan.co/v2/orders`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Body**: `{{$node['Calculate SL & Target Levels'].json.stopLossOrder}}`

### Node 22: Place Target Order

**Node Type**: HTTP Request
**Node Name**: "Place Target Order"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `https://api.dhan.co/v2/orders`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```
4. **Body**: `{{$node['Calculate SL & Target Levels'].json.targetOrder}}`

### Node 23: Log Active Trade to Sheets

**Node Type**: Google Sheets
**Node Name**: "Log Active Trade to Sheets"

**Configuration Steps:**
1. **Authentication**: Service Account
2. **Resource**: Spreadsheet
3. **Operation**: Append or Update
4. **Document ID**: `{{$env.GOOGLE_SHEET_ID}}`
5. **Sheet Name**: `Dhan_Active_Trades`
6. **Column to Match On**: A (Entry Order ID)
7. **Value to Match On**: `{{$node['Calculate SL & Target Levels'].json.entryOrderId}}`

**Fields Configuration**: Map all the required fields from the SL & Target calculation node

### Node 24: Log Trade Summary

**Node Type**: Google Sheets
**Node Name**: "Log Trade Summary"

**Configuration Steps:**
1. **Authentication**: Service Account
2. **Resource**: Spreadsheet
3. **Operation**: Append or Update
4. **Document ID**: `{{$env.GOOGLE_SHEET_ID}}`
5. **Sheet Name**: `Dhan_Trade_Summary`
6. **Column to Match On**: A (Entry Order ID)

## 🔄 Exit Order Monitor Workflow Configuration

### Node 1: Monitor Every 2 Minutes

**Node Type**: Cron
**Node Name**: "Monitor Every 2 Minutes"

**Configuration Steps:**
1. **Rule**: Expression
2. **Expression**: `*/2 9-15 * * 1-5`

**Purpose**: Monitor exit orders every 2 minutes during trading hours

### Node 2: Dhan Authentication (Monitor)

**Node Type**: HTTP Request
**Node Name**: "Dhan Authentication"

**Configuration**: Same as Main Trading Bot Node 3

### Node 3: Get Dhan Order Book

**Node Type**: HTTP Request
**Node Name**: "Get Dhan Order Book"

**Configuration Steps:**
1. **Method**: GET
2. **URL**: `https://api.dhan.co/v2/orders`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```

### Node 4: Get Active Dhan Trades

**Node Type**: Google Sheets
**Node Name**: "Get Active Dhan Trades"

**Configuration Steps:**
1. **Authentication**: Service Account
2. **Resource**: Spreadsheet
3. **Operation**: Read
4. **Document ID**: `{{$env.GOOGLE_SHEET_ID}}`
5. **Sheet Name**: `Dhan_Active_Trades`

### Node 5: Analyze Dhan Exit Executions

**Node Type**: Code
**Node Name**: "Analyze Dhan Exit Executions"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the complete exit analysis code
3. **Key Functions**:
   - Compare order book with active trades
   - Detect executed orders
   - Calculate PnL
   - Generate notifications

**Critical Logic**:
```javascript
// Check if SL order is executed
if (slOrder && slOrder.orderStatus === 'TRADED') {
  executedOrder = slOrder;
  orderToCancel = targetOrderId;
  exitType = 'STOP_LOSS';
  exitPrice = parseFloat(slOrder.price);
  pnl = (exitPrice - entryPrice) * quantity;
}
```

### Node 6: Check if Any Exits Executed

**Node Type**: IF
**Node Name**: "Check if Any Exits Executed"

**Configuration Steps:**
1. Add condition: "Number"
2. Configure:
   - **Value 1**: `{{$node['Analyze Dhan Exit Executions'].json.totalExecutions}}`
   - **Operation**: "larger"
   - **Value 2**: `0`

### Node 7: Prepare Dhan Order Cancellations

**Node Type**: Code
**Node Name**: "Prepare Dhan Order Cancellations"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Simple preparation code for cancellations

### Node 8: Cancel Opposite Orders (Dhan)

**Node Type**: HTTP Request
**Node Name**: "Cancel Opposite Orders (Dhan)"

**Configuration Steps:**
1. **Method**: DELETE
2. **URL**: `https://api.dhan.co/v2/orders/{{$json.orderId}}`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "access-token": "{{$node['Dhan Authentication'].json.data.access_token}}"
   }
   ```

**Critical Note**: Dhan uses simple DELETE method with order ID in URL

### Node 9: Update Active Trade Status

**Node Type**: Google Sheets
**Node Name**: "Update Active Trade Status"

**Configuration Steps:**
1. **Authentication**: Service Account
2. **Resource**: Spreadsheet
3. **Operation**: Update
4. **Document ID**: `{{$env.GOOGLE_SHEET_ID}}`
5. **Sheet Name**: `Dhan_Active_Trades`
6. **Column to Match On**: A (Entry Order ID)
7. **Value to Match On**: `{{$json.entryOrderId}}`

**Fields to Update**:
```json
{
  "Status": "COMPLETED",
  "Exit Type": "{{$json.exitType}}",
  "Exit Price": "{{$json.exitPrice}}",
  "PnL": "{{$json.pnl}}",
  "Actual Risk Reward": "{{$json.actualRiskReward}}",
  "Exit Timestamp": "{{$json.timestamp}}",
  "Execution Time": "{{$json.executionTime}}"
}
```

### Node 10: Update Trade Summary

**Node Type**: Google Sheets
**Node Name**: "Update Trade Summary"

**Configuration**: Similar to Node 9 but updates the `Dhan_Trade_Summary` sheet

### Node 11: Log Session Performance

**Node Type**: Google Sheets
**Node Name**: "Log Session Performance"

**Configuration Steps:**
1. **Sheet Name**: `Dhan_Performance_Log`
2. **Column to Match On**: A (Date)
3. **Value to Match On**: `{{new Date().toISOString().split('T')[0]}}`

### Node 12: Check for Notifications

**Node Type**: IF
**Node Name**: "Check for Notifications"

**Configuration Steps:**
1. Add condition: "Number"
2. Configure:
   - **Value 1**: `{{$node['Analyze Dhan Exit Executions'].json.notifications.length}}`
   - **Operation**: "larger"
   - **Value 2**: `0`

### Node 13: Process Notifications & Alerts

**Node Type**: Code
**Node Name**: "Process Notifications & Alerts"

**Configuration Steps:**
1. **Language**: JavaScript
2. **Code**: Copy the notification processing code

### Node 14: Send Slack Alerts

**Node Type**: HTTP Request
**Node Name**: "Send Slack Alerts"

**Configuration Steps:**
1. **Method**: POST
2. **URL**: `{{$env.SLACK_WEBHOOK_URL}}`
3. **Headers**:
   ```json
   {
     "Content-Type": "application/json"
   }
   ```
4. **Body**:
   ```json
   {
     "text": "🤖 *Dhan Trading Bot Alert*",
     "blocks": [
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "*Alert Type:* {{$json.type}}\n*Severity:* {{$json.severity}}\n*Message:* {{$json.message}}\n*Time:* {{$json.timestamp}}"
         }
       }
     ]
   }
   ```

### Node 15: Log Alerts to Sheets

**Node Type**: Google Sheets
**Node Name**: "Log Alerts to Sheets"

**Configuration Steps:**
1. **Sheet Name**: `Dhan_Alert_Log`
2. **Column to Match On**: A (Timestamp)

## 🔧 Critical Configuration Tips

### 1. Google Sheets Authentication

**Step-by-Step Setup:**
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. In n8n, go to Credentials
7. Add new Google Sheets credential
8. Upload the JSON file
9. Share your Google Sheet with the service account email

### 2. Error Handling Configuration

For all HTTP Request nodes, add these settings:
- **Timeout**: 30 seconds
- **Retry on Fail**: Yes
- **Max Retries**: 3
- **Retry Interval**: 1000ms

### 3. Node Connections

**Main Trading Bot Flow:**
```
Cron → Time Filter → Auth → OHLC → LTP → VIX → VIX Filter → Sentiment → Instrument Master → Option Chain → Technical Indicators → Writers Zone → AI Confirmation → Signal Filter → Log Signal → Prepare Order → Place Entry → Wait → Get Status → Calculate SL/Target → Place SL → Place Target → Log Active Trade → Log Summary
```

**Exit Monitor Flow:**
```
Cron → Auth → Order Book → Active Trades → Analyze Exits → Check Executions → Prepare Cancellations → Cancel Orders → Update Active → Update Summary → Log Performance

Analyze Exits → Check Notifications → Process Notifications → Send Slack → Log Alerts
```

### 4. Testing Configuration

**Test Each Node Individually:**
1. Start with authentication nodes
2. Test market data nodes
3. Verify Google Sheets integration
4. Test order placement in paper trading mode
5. Validate exit monitoring logic

### 5. Production Deployment

**Final Checklist:**
- [ ] All environment variables set
- [ ] Google Sheets properly configured
- [ ] Service account permissions granted
- [ ] Slack webhook working
- [ ] All nodes tested individually
- [ ] End-to-end workflow tested
- [ ] Error handling validated
- [ ] Monitoring alerts configured

## 🚨 Troubleshooting Common Issues

### 1. Authentication Failures
- Verify Dhan credentials are correct
- Check 2FA token is current
- Ensure API access is enabled in Dhan account

### 2. Google Sheets Errors
- Verify service account has edit permissions
- Check sheet names match exactly
- Ensure column headers are correct

### 3. Order Placement Issues
- Verify account has sufficient balance
- Check option liquidity
- Validate order parameters

### 4. Data Quality Issues
- Implement data validation in Code nodes
- Add error handling for missing data
- Use fallback values where appropriate

This comprehensive configuration guide ensures your Dhan trading bot workflows are set up correctly for 100% real-time operation with robust error handling and monitoring capabilities.