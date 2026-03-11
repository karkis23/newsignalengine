# ENHANCED GOOGLE SHEETS SETUP FOR TRADING BOT
# ==============================================
# Complete Setup for All Nodes with New Changes

## TABLE OF CONTENTS
## ================
1. SHEET STRUCTURE OVERVIEW
2. DETAILED SHEET CONFIGURATIONS
3. FORMULAS AND CALCULATIONS
4. CONDITIONAL FORMATTING
5. CHARTS AND DASHBOARDS
6. AUTOMATION SCRIPTS
7. MOBILE OPTIMIZATION
8. BACKUP AND SECURITY

## ================================================================
## 1. SHEET STRUCTURE OVERVIEW
## ================================================================

### REQUIRED SHEETS:
1. **Signals** - AI predictions and technical analysis
2. **Trades** - Complete trade lifecycle tracking
3. **Active_Exit_Orders** - SL/Target order monitoring
4. **Option_Chain_Data** - CE and PE option chain analysis
5. **Writers_Zone_Analysis** - Enhanced OI analysis
6. **Daily_Summary** - Performance analytics
7. **System_Logs** - Error tracking and debugging
8. **Risk_Monitoring** - Real-time risk assessment
9. **Sentiment_History** - Market sentiment tracking
10. **Performance_Dashboard** - Key metrics summary

## ================================================================
## 2. DETAILED SHEET CONFIGURATIONS
## ================================================================

### SHEET 1: SIGNALS (Enhanced)
```
A1: Timestamp
B1: Signal
C1: Confidence
D1: RSI
E1: MACD
F1: Momentum
G1: Volume Ratio
H1: VIX
I1: Sentiment
J1: Writers Zone
K1: Candle Pattern
L1: Spot Price
M1: Strike Price
N1: Option Type
O1: Expiry Date
P1: Market Regime
Q1: Detected Signals Count
R1: Total Strength
S1: VIX Condition
T1: Analysis Reasoning
```

**Sample Data Row:**
```
2024-01-15T10:30:00 | BUY_CE | 0.85 | 28 | 2.1 | 4.2 | 2.1 | 14 | BULLISH | BULLISH | HAMMER | 45250 | 45200 | CE | 25JUL24 | BULLISH_TREND | 8 | 4.2 | NORMAL_VOLATILITY | RSI_OVERSOLD,MACD_BULLISH,MOMENTUM_STRONG_BULLISH
```

### SHEET 2: TRADES (Enhanced)
```
A1: Entry Order ID
B1: Timestamp
C1: Symbol
D1: Entry Price
E1: Stop Loss
F1: Target
G1: Quantity
H1: Status
I1: Signal
J1: Confidence
K1: Exit Price
L1: PnL
M1: Exit Type
N1: Exit Timestamp
O1: Duration (Minutes)
P1: ROI (%)
Q1: Risk Reward Ratio
R1: Max Favorable Excursion
S1: Max Adverse Excursion
T1: Slippage
U1: Commission
V1: Net PnL
```

**Formulas:**
- Duration (O2): `=IF(N2<>"", ROUND((N2-B2)*24*60, 0), "")`
- ROI (P2): `=IF(L2<>"", ROUND((L2/D2)*100, 2), "")`
- Risk Reward (Q2): `=IF(AND(F2<>"", E2<>""), ROUND((F2-D2)/(D2-E2), 2), "")`
- Net PnL (V2): `=IF(L2<>"", L2-U2, "")`

### SHEET 3: ACTIVE_EXIT_ORDERS (Enhanced)
```
A1: Entry Order ID
B1: SL Order ID
C1: Target Order ID
D1: Symbol
E1: Entry Price
F1: SL Price
G1: Target Price
H1: Quantity
I1: Timestamp
J1: Status
K1: Exit Type
L1: Exit Price
M1: PnL
N1: Exit Timestamp
O1: Current Price
P1: Distance to SL
Q1: Distance to Target
R1: Time in Trade
S1: Unrealized PnL
```

