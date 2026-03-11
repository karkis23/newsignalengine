# 📊 Google Sheets Setup Guide: Dhan Trading Bot

## 📋 Overview

This guide provides detailed instructions for setting up Google Sheets integration with your Dhan trading bot, including service account configuration, sheet structure, and data validation.

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" dropdown
   - Click "New Project"
   - Project Name: `Dhan Trading Bot`
   - Organization: Your organization (if applicable)
   - Click "Create"

### 1.2 Enable Google Sheets API

1. **Navigate to APIs & Services**:
   - In the left sidebar, click "APIs & Services" > "Library"
2. **Search for Google Sheets API**:
   - Type "Google Sheets API" in the search box
   - Click on "Google Sheets API"
   - Click "Enable"

### 1.3 Create Service Account

1. **Go to Credentials**:
   - Click "APIs & Services" > "Credentials"
2. **Create Service Account**:
   - Click "Create Credentials" > "Service Account"
   - Service Account Name: `dhan-trading-bot-service`
   - Service Account ID: `dhan-trading-bot-service`
   - Description: `Service account for Dhan trading bot n8n integration`
   - Click "Create and Continue"

### 1.4 Generate Service Account Key

1. **Create Key**:
   - In the service accounts list, click on your newly created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Click "Create"
   - **IMPORTANT**: Download and save the JSON file securely

### 1.5 Note Service Account Email

From the downloaded JSON file, note the `client_email` field:
```json
{
  "client_email": "dhan-trading-bot-service@your-project.iam.gserviceaccount.com"
}
```

## 📈 Step 2: Create Google Sheets

### 2.1 Create Main Trading Sheet

1. **Go to Google Sheets**: https://sheets.google.com/
2. **Create New Sheet**:
   - Click "Blank" to create a new spreadsheet
   - Name it: `Dhan Trading Bot Data`
3. **Get Sheet ID**:
   - From the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the `SHEET_ID` part - gid=0#gid=0 (1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU) (4146f1fbf6c4f3ae27de4688a0b1ac3e07da7e98)api key

### 2.2 Create Required Tabs

Create these tabs in your Google Sheet:

