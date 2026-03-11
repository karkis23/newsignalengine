# 🔐 Dhan API Credentials Setup Guide

## 📋 Overview

This guide provides step-by-step instructions for setting up Dhan API credentials and configuring them properly for your n8n trading bot workflows.

## 🏦 Step 1: Dhan Account Setup

### 1.1 Create Dhan Trading Account

1. **Visit Dhan Website**: https://dhan.co/
2. **Sign Up Process**:
   - Click "Open Account"
   - Fill in personal details
   - Complete KYC verification
   - Submit required documents
   - Wait for account approval (1-3 business days)

### 1.2 Account Activation

1. **Fund Your Account**:
   - Minimum funding: ₹10,000 (recommended: ₹50,000+)
   - Use NEFT/RTGS/UPI for funding
   - Verify funds are credited

2. **Enable Trading Segments**:
   - Equity: ✅ Enabled
   - F&O: ✅ Enabled (Required for options trading)
   - Currency: Optional
   - Commodity: Optional

### 1.3 Verify Account Status

1. **Login to Dhan Web Platform**: https://web.dhan.co/
2. **Check Account Status**:
   - Account should show "Active"
   - Trading segments should be enabled
   - Funds should be available

## 🔑 Step 2: Generate API Credentials

### 2.1 Access API Settings

1. **Login to Dhan Web Platform**
2. **Navigate to Settings**:
   - Click on your profile icon (top right)
   - Select "Settings" from dropdown
   - Look for "API" or "Developer" section

### 2.2 Enable API Access

1. **API Access Request**:
   - Look for "API Access" or "Developer API" section
   - Click "Enable API Access"
   - Accept terms and conditions
   - Submit request if required

2. **Wait for Approval**:
   - API access may require approval
   - Check email for confirmation
   - Contact Dhan support if delayed

### 2.3 Generate API Credentials

Once API access is enabled:

1. **Generate Client ID**:
   - In API settings, click "Generate Client ID"
   - Note down the Client ID (this is your username)

2. **Set API Password**:
   - Create a strong password for API access
   - This may be different from your login password
   - Store securely

3. **Setup 2FA for API**:
   - Enable 2FA if not already enabled
   - Use Google Authenticator or similar app
   - Note the 2FA secret key

### 2.4 Test API Access

Test your credentials using this curl command:

```bash
curl -X POST https://api.dhan.co/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_client_id",
    "password": "your_api_password",
    "twoFA": "current_2fa_code",
    "appName": "WEB"
  }'
```

**Expected Response**:
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

## 🔧 Step 3: n8n Environment Configuration

### 3.1 Set Environment Variables

In your n8n installation directory, create or update the `.env` file:

```bash
# Navigate to n8n directory
cd ~/.n8n

# Create or edit .env file
nano .env
```

Add these variables:

```bash
# Dhan API Credentials
DHAN_CLIENT_ID=your_dhan_client_id
DHAN_PASSWORD=your_dhan_api_password
DHAN_2FA=your_current_2fa_code

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

### 3.2 Secure Environment Variables

1. **Set Proper Permissions**:
```bash
chmod 600 ~/.n8n/.env
```

2. **Verify Variables are Loaded**:
```bash
# Start n8n and check if variables are accessible
n8n start
```

### 3.3 Alternative: n8n Environment Variables UI

If your n8n instance supports it:

1. **Access n8n Settings**:
   - Open n8n interface
   - Go to Settings > Environment Variables

2. **Add Variables**:
   - Click "Add Variable"
   - Name: `DHAN_CLIENT_ID`
   - Value: Your client ID
   - Repeat for all variables

## 🔐 Step 4: Security Best Practices

### 4.1 Credential Security

1. **Strong Passwords**:
   - Use complex passwords (12+ characters)
   - Include uppercase, lowercase, numbers, symbols
   - Avoid dictionary words

2. **2FA Security**:
   - Use hardware tokens if available
   - Keep backup codes secure
   - Don't share 2FA secrets

3. **Access Control**:
   - Limit API access to specific IPs if possible
   - Monitor API usage regularly
   - Set up alerts for unusual activity

### 4.2 Environment Security

1. **File Permissions**:
```bash
# Secure .env file
chmod 600 ~/.n8n/.env
chown $USER:$USER ~/.n8n/.env
```

2. **Backup Security**:
```bash
# Create encrypted backup of credentials
gpg -c ~/.n8n/.env
# Store the .env.gpg file securely
```

3. **Network Security**:
   - Use HTTPS for all API calls
   - Consider VPN for additional security
   - Monitor network traffic

### 4.3 Credential Rotation

**Monthly Rotation Schedule**:
1. **Week 1**: Generate new API password
2. **Week 2**: Update n8n environment variables
3. **Week 3**: Test all workflows
4. **Week 4**: Revoke old credentials

## 🔄 Step 5: 2FA Management for Automation

### 5.1 Understanding 2FA for APIs

Dhan API requires 2FA codes, but these change every 30 seconds. For automation:

1. **Option 1: TOTP Secret**:
   - Use the TOTP secret to generate codes programmatically
   - Implement in n8n using a Code node

2. **Option 2: Longer Session Tokens**:
   - Some brokers provide longer-lived tokens
   - Check Dhan documentation for session management

### 5.2 Implementing TOTP in n8n

Create a Code node to generate 2FA codes:

```javascript
// TOTP Code Generation
const crypto = require('crypto');

