# 🤖 AI Model Comprehensive Guide - NIFTY Trading Bot

## 📋 Overview

This comprehensive guide covers the complete AI model implementation for the NIFTY trading bot, including technical indicator analysis, Writers Zone integration, deployment instructions, and usage examples.

## 🎯 AI Model Architecture

### Core Components

#### 1. **Technical Indicator Analysis Engine**
Processes 15+ technical indicators with professional-grade logic:

```python
class ProfessionalTradingAI:
    def __init__(self):
        self.pattern_weights = {
            # Trend Indicators
            'rsi_oversold': 0.8,
            'supertrend_bullish': 0.9,
            'ema_bullish': 0.7,
            
            # Momentum Indicators
            'macd_bullish': 0.8,
            'cci_sell': 0.8,
            'mfi_oversold': 0.8,
            
            # Volume Indicators
            'volume_strong': 0.6,
            'aroon_uptrend': 0.7,
            
            # Writers Zone
            'writers_bullish': 0.9,
            'premium_ratio_balanced': 0.1
        }
```

#### 2. **Writers Zone Analysis Engine**
Analyzes option flow and premium distribution:

```python
def analyze_writers_zone(self, writers_data):
    # Zone Direction Analysis
    writers_zone = writers_data.get('writersZone', 'NEUTRAL')
    writers_confidence = float(writers_data.get('confidence', 0))
    
    # Premium Ratio Analysis
    put_call_ratio = float(writers_data.get('putCallPremiumRatio', 1))
    
    # Market Structure Analysis
    market_structure = writers_data.get('marketStructure', 'BALANCED')
```

#### 3. **Multi-Factor Decision Engine**
Combines all analysis for final signal generation:

```python
def make_professional_decision(self, signals, strength, technical_data, writers_data):
    # VIX Filter
    if vix_value > 18:
        return 'HOLD', 0.0
    
    # Signal Counting
    bullish_count = len(bullish_signals)
    bearish_count = len(bearish_signals)
    
    # Professional Logic
    if strength > 2.0 and bullish_count >= 4:
        return 'BUY_CE', confidence
    elif strength < -2.0 and bearish_count >= 4:
        return 'BUY_PE', confidence
```

## 🔧 Supported Technical Indicators

### **Trend Indicators**
- **RSI**: Relative Strength Index with Neutral/Oversold/Overbought analysis
- **EMA20**: 20-period Exponential Moving Average with Bullish/Bearish status
- **SMA50**: 50-period Simple Moving Average with trend direction
- **SuperTrend**: Primary trend direction indicator
- **Aroon**: Uptrend/Downtrend identification
- **Parabolic SAR**: Trend reversal signals

### **Momentum Indicators**
- **MACD**: Moving Average Convergence Divergence with histogram analysis
- **CCI**: Commodity Channel Index with Buy/Sell signals
- **Stochastic**: Overbought/Oversold oscillator
- **MFI**: Money Flow Index for volume-weighted momentum
- **ADX**: Average Directional Index for trend strength

### **Volatility Indicators**
- **VIX**: Market volatility with Calm/Normal/High classification
- **ATR**: Average True Range for volatility measurement
- **Bollinger Bands**: Price position relative to volatility bands

### **Volume Indicators**
- **Volume Indicators**: Overall volume strength analysis
- **Volume Spike**: Unusual volume detection
- **Volume Strength**: Volume quality assessment

### **Price Action Indicators**
- **Price Action**: Ranging vs Trending market detection
- **VWAP**: Volume Weighted Average Price analysis
- **Candle Patterns**: Pattern recognition for reversal/continuation signals

## 📊 Writers Zone Analysis

### **Zone Direction Assessment**
```python
# Writers Zone Classification
writers_zone_types = {
    'BULLISH': 'Call writers under pressure, bullish bias',
    'BEARISH': 'Put writers under pressure, bearish bias', 
    'NEUTRAL': 'Balanced option flow, no clear bias'
}
```