#### Tab 1: "Dhan_Signals"
1. **Create Tab**: Right-click on "Sheet1" > "Rename" > "Dhan_Signals"
2. **Add Headers** (Row 1):
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
M1: Market Strength
N1: Put Call Premium Ratio
O1: Writers Confidence
P1: ATM Strike
```

#### Tab 2: "Dhan_Active_Trades"
1. **Create Tab**: Click "+" > Rename to "Dhan_Active_Trades"
2. **Add Headers** (Row 1):
```
A1: Entry Order ID
B1: SL Order ID
C1: Target Order ID
D1: Trading Symbol
E1: Security ID
F1: Entry Price
G1: Stop Loss
H1: Target
I1: Quantity
J1: Risk Reward Ratio
K1: Max Loss
L1: Max Profit
M1: Status
N1: Timestamp
O1: Exit Type
P1: Exit Price
Q1: PnL
R1: Actual Risk Reward
S1: Exit Timestamp
T1: Execution Time
```

#### Tab 3: "Dhan_Trade_Summary"
1. **Create Tab**: Click "+" > Rename to "Dhan_Trade_Summary"
2. **Add Headers** (Row 1):
```
A1: Entry Order ID
B1: Timestamp
C1: Signal
D1: Confidence
E1: Trading Symbol
F1: Entry Price
G1: Stop Loss
H1: Target
I1: Quantity
J1: Risk Reward Ratio
K1: Max Loss
L1: Max Profit
M1: Writers Zone
N1: Market Strength
O1: VIX
P1: Status
Q1: Exit Price
R1: PnL
S1: Exit Type
T1: Actual Risk Reward
U1: Exit Timestamp
```

#### Tab 4: "Dhan_Performance_Log"
1. **Create Tab**: Click "+" > Rename to "Dhan_Performance_Log"
2. **Add Headers** (Row 1):
```
A1: Date
B1: Session Executions
C1: Session PnL
D1: Target Hits
E1: Stop Loss Hits
F1: Average PnL
G1: Win Rate
H1: Profit Factor
I1: Max Drawdown
J1: Last Update
```

#### Tab 5: "Dhan_Alert_Log"
1. **Create Tab**: Click "+" > Rename to "Dhan_Alert_Log"
2. **Add Headers** (Row 1):
```
A1: Timestamp
B1: Alert Type
C1: Severity
D1: Message
E1: PnL
F1: Trading Symbol
G1: Action Taken
H1: Resolution Status
```

### 2.3 Share Sheet with Service Account

1. **Share the Sheet**:
   - Click "Share" button (top right)
   - In "Add people and groups", paste your service account email
   - Set permission to "Editor"
   - Uncheck "Notify people"
   - Click "Share"

### 2.4 Format Sheets for Better Readability

#### Format Headers:
1. Select Row 1 in each sheet
2. **Bold**: Ctrl+B
3. **Background Color**: Light blue
4. **Text Color**: Dark blue
5. **Freeze Row**: View > Freeze > 1 row

#### Format Data Columns:
1. **Timestamp Columns**: Format > Number > Date time
2. **Price Columns**: Format > Number > Currency (₹)
3. **Percentage Columns**: Format > Number > Percent
4. **Number Columns**: Format > Number > Number (2 decimal places)

## 🔧 Step 3: n8n Google Sheets Credential Setup

### 3.1 Add Credential in n8n

1. **Open n8n Interface**: http://localhost:5678
2. **Go to Credentials**:
   - Click "Settings" (gear icon)
   - Click "Credentials"
3. **Add New Credential**:
   - Click "Add Credential"
   - Search for "Google Sheets API"
   - Select "Google Sheets API"

### 3.2 Configure Service Account

1. **Authentication Method**: Service Account
2. **Service Account Email**: From your JSON file (`client_email`)
3. **Private Key**: From your JSON file (`private_key`)
   - **IMPORTANT**: Include the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### 3.3 Test Connection

1. **Test Credential**:
   - Click "Test" button
   - Should show "Connection successful"
2. **Save Credential**:
   - Give it a name: `Dhan Trading Bot Sheets`
   - Click "Save"

## 📊 Step 4: Sheet Validation and Testing

### 4.1 Create Test Data

Add sample data to test the integration:

#### In "Dhan_Signals" sheet:
```
Row 2:
2024-01-15T10:30:00Z | BUY_CE | 0.85 | 45.2 | 1.2 | 2.1 | 1.3 | 16.5 | BULLISH | BULLISH | HAMMER | 45250 | 2.5 | 0.95 | 0.8 | 45200
```

#### In "Dhan_Active_Trades" sheet:
```
Row 2:
TEST001 | SL001 | TGT001 | BANKNIFTY24JUL45200CE | 218057 | 150 | 135 | 180 | 25 | 1.67 | 375 | 750 | ACTIVE | 2024-01-15T10:30:00Z
```

### 4.2 Test n8n Integration

1. **Create Test Workflow**:
   - Add Google Sheets node
   - Configure to read from "Dhan_Signals"
   - Execute and verify data is retrieved

2. **Test Write Operation**:
   - Add Google Sheets node
   - Configure to append to "Dhan_Alert_Log"
   - Add test alert data
   - Execute and verify data is written

### 4.3 Validate Data Types

Ensure these data type validations:

#### Numeric Fields:
- **Prices**: Should be numbers with 2 decimal places
- **Quantities**: Should be whole numbers
- **Percentages**: Should be decimals (0.85 for 85%)

#### Date Fields:
- **Timestamps**: ISO format (2024-01-15T10:30:00Z)
- **Dates**: YYYY-MM-DD format

#### Text Fields:
- **Signals**: BUY_CE, BUY_PE, HOLD
- **Status**: ACTIVE, COMPLETED, CANCELLED
- **Severity**: LOW, MEDIUM, HIGH, CRITICAL

## 🔒 Step 5: Security and Permissions

### 5.1 Service Account Security

1. **Principle of Least Privilege**:
   - Service account only has access to Google Sheets
   - No other Google services enabled

2. **Key Management**:
   - Store JSON key securely
   - Never commit to version control
   - Rotate keys quarterly

### 5.2 Sheet Access Control

1. **Limited Sharing**:
   - Only share with necessary team members
   - Use "Viewer" permission for read-only access
   - Use "Editor" only for service accounts

2. **Data Protection**:
   - Enable version history
   - Set up regular backups
   - Monitor access logs

### 5.3 Environment Variables

Set these in your n8n environment:
```bash
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key_here"
```

## 📈 Step 6: Advanced Sheet Features

### 6.1 Data Validation

Add data validation to prevent errors:

#### For "Signal" column in Dhan_Signals:
1. Select column B (Signal)
2. Data > Data validation
3. Criteria: List of items
4. Items: `BUY_CE,BUY_PE,HOLD`

#### For "Status" column in Dhan_Active_Trades:
1. Select column M (Status)
2. Data > Data validation
3. Criteria: List of items
4. Items: `ACTIVE,COMPLETED,CANCELLED`

### 6.2 Conditional Formatting

#### Highlight Profitable Trades:
1. Select PnL column in Dhan_Trade_Summary
2. Format > Conditional formatting
3. Format cells if: Greater than 0
4. Background color: Light green

#### Highlight Losing Trades:
1. Select PnL column in Dhan_Trade_Summary
2. Format > Conditional formatting
3. Format cells if: Less than 0
4. Background color: Light red

### 6.3 Summary Formulas

Add these formulas for quick insights:

#### In Dhan_Performance_Log sheet:
```
Cell K1: Total Trades
Cell K2: =COUNTA(Dhan_Trade_Summary!A:A)-1

