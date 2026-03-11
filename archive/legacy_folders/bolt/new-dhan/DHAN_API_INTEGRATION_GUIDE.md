# 🔧 Dhan API Integration Guide

## 📚 Complete API Reference for Trading Bot

This guide provides detailed information about integrating Dhan API into your n8n trading bot workflow, including all endpoints, parameters, and best practices.

## 🔐 Authentication & Setup

### 1. Account Setup
```bash
# Required Dhan Account Information
DHAN_CLIENT_ID=your_client_id
DHAN_PASSWORD=your_password
DHAN_2FA=your_2fa_token
```

### 2. Authentication Endpoint
```http
POST https://api.dhan.co/login
Content-Type: application/json

{
  "userId": "your_client_id",
  "password": "your_password",
  "twoFA": "your_2fa_token",
  "appName": "WEB"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600
  }
}
```

## 📊 Market Data APIs

### 1. Get LTP (Last Traded Price)
```http
GET https://api.dhan.co/v2/marketfeed/ltp
access-token: your_access_token

Parameters:
- securityId: Security identifier (e.g., "13" for BANKNIFTY)
- exchangeSegment: Exchange segment (NSE_EQ, NSE_FNO, etc.)
- instrument: Instrument type (INDEX, EQUITY, OPTIDX, etc.)
```

**Example for BANKNIFTY:**
```http
GET https://api.dhan.co/v2/marketfeed/ltp?securityId=13&exchangeSegment=NSE_EQ&instrument=INDEX
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "securityId": "13",
    "LTP": 45250.75,
    "LTT": "2024-01-15T14:30:00Z",
    "volume": 1234567
  }
}
```

### 2. Get OHLC Data
```http
GET https://api.dhan.co/v2/charts/intraday
access-token: your_access_token

Parameters:
- securityId: Security identifier
- exchangeSegment: Exchange segment
- instrument: Instrument type
- interval: Time interval (1, 5, 15, 30, 60 minutes)
```

**Example:**
```http
GET https://api.dhan.co/v2/charts/intraday?securityId=13&exchangeSegment=NSE_EQ&instrument=INDEX&interval=5
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "2024-01-15T09:15:00Z",
      "open": 45200.00,
      "high": 45280.50,
      "low": 45180.25,
      "close": 45250.75,
      "volume": 12345
    }
  ]
}
```

### 3. India VIX Data
```http
GET https://api.dhan.co/v2/marketfeed/ltp?securityId=27&exchangeSegment=NSE_EQ&instrument=INDEX
```

## 🎯 Instrument Master & Option Chain

### 1. Download Instrument Master
```http
GET https://images.dhan.co/api-data/api-scrip-master.csv
```

**CSV Structure:**
```csv
SEM_SECURITY_ID,SEM_TRADING_SYMBOL,SEM_INSTRUMENT_NAME,SEM_STRIKE_PRICE,SEM_EXPIRY_DATE,SEM_LOT_SIZE
218057,BANKNIFTY24JUL47000CE,OPTIDX,47000.00,2024-07-25,25
218058,BANKNIFTY24JUL47000PE,OPTIDX,47000.00,2024-07-25,25
```

### 2. Option Chain Construction Logic
```javascript
// Parse CSV and filter BANKNIFTY options
function buildOptionChain(csvData, spotPrice, expiry) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  const options = [];
  const atmStrike = Math.round(spotPrice / 100) * 100;
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    
    if (row[2] === 'OPTIDX' && 
        row[1].startsWith('BANKNIFTY') && 
        row[4] === expiry) {
      
      const strike = parseFloat(row[3]);
      if (strike >= atmStrike - 500 && strike <= atmStrike + 500) {
        options.push({
          securityId: row[0],
          tradingSymbol: row[1],
          strike: strike,
          optionType: row[1].includes('CE') ? 'CE' : 'PE',
          expiry: row[4],
          lotSize: parseInt(row[5])
        });
      }
    }
  }
  
  return options;
}
```