**Formulas:**
- Distance to SL (P2): `=IF(AND(O2<>"", F2<>""), O2-F2, "")`
- Distance to Target (Q2): `=IF(AND(O2<>"", G2<>""), G2-O2, "")`
- Time in Trade (R2): `=IF(I2<>"", ROUND((NOW()-I2)*24*60, 0), "")`
- Unrealized PnL (S2): `=IF(AND(O2<>"", E2<>""), (O2-E2)*H2, "")`

### SHEET 4: OPTION_CHAIN_DATA (New)
```
A1: Timestamp
B1: Strike Price
C1: Option Type
D1: Open Interest
E1: Volume
F1: LTP
G1: Bid
H1: Ask
I1: IV
J1: Delta
K1: Gamma
L1: Theta
M1: Vega
N1: OI Change
O1: Volume Change
P1: Price Change
Q1: IV Change
```

### SHEET 5: WRITERS_ZONE_ANALYSIS (New)
```
A1: Timestamp
B1: Current Price
C1: Writers Zone
D1: Confidence
E1: Max CE OI
F1: Max PE OI
G1: Max CE Strike
H1: Max PE Strike
I1: Put Call Ratio
J1: Total CE OI
K1: Total PE OI
L1: Significant CE Levels
M1: Significant PE Levels
N1: Distance from CE Strike
O1: Distance from PE Strike
P1: Market Structure
Q1: Reasoning
R1: Support Levels
S1: Resistance Levels
```

### SHEET 6: DAILY_SUMMARY (Enhanced)
```
A1: Date
B1: Total Trades
C1: Winning Trades
D1: Losing Trades
E1: Win Rate (%)
F1: Total PnL
G1: Max Profit
H1: Max Loss
I1: Average Trade Duration
J1: ROI (%)
K1: Sharpe Ratio
L1: Max Drawdown
M1: Profit Factor
N1: Average Win
O1: Average Loss
P1: Largest Win
Q1: Largest Loss
R1: Consecutive Wins
S1: Consecutive Losses
T1: Total Commission
U1: Net PnL
V1: Active Positions
W1: Signals Generated
X1: Signal Accuracy
```

**Formulas:**
- Win Rate (E2): `=IF(B2>0, ROUND((C2/B2)*100, 2), 0)`
- Profit Factor (M2): `=IF(O2<>0, ABS(N2/O2), 0)`
- Sharpe Ratio (K2): `=IF(STDEV(F:F)>0, AVERAGE(F:F)/STDEV(F:F), 0)`

### SHEET 7: SYSTEM_LOGS (Enhanced)
```
A1: Timestamp
B1: Event Type
C1: Severity
D1: Component
E1: Message
F1: Order ID
G1: Symbol
H1: Status
I1: Error Code
J1: Error Details
K1: Resolution
L1: Response Time
M1: API Endpoint
N1: Request Data
O1: Response Data
```

### SHEET 8: RISK_MONITORING (Enhanced)
```
A1: Date
B1: Current Balance
C1: Daily PnL
D1: Max Drawdown
E1: Active Positions
F1: Risk Level
G1: VIX Level
H1: Market Sentiment
I1: Position Size
J1: Leverage
K1: Margin Used
L1: Available Margin
M1: Risk Per Trade
N1: Portfolio Heat
O1: Correlation Risk
P1: Concentration Risk
Q1: Liquidity Risk
```

### SHEET 9: SENTIMENT_HISTORY (New)
```
A1: Timestamp
B1: Sentiment
C1: Sentiment Score
D1: Fear Greed Index
E1: Fear Greed Label
F1: Articles Analyzed
G1: Confidence
H1: Trend
I1: News Headlines
J1: Key Events
K1: Market Impact
L1: Sector Sentiment
M1: Global Sentiment
N1: Economic Indicators
```

### SHEET 10: PERFORMANCE_DASHBOARD (New)
```
A1: Metric
B1: Current Value
C1: Target Value
D1: Status
E1: Trend
F1: Last Updated

A2: Total Trades
A3: Win Rate
A4: Daily PnL
A5: Max Drawdown
A6: Sharpe Ratio
A7: Active Positions
A8: System Uptime
A9: API Response Time
A10: Signal Accuracy
A11: Risk Level
```

