# Bracket Order Implementation Guide

## Overview
This guide explains how to implement a bracket order system in Angel One SmartAPI using n8n, since native bracket orders are not supported for intraday options trading.

## System Architecture

### Main Trading Workflow
1. **Entry Order Placement** - Market order for option buying
2. **SL & Target Calculation** - Calculate exit levels based on entry fill
3. **Exit Orders Placement** - Place both SL-M and LIMIT orders simultaneously
4. **Order Monitoring** - Separate workflow monitors for execution
5. **Auto Cancellation** - Cancel opposite order when one executes

## Implementation Steps

### Step 1: Enhanced Main Workflow

The main workflow now includes these additional nodes after entry order execution:

#### Node 18A: Place Stop Loss Order (SL-M)
```json
{
  "variety": "NORMAL",
  "tradingsymbol": "{{$json.symbol}}",
  "symboltoken": "{{$json.symbolToken}}",
  "transactiontype": "SELL",
  "exchange": "NFO",
  "ordertype": "SL-M",
  "producttype": "INTRADAY",
  "duration": "DAY",
  "price": "0",
  "triggerprice": "{{$json.stopLoss}}",
  "quantity": "{{$json.quantity}}"
}
```

#### Node 18B: Place Target Order (LIMIT)
```json
{
  "variety": "NORMAL",
  "tradingsymbol": "{{$json.symbol}}",
  "symboltoken": "{{$json.symbolToken}}",
  "transactiontype": "SELL",
  "exchange": "NFO",
  "ordertype": "LIMIT",
  "producttype": "INTRADAY",
  "duration": "DAY",
  "price": "{{$json.target}}",
  "quantity": "{{$json.quantity}}"
}
```

### Step 2: Exit Order Monitoring System

A separate workflow monitors exit orders every 2 minutes:

#### Key Features:
- **Real-time Monitoring** - Checks order status every 2 minutes
- **Automatic Cancellation** - Cancels opposite order when one executes
- **P&L Calculation** - Calculates profit/loss automatically
- **Status Updates** - Updates Google Sheets with execution details

#### Monitoring Logic:
```javascript
// Check if SL order is executed
if (slOrder && slOrder.orderstatus === 'complete') {
  executedOrder = slOrder;
  orderToCancel = targetOrderId;
  exitType = 'STOP_LOSS';
}
// Check if Target order is executed
else if (targetOrder && targetOrder.orderstatus === 'complete') {
  executedOrder = targetOrder;
  orderToCancel = slOrderId;
  exitType = 'TARGET';
}
```

### Step 3: Google Sheets Integration

#### New Sheet: "Active_Exit_Orders"
Columns:
- Entry Order ID
- SL Order ID  
- Target Order ID
- Symbol
- Entry Price
- SL Price
- Target Price
- Quantity
- Status
- Exit Type
- Exit Price
- PnL
- Timestamp

#### Updated Sheet: "Trades"
Additional columns:
- Exit Type (TARGET/STOP_LOSS/EOD_CLOSE)
- Exit Price
- PnL
- Exit Timestamp

## Risk Management Features

### 1. Lot Size Configuration
```javascript
// Dynamic lot size based on underlying
const underlying = 'BANKNIFTY'; // Can be made dynamic
const lotSize = underlying === 'BANKNIFTY' ? 25 : 50; // NIFTY = 50
```

### 2. Price Validation
```javascript
// Ensure minimum values
const finalStopLoss = Math.max(stopLoss, 0.5); // Minimum SL of 0.5
const finalTarget = Math.max(target, fillPrice + 5); // Minimum target 5 points above entry
```

### 3. Order Status Validation
```javascript
// Validate entry order execution before placing exit orders
if (!entryOrder || entryOrder.orderstatus !== 'complete') {
  throw new Error('Entry order not properly executed');
}
```

## Advanced Features