### 3. Fetch Option LTP
```javascript
async function getOptionLTP(securityId, accessToken) {
  const response = await fetch(
    `https://api.dhan.co/v2/marketfeed/ltp?securityId=${securityId}&exchangeSegment=NSE_FNO&instrument=OPTIDX`,
    {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.data.LTP || 0;
}
```

## 📋 Order Management

### 1. Place Order
```http
POST https://api.dhan.co/v2/orders
access-token: your_access_token
Content-Type: application/json

{
  "securityId": "218057",
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
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "orderId": "240115000123456",
    "orderStatus": "PENDING"
  }
}
```

### 2. Order Types

#### Market Order
```json
{
  "orderType": "MARKET",
  "price": 0,
  "triggerPrice": 0
}
```

#### Limit Order
```json
{
  "orderType": "LIMIT",
  "price": 150.50,
  "triggerPrice": 0
}
```

#### Stop Loss Market (SL-M)
```json
{
  "orderType": "SL-M",
  "price": 0,
  "triggerPrice": 140.00
}
```

#### Stop Loss Limit (SL)
```json
{
  "orderType": "SL",
  "price": 145.00,
  "triggerPrice": 140.00
}
```

### 3. Get Order Status
```http
GET https://api.dhan.co/v2/orders/{orderId}
access-token: your_access_token
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "orderId": "240115000123456",
    "orderStatus": "TRADED",
    "securityId": "218057",
    "quantity": 25,
    "price": 152.75,
    "tradedQuantity": 25,
    "pendingQuantity": 0,
    "createTime": "2024-01-15T10:30:00Z",
    "updateTime": "2024-01-15T10:30:15Z",
    "exchangeOrderId": "1100000012345678"
  }
}
```

### 4. Order Status Values
- **PENDING**: Order placed but not executed
- **TRADED**: Order fully executed
- **CANCELLED**: Order cancelled
- **REJECTED**: Order rejected by exchange
- **PARTIAL**: Partially executed

## 🎯 Security IDs Reference

### Major Indices
```javascript
const SECURITY_IDS = {
  NIFTY: "25",
  BANKNIFTY: "13",
  INDIA_VIX: "27",
  NIFTY_MIDCAP: "28",
  NIFTY_SMALLCAP: "29"
};
```

### Exchange Segments
```javascript
const EXCHANGE_SEGMENTS = {
  NSE_EQUITY: "NSE_EQ",
  NSE_FUTURES: "NSE_FNO",
  BSE_EQUITY: "BSE_EQ",
  BSE_FUTURES: "BSE_FNO"
};
```

### Instrument Types
```javascript
const INSTRUMENTS = {
  INDEX: "INDEX",
  EQUITY: "EQUITY",
  OPTION_INDEX: "OPTIDX",
  OPTION_EQUITY: "OPTSTK",
  FUTURE_INDEX: "FUTIDX",
  FUTURE_EQUITY: "FUTSTK"
};
```

## 🔄 Complete Trading Workflow

### 1. Authentication Flow
```javascript
// Step 1: Login
const loginResponse = await fetch('https://api.dhan.co/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: process.env.DHAN_CLIENT_ID,
    password: process.env.DHAN_PASSWORD,
    twoFA: process.env.DHAN_2FA,
    appName: 'WEB'
  })
});

const { access_token } = await loginResponse.json();
```

### 2. Market Data Collection
```javascript
// Step 2: Get market data
const [ltpData, ohlcData, vixData] = await Promise.all([
  fetch(`https://api.dhan.co/v2/marketfeed/ltp?securityId=13&exchangeSegment=NSE_EQ&instrument=INDEX`, {
    headers: { 'access-token': access_token }
  }),
  fetch(`https://api.dhan.co/v2/charts/intraday?securityId=13&exchangeSegment=NSE_EQ&instrument=INDEX&interval=5`, {
    headers: { 'access-token': access_token }
  }),
  fetch(`https://api.dhan.co/v2/marketfeed/ltp?securityId=27&exchangeSegment=NSE_EQ&instrument=INDEX`, {
    headers: { 'access-token': access_token }
  })
]);
```

### 3. Option Chain Building
```javascript
// Step 3: Build option chain
const masterResponse = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
const masterData = await masterResponse.text();