## ================================================================
## 3. FORMULAS AND CALCULATIONS
## ================================================================

### ADVANCED PERFORMANCE METRICS

#### Sharpe Ratio Calculation
```excel
=IF(STDEV(Daily_Summary!F:F)>0, AVERAGE(Daily_Summary!F:F)/STDEV(Daily_Summary!F:F), 0)
```

#### Maximum Drawdown
```excel
=MIN(Daily_Summary!F:F)/MAX(Daily_Summary!F:F)-1
```

#### Profit Factor
```excel
=SUMIF(Trades!L:L,">0",Trades!L:L)/ABS(SUMIF(Trades!L:L,"<0",Trades!L:L))
```

#### Win Rate by Signal Type
```excel
=COUNTIFS(Trades!I:I,"BUY_CE",Trades!L:L,">0")/COUNTIF(Trades!I:I,"BUY_CE")
```

#### Average Holding Time
```excel
=AVERAGE(Trades!O:O)
```

#### Risk-Adjusted Return
```excel
=Daily_Summary!F2/Daily_Summary!L2
```

### REAL-TIME CALCULATIONS

#### Current Portfolio Value
```excel
=SUMIF(Active_Exit_Orders!J:J,"ACTIVE",Active_Exit_Orders!S:S)+Risk_Monitoring!B2
```

#### Position Heat Map
```excel
=SUMIF(Active_Exit_Orders!J:J,"ACTIVE",Active_Exit_Orders!H:H)*Active_Exit_Orders!E:E/Risk_Monitoring!B2
```

#### Signal Accuracy Tracker
```excel
=COUNTIFS(Trades!H:H,"CLOSED",Trades!L:L,">0")/COUNTIF(Trades!H:H,"CLOSED")
```

## ================================================================
## 4. CONDITIONAL FORMATTING
## ================================================================

### TRADES SHEET FORMATTING
- **Green**: PnL > 0 (Profitable trades)
- **Red**: PnL < 0 (Loss trades)
- **Yellow**: Status = "ACTIVE" (Active positions)
- **Blue**: ROI > 10% (High return trades)
- **Orange**: Duration > 240 minutes (Long duration trades)

### SIGNALS SHEET FORMATTING
- **Green**: Signal = "BUY_CE" or "BUY_PE"
- **Gray**: Signal = "HOLD"
- **Red**: VIX > 18
- **Blue**: Confidence > 0.8

### RISK MONITORING FORMATTING
- **Red**: Risk Level = "HIGH" or "CRITICAL"
- **Yellow**: Risk Level = "MEDIUM"
- **Green**: Risk Level = "LOW"
- **Purple**: Daily PnL < -2000

### WRITERS ZONE FORMATTING
- **Green**: Writers Zone = "BULLISH"
- **Red**: Writers Zone = "BEARISH"
- **Gray**: Writers Zone = "NEUTRAL"
- **Blue**: Confidence > 0.7

## ================================================================
## 5. CHARTS AND DASHBOARDS
## ================================================================

### CHART 1: DAILY PnL TREND
```
Type: Line Chart
Data: Daily_Summary!A:A, Daily_Summary!F:F
X-Axis: Date
Y-Axis: Total PnL
```

### CHART 2: WIN RATE BY SIGNAL TYPE
```
Type: Column Chart
Data: Pivot table of Trades!I:I vs Win Rate
Categories: BUY_CE, BUY_PE, HOLD
Values: Win Rate %
```

### CHART 3: RISK HEAT MAP
```
Type: Scatter Plot
X-Axis: Trade Duration
Y-Axis: PnL
Size: Position Size
Color: Signal Type
```

### CHART 4: SENTIMENT VS PERFORMANCE
```
Type: Dual Axis Chart
Primary: Daily PnL (Line)
Secondary: Sentiment Score (Column)
X-Axis: Date
```

