# Enhanced Google Sheets Setup for Bracket Order System

## Overview
This guide extends the basic Google Sheets setup to support the enhanced bracket order system with SL/Target monitoring and comprehensive trade tracking.

## Required Sheets Structure

### 1. Signals Sheet (Existing - Enhanced)
```
A1: Timestamp
B1: Signal
C1: Confidence
D1: RSI
E1: MACD
F1: VIX
G1: Sentiment
H1: Writers Zone
I1: Spot Price
J1: Strike Price
K1: Option Type
L1: Expiry Date
```

### 2. Trades Sheet (Enhanced)
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
```

### 3. Active_Exit_Orders Sheet (New)
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
```

### 4. Daily_Summary Sheet (New)
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
```

### 5. System_Logs Sheet (New)
```
A1: Timestamp
B1: Event Type
C1: Message
D1: Order ID
E1: Symbol
F1: Status
G1: Error Details
```

### 6. Risk_Monitoring Sheet (New)
```
A1: Date
B1: Current Balance
C1: Daily PnL
D1: Max Drawdown
E1: Active Positions
F1: Risk Level
G1: VIX Level
H1: Market Sentiment
```

## Advanced Formulas and Functions

### 1. Trades Sheet Calculations

#### Duration Calculation (Column O)
```excel
=IF(N2<>"", ROUND((N2-B2)*24*60, 0), "")
```

#### ROI Calculation (Column P)
```excel
=IF(L2<>"", ROUND((L2/D2)*100, 2), "")
```

### 2. Daily_Summary Sheet Calculations

#### Win Rate Calculation (Column E)
```excel
=IF(B2>0, ROUND((C2/B2)*100, 2), 0)
```

#### Average Trade Duration (Column I)
```excel
=AVERAGEIF(Trades!H:H, "CLOSED", Trades!O:O)
```

### 3. Risk_Monitoring Sheet Calculations

#### Max Drawdown (Column D)
```excel
=MIN(C:C)
```

#### Risk Level Assessment (Column F)
```excel
=IF(C2<-2000, "HIGH", IF(C2<-1000, "MEDIUM", "LOW"))
```

## Conditional Formatting Rules

### 1. Trades Sheet
- **Green**: PnL > 0 (Profitable trades)
- **Red**: PnL < 0 (Loss trades)
- **Yellow**: Status = "ACTIVE" (Active positions)
- **Gray**: Status = "CANCELLED"

### 2. Active_Exit_Orders Sheet
- **Blue**: Status = "ACTIVE"
- **Green**: Exit Type = "TARGET"
- **Red**: Exit Type = "STOP_LOSS"
- **Orange**: Exit Type = "EOD_CLOSE"

### 3. Daily_Summary Sheet
- **Green**: Win Rate > 60%
- **Yellow**: Win Rate 40-60%
- **Red**: Win Rate < 40%

## Data Validation Rules

### 1. Trades Sheet
- **Status Column**: Dropdown with values: ACTIVE, CLOSED, CANCELLED
- **Exit Type Column**: Dropdown with values: TARGET, STOP_LOSS, EOD_CLOSE, MANUAL

### 2. Active_Exit_Orders Sheet
- **Status Column**: Dropdown with values: ACTIVE, COMPLETED, CANCELLED

### 3. Risk_Monitoring Sheet
- **Risk Level Column**: Dropdown with values: LOW, MEDIUM, HIGH, CRITICAL

## Charts and Visualizations

### 1. Daily P&L Chart
```
Chart Type: Line Chart
Data Range: Daily_Summary!A:F
X-Axis: Date
Y-Axis: Total PnL
```

### 2. Win Rate Trend
```
Chart Type: Column Chart
Data Range: Daily_Summary!A:A, Daily_Summary!E:E
X-Axis: Date
Y-Axis: Win Rate (%)
```

### 3. Trade Distribution
```
Chart Type: Pie Chart
Data: Count of TARGET vs STOP_LOSS exits
```

## Automated Calculations

### 1. Real-time P&L Tracking
```javascript
// Google Apps Script function
function updateRealTimePnL() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trades');
  const data = sheet.getDataRange().getValues();
  
  let totalPnL = 0;
  let activePositions = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === 'ACTIVE') { // Status column
      activePositions++;
    } else if (data[i][7] === 'CLOSED' && data[i][11]) { // PnL column
      totalPnL += parseFloat(data[i][11]);
    }
  }
  
  // Update summary cells
  sheet.getRange('Q1').setValue('Total PnL');
  sheet.getRange('Q2').setValue(totalPnL);
  sheet.getRange('R1').setValue('Active Positions');
  sheet.getRange('R2').setValue(activePositions);
}
```

### 2. Daily Summary Auto-Update
```javascript
function updateDailySummary() {
  const tradesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trades');
  const summarySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Daily_Summary');
  
  const today = new Date().toDateString();
  const trades = tradesSheet.getDataRange().getValues();
  
  let totalTrades = 0;
  let winningTrades = 0;
  let totalPnL = 0;
  let maxProfit = 0;
  let maxLoss = 0;
  
  trades.forEach(trade => {
    if (trade[1] && new Date(trade[1]).toDateString() === today && trade[7] === 'CLOSED') {
      totalTrades++;
      const pnl = parseFloat(trade[11]) || 0;
      totalPnL += pnl;
      
      if (pnl > 0) {
        winningTrades++;
        maxProfit = Math.max(maxProfit, pnl);
      } else {
        maxLoss = Math.min(maxLoss, pnl);
      }
    }
  });
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Update summary sheet
  summarySheet.appendRow([
    today,
    totalTrades,
    winningTrades,
    totalTrades - winningTrades,
    winRate.toFixed(2),
    totalPnL,
    maxProfit,
    maxLoss,
    '', // Average duration - calculated by formula
    '' // ROI - calculated by formula
  ]);
}
```

## Triggers and Automation

### 1. Time-based Triggers
```javascript
// Set up daily summary update at market close
function createTimeTrigger() {
  ScriptApp.newTrigger('updateDailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(16) // 4 PM
    .create();
}
```

### 2. Change-based Triggers
```javascript
// Update calculations when trades are modified
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  if (sheet.getName() === 'Trades' && range.getColumn() === 8) { // Status column
    updateRealTimePnL();
  }
}
```

## Data Protection and Backup

### 1. Sheet Protection
```javascript
// Protect formula cells from accidental editing
function protectFormulaCells() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trades');
  const protection = sheet.getRange('O:P').protect(); // Duration and ROI columns
  
  protection.setDescription('Protected formula cells');
  protection.setWarningOnly(true);
}
```

### 2. Automated Backup
```javascript
// Create daily backup of trading data
function createDailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupName = `Trading_Backup_${new Date().toISOString().split('T')[0]}`;
  
  const backup = ss.copy(backupName);
  
  // Move to backup folder
  const backupFolder = DriveApp.getFoldersByName('Trading_Backups').next();
  DriveApp.getFileById(backup.getId()).moveTo(backupFolder);
}
```

## Performance Monitoring Dashboard

### 1. Key Metrics Summary
Create a dashboard section with:
- Current day P&L
- Week-to-date performance
- Month-to-date performance
- Win rate trend
- Average trade duration
- Risk metrics

### 2. Alert System
```javascript
// Send email alerts for significant events
function checkAlerts() {
  const riskSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Risk_Monitoring');
  const lastRow = riskSheet.getLastRow();
  const dailyPnL = riskSheet.getRange(lastRow, 3).getValue();
  
  if (dailyPnL < -2000) {
    MailApp.sendEmail({
      to: 'your-email@gmail.com',
      subject: 'Trading Alert: Daily Loss Limit Approaching',
      body: `Current daily P&L: ${dailyPnL}. Consider stopping trading for today.`
    });
  }
}
```

## Mobile Access Optimization

### 1. Mobile-Friendly Views
- Create simplified views for mobile monitoring
- Use larger fonts and clear color coding
- Implement swipe-friendly navigation

### 2. Quick Action Buttons
```javascript
// Create buttons for common actions
function createActionButtons() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control_Panel');
  
  // Emergency stop button
  sheet.getRange('A1').setValue('EMERGENCY STOP');
  sheet.getRange('A1').setBackground('#FF0000');
  
  // Daily summary refresh
  sheet.getRange('B1').setValue('REFRESH SUMMARY');
  sheet.getRange('B1').setBackground('#00FF00');
}
```

## Integration with n8n Workflows

### 1. Webhook Endpoints
Set up Google Apps Script web apps to receive data from n8n:

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheetName);
  
  // Append data to appropriate sheet
  sheet.appendRow(Object.values(data.rowData));
  
  return ContentService.createTextOutput('Success');
}
```

### 2. Real-time Updates
Configure n8n to send real-time updates to Google Sheets for:
- Order status changes
- Price movements
- System alerts
- Performance metrics

This enhanced Google Sheets setup provides comprehensive tracking, monitoring, and analysis capabilities for your bracket order trading system.