const spotPrice = ltpData.data.LTP;
const optionChain = buildOptionChain(masterData, spotPrice, getCurrentExpiry());

// Fetch LTP for each option
for (const option of optionChain) {
  option.ltp = await getOptionLTP(option.securityId, access_token);
}
```

### 4. Signal Generation & Order Placement
```javascript
// Step 4: Generate signal and place order
const signal = await generateTradingSignal(marketData, optionChain);

if (signal.action !== 'HOLD' && signal.confidence >= 0.75) {
  const selectedOption = selectOption(optionChain, signal);
  
  const order = {
    securityId: selectedOption.securityId,
    exchangeSegment: "NSE_FNO",
    transactionType: "BUY",
    quantity: 25,
    orderType: "MARKET",
    productType: "INTRADAY",
    validity: "DAY"
  };
  
  const orderResponse = await fetch('https://api.dhan.co/v2/orders', {
    method: 'POST',
    headers: {
      'access-token': access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  });
}
```

### 5. SL & Target Management
```javascript
// Step 5: Place SL and Target orders
const fillPrice = await getOrderFillPrice(orderId, access_token);

const slOrder = {
  securityId: selectedOption.securityId,
  exchangeSegment: "NSE_FNO",
  transactionType: "SELL",
  quantity: 25,
  orderType: "SL-M",
  productType: "INTRADAY",
  triggerPrice: fillPrice - 15,
  validity: "DAY"
};

const targetOrder = {
  securityId: selectedOption.securityId,
  exchangeSegment: "NSE_FNO",
  transactionType: "SELL",
  quantity: 25,
  orderType: "LIMIT",
  productType: "INTRADAY",
  price: fillPrice + 30,
  validity: "DAY"
};
```

## ⚠️ Error Handling

### 1. Common Error Codes
```javascript
const ERROR_CODES = {
  INVALID_TOKEN: 401,
  RATE_LIMIT: 429,
  INSUFFICIENT_FUNDS: 400,
  INVALID_SECURITY: 404,
  MARKET_CLOSED: 403
};
```

### 2. Error Handling Pattern
```javascript
async function makeAPICall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    
    // Implement retry logic
    if (error.status === 429) {
      await sleep(1000);
      return makeAPICall(url, options);
    }
    
    throw error;
  }
}
```

### 3. Rate Limiting
```javascript
// Implement rate limiting
const rateLimiter = {
  calls: 0,
  resetTime: Date.now() + 60000,
  
  async checkLimit() {
    if (Date.now() > this.resetTime) {
      this.calls = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    if (this.calls >= 100) { // 100 calls per minute
      const waitTime = this.resetTime - Date.now();
      await sleep(waitTime);
    }
    
    this.calls++;
  }
};
```

## 📊 Best Practices

### 1. API Call Optimization
- Batch multiple requests when possible
- Cache instrument master data
- Use appropriate intervals for market data
- Implement proper error handling and retries

### 2. Order Management
- Always validate order parameters
- Check account balance before placing orders
- Monitor order status after placement
- Implement proper SL/Target logic

### 3. Risk Management
- Validate option premiums before trading
- Implement position sizing rules
- Monitor VIX levels for volatility
- Set maximum daily loss limits

### 4. Performance Monitoring
- Log all API calls and responses
- Monitor execution times
- Track success/failure rates
- Implement alerting for critical failures

This comprehensive guide provides all the necessary information to successfully integrate Dhan API into your trading bot workflow.