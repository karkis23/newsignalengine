# Angel One SmartAPI Setup Guide

## Step 1: Create Angel One Account

1. **Open Demat Account**
   - Visit [angelone.in](https://angelone.in)
   - Open a trading and demat account
   - Complete KYC verification

2. **Enable API Access**
   - Log in to your Angel One account
   - Go to "My Profile" → "API"
   - Apply for API access
   - Wait for approval (1-2 business days)

## Step 2: Get API Credentials

1. **Access Developer Console**
   - Visit [smartapi.angelone.in](https://smartapi.angelone.in)
   - Log in with your Angel One credentials
   - Go to "My API" section

2. **Generate API Key**
   - Click "Create New API"
   - Fill in application details:
     - **App Name**: Trading Bot
     - **Description**: Automated trading system
     - **Redirect URL**: `http://localhost:3000` (for testing)
   - Submit the form
   - Note down your **API Key**

## Step 3: Setup TOTP Authentication

1. **Install Authenticator App**
   - Google Authenticator (Android/iOS)
   - Authy (recommended for backup)
   - Microsoft Authenticator

2. **Enable TOTP in Angel One**
   - Go to "Security" → "Two-Factor Authentication"
   - Scan QR code with your authenticator app
   - Enter the 6-digit code to verify
   - Save backup codes securely

## Step 4: Get Required Information

Collect these details for your n8n workflow:

```bash
# Angel One API Credentials
ANGEL_API_KEY=your_api_key_here
ANGEL_CLIENT_ID=your_client_id_here
ANGEL_PASSWORD=your_password_here
ANGEL_TOTP=your_current_totp_code
```

## Step 5: Test API Connection

Use this curl command to test your API:

```bash
curl -X POST https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-UserType: USER" \
  -H "X-SourceID: WEB" \
  -H "X-ClientLocalIP: 192.168.1.1" \
  -H "X-ClientPublicIP: 106.193.147.98" \
  -H "X-MACAddress: fe80::216:3eff:fe4e:9729" \
  -H "X-PrivateKey: YOUR_API_KEY" \
  -d '{
    "clientcode": "YOUR_CLIENT_ID",
    "password": "YOUR_PASSWORD",
    "totp": "CURRENT_TOTP_CODE"
  }'
```

## Step 6: Setup Environment Variables

In your n8n installation, set these environment variables:

```bash
# Angel One API
export ANGEL_API_KEY="your_api_key"
export ANGEL_CLIENT_ID="your_client_id"
export ANGEL_PASSWORD="your_password"
export ANGEL_TOTP="123456"  # This will be dynamic
```

## Step 7: TOTP Handling in n8n

Since TOTP codes change every 30 seconds, you have two options:

### Option 1: Manual TOTP Update (Recommended for testing)
- Update the TOTP code manually every 30 seconds
- Use this for initial testing and development

### Option 2: Automated TOTP Generation (Advanced)
- Use a TOTP library to generate codes programmatically
- Requires storing the TOTP secret securely
- More complex but fully automated

## Step 8: Important Security Notes

1. **Never share your API credentials**
2. **Use strong, unique passwords**
3. **Enable email/SMS alerts for trades**
4. **Regularly monitor your account**
5. **Keep backup codes safe**
6. **Use IP whitelisting if available**

## Step 9: Rate Limits

Angel One API has rate limits:
- **Orders**: 200 per minute
- **Market Data**: 250 per minute
- **Other APIs**: 100 per minute

Plan your workflow accordingly.

## Step 10: Paper Trading (Testing)

Before live trading:
1. Use demo/paper trading mode
2. Test all order types
3. Verify data accuracy
4. Check error handling

## Common Issues and Solutions

### Issue: Invalid TOTP
- **Solution**: Ensure system time is synchronized
- Use `ntpdate` on Linux/Mac or Windows time sync

### Issue: API Key Invalid
- **Solution**: Regenerate API key from developer console
- Check for typos in credentials

### Issue: IP Blocked
- **Solution**: Contact Angel One support
- Check IP whitelisting settings

### Issue: Order Rejected
- **Solution**: Check available funds
- Verify symbol format and expiry dates

## Support

For API-related issues:
- **Email**: smartapisupport@angelbroking.com
- **Phone**: +91-80-49294444
- **Documentation**: [smartapi.angelone.in/docs](https://smartapi.angelone.in/docs)

Your Angel One SmartAPI setup is complete and ready for integration with n8n!