### CHART 5: OPTION CHAIN VISUALIZATION
```
Type: Surface Chart
X-Axis: Strike Prices
Y-Axis: Expiry Dates
Z-Axis: Open Interest
```

## ================================================================
## 6. AUTOMATION SCRIPTS (GOOGLE APPS SCRIPT)
## ================================================================

### SCRIPT 1: REAL-TIME DASHBOARD UPDATE
```javascript
function updateDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName('Performance_Dashboard');
  const trades = ss.getSheetByName('Trades');
  const signals = ss.getSheetByName('Signals');
  
  // Update key metrics
  const totalTrades = trades.getLastRow() - 1;
  const activeTrades = trades.getRange('H:H').getValues().filter(row => row[0] === 'ACTIVE').length;
  
  dashboard.getRange('B2').setValue(totalTrades);
  dashboard.getRange('B7').setValue(activeTrades);
  dashboard.getRange('F2').setValue(new Date());
}
```

### SCRIPT 2: AUTOMATED ALERTS
```javascript
function checkAlerts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const risk = ss.getSheetByName('Risk_Monitoring');
  const lastRow = risk.getLastRow();
  
  const dailyPnL = risk.getRange(lastRow, 3).getValue();
  const riskLevel = risk.getRange(lastRow, 6).getValue();
  
  if (dailyPnL < -5000) {
    sendAlert('Daily loss limit approaching: ' + dailyPnL);
  }
  
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    sendAlert('Risk level elevated: ' + riskLevel);
  }
}

function sendAlert(message) {
  MailApp.sendEmail({
    to: 'your-email@gmail.com',
    subject: 'Trading Bot Alert',
    body: message + '\n\nTimestamp: ' + new Date()
  });
}
```

### SCRIPT 3: DATA VALIDATION
```javascript
function validateData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trades = ss.getSheetByName('Trades');
  const data = trades.getDataRange().getValues();
  
  let errors = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Validate PnL calculation
    if (row[10] && row[3] && row[10] !== (row[10] - row[3]) * row[6]) {
      errors.push(`Row ${i+1}: PnL calculation error`);
    }
    
    // Validate dates
    if (row[13] && row[1] && row[13] < row[1]) {
      errors.push(`Row ${i+1}: Exit time before entry time`);
    }
  }
  
  if (errors.length > 0) {
    Logger.log('Data validation errors: ' + errors.join(', '));
  }
}
```

### SCRIPT 4: PERFORMANCE REPORT GENERATOR
```javascript
function generateWeeklyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trades = ss.getSheetByName('Trades');
  const summary = ss.getSheetByName('Daily_Summary');
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tradesData = trades.getDataRange().getValues();
  
  let weeklyTrades = tradesData.filter(row => 
    row[1] && new Date(row[1]) >= oneWeekAgo && row[7] === 'CLOSED'
  );
  
  const totalTrades = weeklyTrades.length;
  const winningTrades = weeklyTrades.filter(row => row[11] > 0).length;
  const totalPnL = weeklyTrades.reduce((sum, row) => sum + (row[11] || 0), 0);
  
  const report = `
Weekly Trading Report
====================
Period: ${oneWeekAgo.toDateString()} to ${new Date().toDateString()}

Total Trades: ${totalTrades}
Winning Trades: ${winningTrades}
Win Rate: ${((winningTrades / totalTrades) * 100).toFixed(2)}%
Total PnL: ${totalPnL.toFixed(2)}
Average PnL per Trade: ${(totalPnL / totalTrades).toFixed(2)}

Best Trade: ${Math.max(...weeklyTrades.map(row => row[11] || 0)).toFixed(2)}
Worst Trade: ${Math.min(...weeklyTrades.map(row => row[11] || 0)).toFixed(2)}
  `;
  
  MailApp.sendEmail({
    to: 'your-email@gmail.com',
    subject: 'Weekly Trading Report',
    body: report
  });
}
```

## ================================================================
## 7. MOBILE OPTIMIZATION
## ================================================================