### **Premium Ratio Analysis**
```python
# Put-Call Premium Ratio Interpretation
premium_ratio_analysis = {
    '> 1.2': 'PUT_HEAVY - Bearish sentiment',
    '< 0.8': 'CALL_HEAVY - Bullish sentiment',
    '0.8-1.2': 'BALANCED - Neutral sentiment'
}
```

### **Market Structure Analysis**
```python
# Market Structure Types
market_structures = {
    'CALL_PREMIUM_HIGH': 'High call premiums indicate bullish positioning',
    'PUT_PREMIUM_HIGH': 'High put premiums indicate bearish positioning',
    'BALANCED': 'Balanced premium distribution'
}
```

## 🚀 Deployment Guide

### **1. Render.com Deployment**

#### **Step 1: Repository Setup**
```bash
# Ensure your repository has this structure:
your-repo/
├── backend/
│   ├── ai_model_api_fixed.py
│   ├── requirements_fixed.txt
│   ├── runtime.txt
│   ├── render.yaml
│   └── Procfile
└── other-files...
```

#### **Step 2: Render.com Configuration**
1. **Go to Render.com Dashboard**
2. **Click "New" → "Web Service"**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - **Build Command**: `pip install -r backend/requirements_fixed.txt`
   - **Start Command**: `cd backend && gunicorn ai_model_api_fixed:app --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     - `PYTHON_VERSION=3.11.9`
     - `PORT=10000`

#### **Step 3: Deploy**
- **Click "Create Web Service"**
- **Wait for deployment to complete**
- **Note the service URL**: `https://your-service-name.onrender.com`

### **2. Alternative Deployment Options**

#### **Heroku**
```bash
# Procfile
web: cd backend && gunicorn ai_model_api_fixed:app
```

#### **Railway**
```bash
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd backend && gunicorn ai_model_api_fixed:app"
```

#### **Local Development**
```bash
cd backend
pip install -r requirements_fixed.txt
python ai_model_api_fixed.py
```

## 📡 API Endpoints

### **1. Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "model_loaded": true,
  "total_signals": 0,
  "accuracy": 0.0,
  "pattern_weights": {...}
}
```

### **2. Signal Prediction**
```http
POST /predict
Content-Type: application/json