function generateTOTP(secret, window = 0) {
  const epoch = Math.round(new Date().getTime() / 1000.0);
  const time = Math.floor(epoch / 30) + window;
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'));
  
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

// Use your TOTP secret
const totpSecret = process.env.DHAN_TOTP_SECRET;
const currentCode = generateTOTP(totpSecret);

return { totp: currentCode };
```

### 5.3 Session Management

Implement session management to reduce login frequency:

```javascript
// Session Management Code Node
const sessionData = $node['Dhan Authentication'].json;

// Check if token is still valid (assuming 1 hour expiry)
const tokenAge = Date.now() - sessionData.timestamp;
const maxAge = 50 * 60 * 1000; // 50 minutes

if (tokenAge < maxAge && sessionData.access_token) {
  // Use existing token
  return {
    access_token: sessionData.access_token,
    reused: true
  };
} else {
  // Need new authentication
  return {
    need_auth: true
  };
}
```

## 📊 Step 6: API Usage Monitoring

### 6.1 Rate Limit Management

Dhan API has rate limits. Monitor usage:

```javascript
// Rate Limit Tracker Code Node
const rateLimitData = {
  calls: 0,
  resetTime: Date.now() + 60000, // 1 minute window
  maxCalls: 100 // Adjust based on Dhan limits
};

// Check if we're within limits
if (Date.now() > rateLimitData.resetTime) {
  rateLimitData.calls = 0;
  rateLimitData.resetTime = Date.now() + 60000;
}

if (rateLimitData.calls >= rateLimitData.maxCalls) {
  const waitTime = rateLimitData.resetTime - Date.now();
  throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
}

rateLimitData.calls++;
return rateLimitData;
```

### 6.2 API Health Monitoring

Monitor API response times and success rates:

```javascript
// API Health Monitor
const healthMetrics = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  avgResponseTime: 0,
  lastError: null,
  timestamp: new Date().toISOString()
};

// Update metrics after each API call
function updateMetrics(success, responseTime, error = null) {
  healthMetrics.totalCalls++;
  
  if (success) {
    healthMetrics.successfulCalls++;
  } else {
    healthMetrics.failedCalls++;
    healthMetrics.lastError = error;
  }
  
  // Calculate average response time
  healthMetrics.avgResponseTime = 
    (healthMetrics.avgResponseTime * (healthMetrics.totalCalls - 1) + responseTime) / 
    healthMetrics.totalCalls;
  
  return healthMetrics;
}
```

## 🚨 Step 7: Troubleshooting Common Issues

### 7.1 Authentication Failures

**Issue**: Login fails with "Invalid credentials"
**Solutions**:
1. Verify client ID and password are correct
2. Check if 2FA code is current (within 30-second window)
3. Ensure API access is enabled in Dhan account
4. Try logging in manually to web platform first

**Issue**: "Account locked" error
**Solutions**:
1. Wait 15 minutes before retrying
2. Contact Dhan support
3. Check for multiple failed login attempts

### 7.2 API Access Issues

**Issue**: "API access denied"
**Solutions**:
1. Verify API access is enabled in account settings
2. Check if account is fully activated
3. Ensure all KYC requirements are completed
4. Contact Dhan support for API activation

**Issue**: Rate limit exceeded
**Solutions**:
1. Implement proper rate limiting in workflows
2. Add delays between API calls
3. Use batch requests where possible
4. Monitor API usage patterns

### 7.3 Network Issues

**Issue**: Connection timeouts
**Solutions**:
1. Check internet connectivity
2. Increase timeout values in HTTP nodes
3. Implement retry logic
4. Use different network if possible

**Issue**: SSL/TLS errors
**Solutions**:
1. Update n8n to latest version
2. Check system SSL certificates
3. Use alternative DNS servers
4. Contact hosting provider

## 🔄 Step 8: Credential Maintenance

### 8.1 Regular Maintenance Tasks

**Daily**:
- [ ] Monitor API success rates
- [ ] Check for authentication errors
- [ ] Verify 2FA is working

**Weekly**:
- [ ] Review API usage statistics
- [ ] Check for any security alerts
- [ ] Validate credential functionality

**Monthly**:
- [ ] Rotate API passwords
- [ ] Update 2FA backup codes
- [ ] Review access logs
- [ ] Test disaster recovery procedures

### 8.2 Emergency Procedures

**If Credentials are Compromised**:
1. **Immediate Actions**:
   - Change Dhan account password
   - Disable API access temporarily
   - Generate new API credentials
   - Update n8n environment variables

2. **Recovery Steps**:
   - Test new credentials
   - Update all workflows
   - Monitor for unusual activity
   - Document incident

**If Account is Locked**:
1. **Contact Dhan Support**:
   - Call customer service immediately
   - Provide account details
   - Explain API usage requirements

2. **Temporary Measures**:
   - Stop all automated workflows
   - Switch to manual trading if needed
   - Monitor positions manually

This comprehensive credential setup guide ensures secure and reliable API access for your Dhan trading bot with proper security measures and maintenance procedures.