Cell L1: Win Rate
Cell L2: =COUNTIFS(Dhan_Trade_Summary!R:R,">0")/COUNTA(Dhan_Trade_Summary!A:A)-1

Cell M1: Total PnL
Cell M2: =SUM(Dhan_Trade_Summary!R:R)

Cell N1: Avg PnL
Cell N2: =AVERAGE(Dhan_Trade_Summary!R:R)
```

## 🔄 Step 7: Backup and Recovery

### 7.1 Automated Backup

1. **Google Sheets Built-in Backup**:
   - Version history automatically maintained
   - Access via File > Version history

2. **Export Backup**:
   - File > Download > Excel (.xlsx)
   - Schedule weekly downloads

### 7.2 Data Recovery Procedures

1. **Version Recovery**:
   - File > Version history > See version history
   - Select previous version
   - Click "Restore this version"

2. **Sheet Recovery**:
   - If sheet is accidentally deleted
   - Use Google Drive trash to recover
   - Restore sharing permissions

### 7.3 Disaster Recovery Plan

1. **Complete Sheet Loss**:
   - Recreate from backup
   - Reconfigure service account access
   - Update n8n sheet ID

2. **Service Account Compromise**:
   - Create new service account
   - Update n8n credentials
   - Revoke old service account access

## 📊 Step 8: Monitoring and Maintenance

### 8.1 Regular Monitoring

**Daily Checks**:
- [ ] Verify data is being written correctly
- [ ] Check for any error messages
- [ ] Validate timestamp formats
- [ ] Confirm calculations are accurate

**Weekly Checks**:
- [ ] Review sheet performance
- [ ] Check storage usage
- [ ] Validate data integrity
- [ ] Update formulas if needed

### 8.2 Performance Optimization

1. **Sheet Size Management**:
   - Archive old data monthly
   - Keep active data under 10,000 rows
   - Use separate sheets for historical data

2. **Formula Optimization**:
   - Use array formulas where possible
   - Avoid volatile functions (NOW(), RAND())
   - Optimize conditional formatting ranges

### 8.3 Troubleshooting Common Issues

#### Issue: "Permission denied" errors
**Solution**:
- Verify service account has Editor access
- Check if sheet was moved or renamed
- Confirm service account email is correct

#### Issue: Data not updating
**Solution**:
- Check n8n workflow execution logs
- Verify Google Sheets credential is valid
- Test connection in n8n credentials

#### Issue: Slow performance
**Solution**:
- Reduce number of conditional formatting rules
- Optimize formulas and ranges
- Archive old data to separate sheets

This comprehensive Google Sheets setup guide ensures reliable data storage and retrieval for your Dhan trading bot with proper security, validation, and monitoring in place.