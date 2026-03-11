# Google Sheets API Setup Guide

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - **Project Name**: `Trading Bot Logs`
   - **Location**: Keep default
   - Click "Create"

## Step 2: Enable Google Sheets API

1. **Enable API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

2. **Enable Google Drive API**
   - Also enable "Google Drive API"
   - This is required for sheet access

## Step 3: Create Service Account

1. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - **Service Account Name**: `trading-bot-logger`
   - **Description**: `Service account for logging trades`
   - Click "Create and Continue"

2. **Skip Role Assignment**
   - Click "Continue" (we'll set permissions on the sheet directly)
   - Click "Done"

## Step 4: Generate Service Account Key

1. **Download Key File**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Choose "JSON" format
   - Download the key file
   - **Keep this file secure!**

## Step 5: Create Google Sheets

1. **Create Main Logging Sheet**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Create a new spreadsheet
   - **Name**: `Trading Bot Logs`

2. **Create Sheets Structure**

   **Sheet 1: "Signals"**
   ```
   A1: Timestamp
   B1: Signal
   C1: Confidence
   D1: RSI
   E1: MACD
   F1: VIX
   G1: Sentiment
   H1: Writers Zone
   ```

   **Sheet 2: "Trades"**
   ```
   A1: Order ID
   B1: Timestamp
   C1: Symbol
   D1: Entry Price
   E1: Stop Loss
   F1: Target
   G1: Quantity
   H1: Status
   I1: Exit Price
   J1: PnL
   ```

   **Sheet 3: "Active_Exit_Orders"**
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

## Step 6: Share Sheet with Service Account

1. **Get Service Account Email**
   - Open your downloaded JSON key file
   - Copy the `client_email` value
   - It looks like: `trading-bot-logger@your-project.iam.gserviceaccount.com`

2. **Share the Sheet**
   - In your Google Sheet, click "Share"
   - Paste the service account email
   - Set permission to "Editor"
   - Uncheck "Notify people"
   - Click "Share"

## Step 7: Get Sheet ID

1. **Extract Sheet ID**
   - Look at your sheet URL
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the SHEET_ID part
   - Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## Step 8: Setup n8n Google Sheets Credentials

1. **In n8n Settings**
   - Go to "Settings" → "Credentials"
   - Click "Add Credential"
   - Choose "Google Sheets API"

2. **Configure Credentials**
   - **Authentication**: Service Account
   - **Service Account Email**: From your JSON file
   - **Private Key**: Copy from JSON file (include BEGIN/END lines)
   - **Test** the connection

## Step 9: Configure Environment Variables

Set these in your n8n environment:

```bash
# Google Sheets Configuration
export GOOGLE_SHEET_ID="your_sheet_id_here"
export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
```

## Step 10: Test Sheet Integration

Create a test n8n workflow:

1. **Add Google Sheets Node**
   - Operation: "Append or Update"
   - Document ID: Your sheet ID
   - Sheet Name: "Signals"
   - Data Mode: "Define Below"

2. **Test Data**
   ```json
   {
     "Timestamp": "2024-01-15T10:30:00Z",
     "Signal": "BUY_CE",
     "Confidence": 0.85,
     "RSI": 45.2,
     "MACD": 1.2,
     "VIX": 16.8,
     "Sentiment": "BULLISH",
     "Writers Zone": "NEUTRAL"
   }
   ```

## Step 11: Advanced Sheet Features

### Conditional Formatting
Add visual indicators:
- Green: Profitable trades
- Red: Loss trades  
- Yellow: Pending trades

### Data Validation
- Signal column: Dropdown with BUY_CE, BUY_PE, HOLD
- Status column: Dropdown with ACTIVE, CLOSED, CANCELLED

### Charts and Analytics
- P&L chart over time
- Win rate percentage
- Average trade duration

## Step 12: Backup and Security

1. **Regular Backups**
   - Export sheet data weekly
   - Keep local copies

2. **Security Best Practices**
   - Rotate service account keys monthly
   - Monitor sheet access logs
   - Use specific folder permissions

## Common Issues and Solutions

### Issue: Permission Denied
- **Solution**: Check service account email is added to sheet
- Verify role is "Editor" not "Viewer"

### Issue: Authentication Error
- **Solution**: Regenerate service account key
- Check private key format (include BEGIN/END lines)

### Issue: Sheet Not Found
- **Solution**: Verify sheet ID is correct
- Check sheet sharing settings

### Issue: Rate Limit Exceeded
- **Solution**: Add delays between requests
- Batch multiple operations

## Sheet Templates

Download ready-to-use templates:
- **Signals Log**: Track all AI predictions
- **Trades Log**: Record all executed trades
- **Performance Dashboard**: Analytics and charts

## Monitoring and Alerts

Set up Google Sheets notifications:
- Email alerts for new trades
- Daily summary reports
- Performance threshold alerts

Your Google Sheets logging system is now ready to capture all trading bot activities!