### 1. Time-based Exit (EOD Close)
```javascript
// Auto-close positions at 3:15 PM
const currentTime = new Date();
const marketCloseTime = new Date();
marketCloseTime.setHours(15, 15, 0, 0);

if (currentTime >= marketCloseTime) {
  // Cancel both SL and Target orders
  // Place market order to close position
}
```

### 2. Trailing Stop Loss
```javascript
// Update SL when target moves favorably
if (currentPrice > entryPrice + 15) { // 1:1 RR achieved
  const newSL = entryPrice + 5; // Move SL to small profit
  // Cancel existing SL order and place new one
}
```

### 3. Max Daily Loss Protection
```javascript
// Check daily P&L before placing new trades
const dailyPnL = calculateDailyPnL();
if (dailyPnL < -5000) { // Max daily loss limit
  return { signal: 'HOLD', reason: 'Daily loss limit reached' };
}
```

## Error Handling

### 1. Order Placement Failures
```javascript
// Retry mechanism for failed orders
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries) {
  try {
    const orderResult = await placeOrder(orderData);
    if (orderResult.status === 'success') break;
  } catch (error) {
    retryCount++;
    await sleep(2000); // Wait 2 seconds before retry
  }
}
```

### 2. Authentication Issues
```javascript
// Handle TOTP expiry
if (response.status === 401) {
  // Refresh TOTP and retry
  const newTOTP = generateTOTP();
  // Update environment variable and retry
}
```

### 3. Network Failures
```javascript
// Implement exponential backoff
const delay = Math.pow(2, retryCount) * 1000;
await sleep(delay);
```

## Monitoring and Alerts

### 1. Real-time Dashboards
- Active positions count
- Daily P&L tracking
- Order execution status
- System health monitoring

### 2. Alert System
```javascript
// Send alerts for critical events
function sendAlert(message, priority = 'INFO') {
  const alertData = {
    timestamp: new Date().toISOString(),
    message: message,
    priority: priority,
    systemStatus: getSystemStatus()
  };
  
  // Log to Google Sheets alerts tab
  logAlert(alertData);
}
```

## Performance Optimization

### 1. Batch Operations
```javascript
// Process multiple orders in batch
const batchSize = 5;
const orderBatches = chunkArray(orders, batchSize);

for (const batch of orderBatches) {
  await Promise.all(batch.map(order => processOrder(order)));
  await sleep(1000); // Rate limiting
}
```

### 2. Caching
```javascript
// Cache frequently accessed data
const cache = new Map();
const cacheExpiry = 60000; // 1 minute

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheExpiry) {
    return cached.data;
  }
  return null;
}
```

## Testing and Validation

### 1. Paper Trading Mode
```javascript
// Override order placement in paper mode
if (process.env.PAPER_TRADING_MODE === 'true') {
  return simulateOrderPlacement(orderData);
}
```

### 2. Order Validation
```javascript
// Validate order parameters before submission
function validateOrder(orderData) {
  const required = ['tradingsymbol', 'quantity', 'ordertype'];
  for (const field of required) {
    if (!orderData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}
```

## Deployment Checklist

- [ ] Main trading workflow tested
- [ ] Exit monitoring workflow active
- [ ] Google Sheets properly configured
- [ ] Angel One API credentials valid
- [ ] TOTP authentication working
- [ ] Paper trading mode validated
- [ ] Error handling tested
- [ ] Monitoring dashboards setup
- [ ] Alert system configured
- [ ] Backup procedures in place

## Maintenance Tasks

### Daily
- [ ] Check system logs
- [ ] Verify order executions
- [ ] Review P&L reports
- [ ] Monitor API rate limits

### Weekly
- [ ] Update TOTP secrets
- [ ] Review system performance
- [ ] Analyze trading results
- [ ] Update risk parameters

### Monthly
- [ ] Rotate API keys
- [ ] Review and optimize workflows
- [ ] Update documentation
- [ ] Backup configuration files

This implementation provides a robust bracket order system that mimics native bracket order functionality while providing enhanced monitoring and risk management capabilities.