### MOBILE DASHBOARD SHEET
Create a simplified view for mobile monitoring:

```
A1: Metric | B1: Value | C1: Status
A2: Daily PnL | =Daily_Summary!F2 | =IF(B2>0,"✅","❌")
A3: Active Trades | =COUNTIF(Trades!H:H,"ACTIVE") | =IF(B3<5,"✅","⚠️")
A4: Win Rate | =Daily_Summary!E2 | =IF(B4>60,"✅","❌")
A5: Risk Level | =Risk_Monitoring!F2 | =IF(B5="LOW","✅","❌")
```

### QUICK ACTION BUTTONS
```javascript
function emergencyStop() {
  // Set emergency stop flag
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const control = ss.getSheetByName('Control_Panel');
  control.getRange('A1').setValue('EMERGENCY_STOP_ACTIVATED');
  
  sendAlert('EMERGENCY STOP ACTIVATED - All trading halted');
}

function resetSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const control = ss.getSheetByName('Control_Panel');
  control.getRange('A1').setValue('SYSTEM_NORMAL');
  
  sendAlert('System reset - Trading resumed');
}
```

## ================================================================
## 8. BACKUP AND SECURITY
## ================================================================

### AUTOMATED BACKUP SCRIPT
```javascript
function createDailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupName = `Trading_Bot_Backup_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
  
  const backup = ss.copy(backupName);
  
  // Move to backup folder
  const backupFolder = DriveApp.getFoldersByName('Trading_Backups').next();
  DriveApp.getFileById(backup.getId()).moveTo(backupFolder);
  
  Logger.log('Backup created: ' + backupName);
}
```

### DATA PROTECTION
```javascript
function protectCriticalRanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trades = ss.getSheetByName('Trades');
  
  // Protect formula columns
  const protection = trades.getRange('O:V').protect();
  protection.setDescription('Protected formula cells');
  protection.setWarningOnly(true);
}
```

### ACCESS CONTROL
```javascript
function setupSheetPermissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Add editors
  ss.addEditor('trading-bot@your-domain.com');
  
  // Add viewers
  ss.addViewer('monitor@your-domain.com');
}
```

## ================================================================
## 9. INTEGRATION WITH N8N
## ================================================================

### WEBHOOK SETUP
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(data.sheetName);
  
  // Append data to appropriate sheet
  sheet.appendRow(Object.values(data.rowData));
  
  return ContentService.createTextOutput('Success');
}
```

### N8N GOOGLE SHEETS NODE CONFIGURATION
```json
{
  "authentication": "serviceAccount",
  "resource": "spreadsheet",
  "operation": "appendOrUpdate",
  "documentId": "{{$env.GOOGLE_SHEET_ID}}",
  "sheetName": "Signals",
  "dataMode": "defineBelow",
  "valueInputMode": "raw",
  "fieldsUi": {
    "values": [
      {
        "fieldId": "Timestamp",
        "fieldValue": "={{new Date().toISOString()}}"
      },
      {
        "fieldId": "Signal",
        "fieldValue": "={{$node['AI Trade Confirmation'].json.signal}}"
      },
      {
        "fieldId": "Confidence",
        "fieldValue": "={{$node['AI Trade Confirmation'].json.confidence}}"
      }
    ]
  }
}
```

## ================================================================
## 10. MAINTENANCE AND MONITORING
## ================================================================

### DAILY MAINTENANCE CHECKLIST
□ Check data accuracy in all sheets
□ Verify formula calculations
□ Review conditional formatting
□ Check for data gaps
□ Validate backup creation
□ Monitor sheet performance

### WEEKLY TASKS
□ Generate performance reports
□ Review and optimize formulas
□ Check data validation rules
□ Update conditional formatting
□ Review access permissions
□ Clean up old data

### MONTHLY TASKS
□ Comprehensive data audit
□ Performance optimization
□ Security review
□ Backup verification
□ Documentation updates
□ User training updates

This enhanced Google Sheets setup provides comprehensive tracking, analysis, and monitoring capabilities for your advanced trading bot system! 🚀📈