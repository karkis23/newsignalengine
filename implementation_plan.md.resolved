# AI Signal Engine (v4.0) — Architecture & Implementation Plan

This document outlines the master plan for replacing the current JavaScript-based heuristics signal engine (v3.0) with a powerful, strategy-based AI/Machine Learning Model built in Python.

## 1. Goal Description

The current v3.0 system is a highly robust **rules-based** engine. However, to overcome market manipulation, trap trading, stop-loss hunting, and institutional misdirection, we need an engine capable of **non-linear pattern recognition**. 

The AI model will learn from the specified books (Options Volatility, Pricing, SMC concepts, Price Action) and process hundreds of features simultaneously to emit high-probability signals. It will emulate the thinking of institutional fund managers and top-tier traders.

## User Review Required

> [!IMPORTANT]
> **Architecture Decision**: The AI model **cannot** run purely inside an n8n Code (JavaScript) node for three reasons:
> 1. JavaScript lacks robust, highly optimized Machine Learning libraries (like PyTorch, XGBoost, Scikit-Learn).
> 2. Training and running inference on complex models requires significant RAM and CPU, which will crash n8n.
> 3. Python is the industry standard for quant trading and algorithmic models.
> 
> **Proposed Solution**: We will build a **Python FastAPI App** hosting the AI model. You will deploy this on a platform like **Render** or an AWS EC2 instance. n8n will simply use an `HTTP Request` node to send the live data context to the Python API, which will return the signal instantly.
> 
> **Are you okay with hosting a separate Python API (e.g., on Render)?**

## 2. Gap Analysis (What needs tuning in current n8n nodes)

I have analyzed your `Calculate Technical Indicators v2` and `Writers Zone Analysis v2`. They are excellent for rule-based systems, but the AI needs more raw context:

1. **Indicator Calculator Node**:
   - Currently, it relies on a single timeframe (5-min). The AI needs **Multi-Timeframe (MTF)** data (1-min, 5-min, 15-min).
   - Needs **Volume Profile** (Value Area High/Low, Point of Control). VWAP is good, but Volume Profile reveals liquidity pools.
2. **Writers Zone Node**:
   - Good Max Pain and PCR.
   - We need deeper **Gamma Exposure (GEX)** estimation to understand Options Pinning and Volatility Expansion.
3. **Data Feed (Angel One)**:
   - We lack **Tick-by-Tick Order Flow (Cumulative Delta)**. OHLCV data hides intra-bar manipulation (e.g., strong selling absorbed by limit buy orders).

## 3. The New Architecture Design

The v4.0 system will be distributed:

```mermaid
graph TD
    A[Angel One API / TradingView] -->|Raw Data| B(n8n Workflow)
    B -->|Calculate Indicators| C(Feature Engineering Array)
    B -->|Calculate Writers Zone| C
    C -->|HTTP POST Request\nJSON Payload| D[Python FastAPI Server\nRender/AWS]
    
    subgraph Python AI Engine
        D --> E{Data Preprocessor}
        E --> F[Feature Scaling & Normalization]
        F --> G[XGBoost / Random Forest\nTabular Logic]
        F --> H[LSTM / Transformer Neural Net\nSequence/Time-Series Logic]
        G --> I(Ensemble Voting System)
        H --> I
        I --> J[Risk & Regime Filter\nVIX, Time of Day]
    end
    
    J -->|JSON Response:\nfinalSignal, confidence, regime| B
    B --> K[Dhan Execution Engine]
```

## 4. Model Design & Feature Engineering (The "Brain")

To capture the concepts from your book list and market theories, the AI will be structured to analyze data across three pillars:

### Pillar 1: Price Action & SMC (Smart Money Concepts)
*Capturing: Liquidity Sweeps, Order Blocks, ChoCh, BOS, Opening False Breakouts.*
- **Features Extracted**: Fractal highs/lows, distance to recent swing points, Fair Value Gaps (FVG) overlap, opening 15-min range boundaries, wick-to-body ratios (for sweep detection).

### Pillar 2: Volatility & Options Greeks
*Capturing: Volatility Expansion Cycles, Options Pinning, Gamma Zones.*
- **Features Extracted**: Implied Volatility (IV) Skew (CE IV vs PE IV), Max Pain proximity, Delta-adjusted OI, Gamma squeeze probability (when spot approaches heavy OI strikes with short time to expiry).

### Pillar 3: Market Maker & Liquidity Mechanics
*Capturing: Inventory Balancing, Stop Loss Cascades, Mean Reversion.*
- **Features Extracted**: Put/Call premium ratios, Shift in POC (Point of Control) throughout the day, VWAP deviation bands.

## 5. Implementation Plan & Phases

### Phase 1: Data Collection & Feature Generation (Current Priority)
We cannot just "plug in" an AI. AI needs historical data to learn the NIFTY formula.
- **Action**: We must write a Python script to historically pull NIFTY OHLCV and Option Chain data spanning the last 2-3 years.
- **Action**: Translate the logic from your n8n indicator and writers zone scripts into Python (using Pandas/TA-Lib) so the AI can train on the exact same features it will see live.

### Phase 2: Model Training Architecture
- **Model Choice**: An **Ensemble Model**. 
  - *Gradient Boosting (XGBoost/LightGBM)* is the best in the world for predicting tabular financial data (Indicators, OI, PCR).
  - *LSTM (Long Short-Term Memory)* networks are excellent for understanding sequence and time (Candle patterns, continuous accumulation).
- **Target Variable formulation**: We don't just ask the AI to predict "Price will go up". We train it to predict: "Will a long position hitting a 12pt Stop Loss happen BEFORE hitting a 25pt Target within the next 60 minutes?"

### Phase 3: Python Microservice Build
- Build a lightweight `FastAPI` application.
- Create an endpoint: `POST /api/v1/predict`
- It receives the JSON from n8n, scales the data, runs the inference (`model.predict()`), and returns the exact JSON format your current Signal Code produces.

### Phase 4: n8n Integration
- Replace the `signal Code1` node in n8n with an `HTTP Request` node pointing to the Render URL.
- No other changes needed to the Dhan Execution Engine.

## 6. Verification Plan

1. **Backtesting Simulation**: Before deploying live, we will run the Python model through the custom Strategy Tester you built in React. We will feed 3 months of unseen historical data and verify the Sharpe Efficiency and Win Rate.
2. **Paper Trading Phase**: The Python model will return signals to a staging Google Sheet without executing Dhan Orders. We will observe the "Blocked Reason" or "Confidence" levels during known trap zones (e.g., 10:00 AM false breakouts).
3. **Execution**: Once proven, we swap the n8n HTTP Request node to route to the live Dhan Execution nodes.

## Next Steps for You

Please review this plan. If you approve of using a **Python FastAPI + Render** architecture to host the AI, we will generate the Python architecture repository structure, including the data collection scripts required to train the AI.