[{
  "LTP": 24631.3,
  "RSI": {"rsi": "44.08", "status": "Neutral"},
  "EMA20": {"ema": "24634.21", "status": "Bearish"},
  "SMA50": {"sma": "24637.80", "status": "Bearish"},
  "MACD": {"macd": "-2.72", "signal": "-2.72", "histogram": "0.00", "status": "Neutral"},
  "VIX": {"vix": "12.36", "status": "Calm Market"},
  "BollingerBands": {"upper": "24654.82", "lower": "24615.06", "status": "Within Bands"},
  "CCI": {"value": "-130.28", "status": "Sell"},
  "SuperTrend": {"status": "Bullish"},
  "VolumeIndicators": {"obv": 0, "status": "Weak"},
  "Aroon": {"up": "50.00", "down": "21.43", "status": "Uptrend"},
  "ParabolicSAR": {"value": "24663.30", "status": "Bearish"},
  "MFI": {"value": "0.00", "status": "Oversold"},
  "PriceAction": {"score": 0, "type": "Ranging"},
  "VolumeSpike": {"spike": false, "latestVol": 0, "avgVol": "0.00"},
  "VolumeStrength": {"score": -1, "type": "Weak Volume"},
  
  "writersZone": "NEUTRAL",
  "confidence": 0,
  "maxCELTP": 0,
  "maxPELTP": 0,
  "putCallPremiumRatio": 1,
  "marketStructure": "BALANCED",
  "supportLevels": [],
  "resistanceLevels": []
}]
```

**Response:**
```json
{
  "signal": "BUY_CE",
  "confidence": 0.85,
  "analysis": {
    "detected_signals": [
      "RSI_NEUTRAL",
      "VIX_CALM",
      "SUPERTREND_BULLISH",
      "CCI_SELL",
      "MFI_OVERSOLD",
      "AROON_UPTREND",
      "WRITERS_NEUTRAL",
      "PREMIUM_RATIO_BALANCED"
    ],
    "total_strength": 2.3,
    "vix_condition": "LOW_VOLATILITY",
    "market_regime": "BULLISH_TREND",
    "ltp": 24631.3,
    "signal_count": 8,
    "writers_zone": "NEUTRAL",
    "writers_confidence": 0
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **3. Update Model Accuracy**
```http
POST /update_accuracy
Content-Type: application/json

{
  "predicted_signal": "BUY_CE",
  "actual_outcome": "correct"
}
```

### **4. Get Model Statistics**
```http
GET /get_stats
```

**Response:**
```json
{
  "total_predictions": 150,
  "correct_predictions": 95,
  "accuracy": 0.633,
  "recent_signals": [...],
  "pattern_weights": {...}
}
```

## 🔗 n8n Integration

### **Update n8n AI Node Configuration**

#### **Method**: POST
#### **URL**: `https://your-app-name.onrender.com/predict`
#### **Headers**:
```json
{
  "Content-Type": "application/json"
}
```

#### **Body Configuration**:
```json
[{
  "LTP": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.LTP}}",
  "RSI": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.RSI}}",
  "EMA20": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.EMA20}}",
  "SMA50": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.SMA50}}",
  "MACD": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.MACD}}",
  "VIX": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.VIX}}",
  "BollingerBands": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.BollingerBands}}",
  "CCI": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.CCI}}",
  "SuperTrend": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.SuperTrend}}",
  "VolumeIndicators": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.VolumeIndicators}}",
  "Aroon": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.Aroon}}",
  "ParabolicSAR": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.ParabolicSAR}}",
  "MFI": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.MFI}}",
  "PriceAction": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.PriceAction}}",
  "VolumeSpike": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.VolumeSpike}}",
  "VolumeStrength": "={{$node['Calculate NIFTY Technical Indicators'].json.indicators.VolumeStrength}}",
  
  "writersZone": "={{$node['NIFTY Writers Zone Analysis'].json.writersZone}}",
  "confidence": "={{$node['NIFTY Writers Zone Analysis'].json.confidence}}",
  "maxCELTP": "={{$node['NIFTY Writers Zone Analysis'].json.maxCELTP}}",
  "maxPELTP": "={{$node['NIFTY Writers Zone Analysis'].json.maxPELTP}}",
  "putCallPremiumRatio": "={{$node['NIFTY Writers Zone Analysis'].json.putCallPremiumRatio}}",
  "marketStructure": "={{$node['NIFTY Writers Zone Analysis'].json.marketStructure}}",
  "supportLevels": "={{$node['NIFTY Writers Zone Analysis'].json.supportLevels}}",
  "resistanceLevels": "={{$node['NIFTY Writers Zone Analysis'].json.resistanceLevels}}"
}]
```

## 🎯 Signal Generation Logic

### **Decision Matrix**

#### **Strong Bullish Signals** (BUY_CE with high confidence)
- **RSI**: < 30 (Oversold)
- **SuperTrend**: Bullish
- **VIX**: < 18 (Low volatility)
- **Writers Zone**: BULLISH with confidence > 0.5
- **Volume**: Strong or Surge
- **Momentum**: CCI Oversold + MFI Oversold

#### **Strong Bearish Signals** (BUY_PE with high confidence)
- **RSI**: > 70 (Overbought)
- **SuperTrend**: Bearish
- **VIX**: < 18 (Low volatility)
- **Writers Zone**: BEARISH with confidence > 0.5
- **Volume**: Strong confirmation
- **Momentum**: Multiple overbought indicators

#### **Hold Conditions**
- **VIX**: > 18 (High volatility)
- **Conflicting Signals**: Mixed technical indicators
- **Low Confidence**: < 75% confidence threshold
- **Insufficient Strength**: Total strength < 1.5

### **Confidence Scoring**

#### **Base Confidence Calculation**
```python
base_confidence = min(abs(strength) / 4.0, 1.0)  # Normalize to 0-1
```

#### **Writers Zone Boost**
```python
writers_boost = 0.2 if writers_confidence > 0.5 else 0
```

#### **Final Confidence**
```python
final_confidence = min(base_confidence + writers_boost + alignment_bonus, 0.95)
```

## 📊 Example Analysis

### **Your Sample Data Analysis**
```json
{
  "input": {
    "LTP": 24631.3,
    "RSI": {"rsi": "44.08", "status": "Neutral"},
    "VIX": {"vix": "12.36", "status": "Calm Market"},
    "SuperTrend": {"status": "Bullish"},
    "CCI": {"value": "-130.28", "status": "Sell"},
    "MFI": {"value": "0.00", "status": "Oversold"},
    "Aroon": {"up": "50.00", "down": "21.43", "status": "Uptrend"},
    "writersZone": "NEUTRAL",
    "putCallPremiumRatio": 1
  },
  
  "analysis": {
    "detected_signals": [
      "RSI_NEUTRAL",           // RSI 44.08 (neutral zone)
      "VIX_CALM",             // VIX 12.36 (calm market)
      "SUPERTREND_BULLISH",   // Bullish SuperTrend
      "CCI_SELL",             // CCI -130.28 (sell signal)
      "MFI_OVERSOLD",         // MFI 0.00 (oversold)
      "AROON_UPTREND",        // Aroon uptrend
      "WRITERS_NEUTRAL",      // Neutral writers zone
      "PREMIUM_RATIO_BALANCED" // Put-call ratio 1.0
    ],
    "bullish_signals": 4,     // VIX_CALM, SUPERTREND_BULLISH, MFI_OVERSOLD, AROON_UPTREND
    "bearish_signals": 1,     // CCI_SELL
    "total_strength": 2.1,
    "vix_condition": "LOW_VOLATILITY"
  },
  
  "decision": {
    "signal": "BUY_CE",
    "confidence": 0.75,
    "reasoning": [
      "Low volatility environment (VIX 12.36)",
      "Bullish SuperTrend signal",
      "Multiple oversold indicators (MFI, CCI)",
      "Aroon confirms uptrend",
      "Bullish signals outweigh bearish (4 vs 1)"
    ]
  }
}
```

## 🔧 Troubleshooting

### **Common Deployment Issues**

#### **Python Version Error**
```bash
# Error: PYTHON_VERSION must provide major.minor.patch
# Solution: Use runtime.txt with python-3.11.9
```

#### **Build Failures**
```bash
# Error: Package compilation issues
# Solution: Use only Flask + Gunicorn (no pandas/numpy)
```

#### **Import Errors**
```bash
# Error: Module not found
# Solution: Ensure proper file structure and imports
```

### **API Testing**

#### **Test Health Endpoint**
```bash
curl https://your-app-name.onrender.com/health
```

#### **Test Prediction Endpoint**
```bash
curl -X POST https://your-app-name.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '[{"LTP": 24631.3, "RSI": {"rsi": "44.08", "status": "Neutral"}, "VIX": {"vix": "12.36", "status": "Calm Market"}}]'
```

## 🎯 Performance Optimization

### **Response Time Optimization**
- **Lightweight Dependencies**: Only Flask + Gunicorn
- **Efficient Algorithms**: Pure Python calculations
- **Memory Management**: Deque for signal storage
- **Caching**: Pattern weight caching

### **Accuracy Improvement**
- **Multi-Factor Analysis**: 15+ technical indicators
- **Writers Zone Integration**: Option flow analysis
- **Confidence Scoring**: Professional-grade confidence assessment
- **Learning Capability**: Accuracy tracking and adjustment

### **Scalability Features**
- **Stateless Design**: No persistent storage dependencies
- **Horizontal Scaling**: Multiple instance support
- **Load Balancing**: Compatible with load balancers
- **Monitoring**: Health check endpoints

## 🔮 Advanced Features

### **Machine Learning Integration**
```python
# Future enhancement: ML model integration
def integrate_ml_model(self, historical_data):
    # Train ensemble model
    # Feature engineering
    # Model validation
    # Prediction integration
    pass
```

### **Real-Time Learning**
```python
# Adaptive pattern weights
def adjust_pattern_weights(self, performance_data):
    # Analyze recent performance
    # Adjust weights based on accuracy
    # Optimize signal generation
    pass
```

### **Multi-Timeframe Analysis**
```python
# Multiple timeframe confirmation
def analyze_multiple_timeframes(self, data_5min, data_15min, data_1hour):
    # Cross-timeframe validation
    # Consensus building
    # Confidence adjustment
    pass
```

This comprehensive AI model provides professional-grade signal generation with full support for your technical indicators and Writers Zone analysis, optimized for reliable deployment on Render.com.





***************************************************

# 🚨 AI Model Deployment Troubleshooting Guide

## 📋 Overview

This guide provides comprehensive troubleshooting solutions for deploying the NIFTY trading AI model, with specific focus on Render.com deployment issues and alternative solutions.

## 🔧 Common Deployment Issues

### **1. Python Version Error**

#### **Error Message:**
```
The PYTHON_VERSION must provide a major, minor, and patch version, e.g. 3.8.1. You have requested 3.11.
```

#### **Root Cause:**
- Render.com requires exact major.minor.patch format
- Old configuration files might be cached
- Environment variables not properly set

#### **Complete Solution:**

1. **Update All Version Files:**
   ```bash
   # backend/runtime.txt
   python-3.11.11
   
   # backend/.python-version
   3.11.11
   ```

2. **Update render.yaml:**
   ```yaml
   services:
     - type: web
       envVars:
         - key: PYTHON_VERSION
           value: 3.11.11
   ```

3. **Clear Render Cache:**
   - Delete existing service on Render.com
   - Create new service from scratch
   - This ensures no cached configuration

### **2. Build Command Issues**

#### **Error Message:**
```
requirements_fixed.txt not found
```

#### **Solution:**
```bash
# Correct build command
pip install -r backend/requirements_fixed.txt

# Verify file structure
your-repo/
├── backend/
│   ├── requirements_fixed.txt
│   └── ai_model_api_fixed.py
```

### **3. Start Command Issues**

#### **Error Message:**
```
gunicorn: command not found
```

#### **Solution:**
```bash
# Correct start command
cd backend && gunicorn ai_model_api_fixed:app --bind 0.0.0.0:$PORT

# Ensure gunicorn is in requirements
flask==2.3.3
gunicorn==21.2.0
```

### **4. Import Module Errors**

#### **Error Message:**
```
ModuleNotFoundError: No module named 'ai_model_api_fixed'
```

#### **Solution:**
```bash
# Ensure correct file structure
backend/
├── ai_model_api_fixed.py  # Must be in backend folder
├── requirements_fixed.txt
└── runtime.txt

# Start command must include 'cd backend'
cd backend && gunicorn ai_model_api_fixed:app
```

## 🚀 Step-by-Step Deployment Fix

### **Step 1: Clean Repository**

```bash
# Remove any old configuration files
git rm runtime.txt .python-version render.yaml Procfile 2>/dev/null || true

# Add new configuration files in backend/
git add backend/runtime.txt
git add backend/.python-version
git add backend/render.yaml
git add backend/Procfile
git add backend/requirements_fixed.txt
git add backend/ai_model_api_fixed.py

# Commit changes
git commit -m "Fix Python version and deployment configuration"

# Push to GitHub
git push origin main
```

### **Step 2: Delete Old Render Service**

1. **Go to Render Dashboard**
2. **Find your existing service**
3. **Click on the service**
4. **Go to "Settings" tab**
5. **Scroll down to "Delete Service"**
6. **Click "Delete Service"**
7. **Confirm deletion**

### **Step 3: Create New Render Service**

1. **Click "New" → "Web Service"**
2. **Connect GitHub Repository**
3. **Select your repository**
4. **Manual Configuration:**
   - **Name**: `nifty-trading-ai-model`
   - **Runtime**: Python
   - **Build Command**: `pip install -r backend/requirements_fixed.txt`
   - **Start Command**: `cd backend && gunicorn ai_model_api_fixed:app --bind 0.0.0.0:$PORT`

5. **Environment Variables:**
   - **PYTHON_VERSION**: `3.11.11`
   - **PORT**: `10000`

6. **Click "Create Web Service"**

### **Step 4: Monitor Deployment**

Watch the deployment logs for:
```
==> Using Python version 3.11.11
==> Build successful 🎉
==> Deploying...
==> Your service is live 🎉
```

## 🎯 Alternative Deployment Solutions

### **Option 1: Heroku**

If Render.com continues to have issues:

```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set Python version
echo "python-3.11.11" > backend/runtime.txt

# Create Procfile
echo "web: cd backend && gunicorn ai_model_api_fixed:app" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### **Option 2: Railway**

```bash
# Connect GitHub to Railway
# Railway automatically detects Python apps
# Set environment variables:
PYTHON_VERSION=3.11.11
PORT=8000
```

### **Option 3: Local Development**

```bash
# Run locally and use ngrok for external access
cd backend
pip install -r requirements_fixed.txt
python ai_model_api_fixed.py

# In another terminal
ngrok http 5000

# Use ngrok URL as AI_MODEL_URL in n8n
```

### **Option 4: DigitalOcean App Platform**

```bash
# Create .do/app.yaml
name: nifty-trading-ai
services:
- name: api
  source_dir: backend
  github:
    repo: your-username/your-repo
    branch: main
  run_command: gunicorn ai_model_api_fixed:app
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: PYTHON_VERSION
    value: "3.11.11"
```

## 🔍 Debugging Steps

### **1. Local Testing**

```bash
# Test locally first
cd backend
python --version  # Should show 3.11.x
pip install -r requirements_fixed.txt
python ai_model_api_fixed.py

# Test endpoints
curl http://localhost:5000/health
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '[{"LTP": 24631.3, "RSI": {"rsi": "44.08", "status": "Neutral"}}]'
```

### **2. Validate Configuration Files**

```bash
# Check file contents
cat backend/runtime.txt        # Should show: python-3.11.11
cat backend/.python-version    # Should show: 3.11.11
cat backend/requirements_fixed.txt  # Should show flask and gunicorn

# Check file locations
ls -la backend/
# Should show all configuration files
```

### **3. GitHub Repository Check**

```bash
# Verify files are in GitHub
git ls-files backend/
# Should list all backend files including configuration files
```

## 🎯 Success Indicators

### **Successful Deployment Logs:**
```
==> Using Python version 3.11.11 (from runtime.txt)
==> Installing dependencies from requirements_fixed.txt
==> Build successful 🎉
==> Deploying...
==> Your service is live 🎉
```

### **Working API Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "model_loaded": true,
  "total_signals": 0,
  "accuracy": 0.0,
  "pattern_weights": {...}
}
```

## 🔄 If All Else Fails

### **Simplified Local Deployment**

If cloud deployment continues to fail, run locally:

```bash
# Install dependencies
cd backend
pip install flask gunicorn

# Run the application
python ai_model_api_fixed.py

# The app will run on http://localhost:5000
# Use this URL in your n8n configuration:
AI_MODEL_URL=http://localhost:5000
```

### **Docker Deployment**

```dockerfile
# Create Dockerfile in backend/
FROM python:3.11.11-slim

WORKDIR /app
COPY requirements_fixed.txt .
RUN pip install -r requirements_fixed.txt

COPY ai_model_api_fixed.py .

EXPOSE 5000
CMD ["gunicorn", "ai_model_api_fixed:app", "--bind", "0.0.0.0:5000"]
```

This comprehensive troubleshooting guide should resolve all deployment issues and get your AI model running successfully.