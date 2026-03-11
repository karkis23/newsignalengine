# Trading Bot — Real Workflow Analysis & Development Plan

## Actual Architecture (from your current n8n workflow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  YOUR ACTUAL WORKING WORKFLOW                          │
│                                                                        │
│  ⏰ Cron 5min (9-15, Mon-Fri)                                         │
│     → Trading Hour Filter (IST check)                                  │
│     → TOTP Auth (n8n built-in node ✅)                                 │
│     → Angel One Login (for historical candle data only)                │
│     → Get 5Min Candles (Angel One Historical API)                      │
│     → NIFTY Spot LTP (TradingView Scanner - free, no auth)            │
│     → India VIX (TradingView Scanner)                                  │
│     → VIX Filter (< 18)                                               │
│     → Download Master File (Google Drive .xlsx)                        │
│     → Extract & Parse Master (ATM options, nearest expiry)             │
│     → NIFTY Option Chain Builder (Dhan LTP for each option)            │
│     → Option Chain Request (Dhan /v2/optionchain)                      │
│     → Calculate ALL Technical Indicators (21 indicators!)              │
│     → Writers Zone Analysis (premium-based OI analysis)                │
│     → Signal Code (weighted scoring → BUY CE/PE/WAIT/AVOID)           │
│     → Log Signal to Google Sheets                                      │
│     → Prepare Dhan Order (select ATM option)                           │
│     → Place Entry Order (Dhan /v2/orders)                              │
│     → Wait 60s → Get Order Status → Calculate SL & Target             │
│     → Place SL (SL-M) + Place Target (LIMIT) — parallel               │
│     → Log Active Trade → Log Trade Summary (Google Sheets)             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Differences from Old Workflow

| Feature | Old (NEWN8NFINAL.JSON) | Real (Your Current) |
|---------|----------------------|---------------------|
| **Broker** | Angel One SmartAPI | **Dhan API** (orders) + Angel One (candles only) |
| **TOTP** | Manual env variable ❌ | n8n built-in TOTP node ✅ |
| **Spot Price** | Angel One getLTP | **TradingView Scanner** (free) |
| **VIX** | Angel One getLTP | **TradingView Scanner** (free) |
| **AI Model** | External Flask API | **In-workflow JS code** (no external dependency) |
| **Sentiment API** | External Flask API | **Removed** (not used) |
| **Option Chain** | Angel One option chain | **Dhan /v2/optionchain** |
| **Master Data** | None | **Google Drive .xlsx** file |
| **Indicators** | 6 basic | **21 comprehensive** indicators |
| **Signal Logic** | External AI model | Fully self-contained weighted scoring |

## What's WORKING ✅

1. ✅ **TOTP auto-generation** — using n8n's built-in TOTP node
2. ✅ **Angel One login** — auto-authenticates for candle data
3. ✅ **Candle data fetching** — 5-min candles from Angel One
4. ✅ **Spot & VIX** — via TradingView (free, no auth needed)
5. ✅ **Technical analysis** — 21 indicators calculated in-workflow
6. ✅ **Writers Zone** — premium-based analysis from Dhan option chain
7. ✅ **Signal generation** — weighted scoring with repeat protection
8. ✅ **Signal logging** — to Google Sheets (Dhan_Signals sheet)
9. ✅ **Order preparation** — ATM option selection for NIFTY
10. ✅ **Order placement** — via Dhan API
11. ✅ **SL & Target** — auto-calculated (12pt SL, 25pt target)
12. ✅ **Trade logging** — Active trades + summary to Sheets
13. ✅ **Google Sheets integration** — service account configured

## Critical Issues Found 🚨

### 🔴 Issue 1: VIX Filter is BYPASSED
The VIX Filter node routes BOTH true AND false outputs to "Download file":
```json
"VIX Filter Condition (< 18)": {
  "main": [
    [{ "node": "Download file" }],   // TRUE path → continues
    [{ "node": "Download file" }]    // FALSE path → ALSO continues!
  ]
}
```
**Impact:** Trades execute even when VIX > 18 (high volatility = dangerous)

### 🔴 Issue 2: Hardcoded Dhan Access Tokens
Multiple nodes have the Dhan JWT token hardcoded directly:
- `NIFTY Option Chain Builder` — has token in JS code
- `Option Chain Request` — hardcoded in headers
- `Place Entry Order` — hardcoded in headers
- `Get Order Status` — has a DIFFERENT (possibly expired) token
- `Place Stop Loss` — hardcoded token
- `Place Target Order` — hardcoded token

**Impact:** When tokens expire, entire workflow breaks silently

### 🔴 Issue 3: Hardcoded Option Chain Expiry
```json
"Option Chain Request" body: { "Expiry": "2025-09-09" }
```
**Impact:** After Sep 9, 2025 this stops fetching valid data

### 🔴 Issue 4: SL & Target Orders Have WRONG Body
Place Stop Loss and Place Target bodies use hardcoded `securityId: "39856"` 
instead of dynamic values from `Calculate SL & Target`:
```json
"securityId": "39856"  // ← HARDCODED! Should be dynamic
```
**Impact:** SL and Target placed on wrong instrument!

### 🔴 Issue 5: Signal Thresholds Too Aggressive
```js
const BUY_THRESHOLD = 0;    // ANY positive = BUY CE
const SELL_THRESHOLD = -0;   // ANY negative = BUY PE
```
**Impact:** Even a +1 confidence score triggers a trade. No minimum conviction.

### 🟡 Issue 6: No WAIT/AVOID Gate Before Order Placement
`Prepare Dhan Order` returns `{ status: "SKIPPED" }` for WAIT/AVOID, but the 
flow still continues to `Place Entry Order` which will fail on invalid data.
Need an IF node between Prepare and Place.

### 🟡 Issue 7: No Exit Order Monitor
There's no second workflow to monitor if SL or Target gets hit and cancel 
the opposite order. Both remain open until market close.

### 🟡 Issue 8: No Daily Loss Limit
No check to see if daily losses exceeded maximum before placing new trades.

### 🟡 Issue 9: No Paper Trading Mode
Orders go directly to Dhan. No way to test without real money.

### 🟡 Issue 10: Angel One Credentials in Plaintext
```json
"X-PrivateKey": "1URTDXkr",
"clientcode": "K589212",
"password": "2323"
```
Should use n8n environment variables.

## Development Plan — Priority Order

### Phase 1: Fix Critical Bugs (Do First!) 🔴

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1.1 | Fix VIX Filter — remove false path to Download | 5 min | Prevents trading in high volatility |
| 1.2 | Fix SL & Target order bodies — use dynamic values | 15 min | SL/Target placed on correct instrument |
| 1.3 | Add IF node after Prepare Order — skip WAIT/AVOID | 10 min | Prevents invalid order attempts |
| 1.4 | Raise signal thresholds (≥15 / ≤-15) | 5 min | Fewer false signals |
| 1.5 | Make Option Chain expiry dynamic | 10 min | Works beyond Sep 2025 |
| 1.6 | Move credentials to env variables | 15 min | Security best practice |

### Phase 2: Token Management

| # | Task | Effort |
|---|------|--------|
| 2.1 | Centralize Dhan token in env variable | 15 min |
| 2.2 | Add token refresh mechanism (or use single var) | 30 min |
| 2.3 | Reference `{{$env.DHAN_ACCESS_TOKEN}}` in all nodes | 15 min |

### Phase 3: Add Missing Workflow Components

| # | Component | Effort |
|---|-----------|--------|
| 3.1 | Exit Order Monitor workflow (cancel opposite on fill) | 1 hour |
| 3.2 | Daily loss limit check before order placement | 30 min |
| 3.3 | Paper trading mode (simulate instead of real orders) | 45 min |
| 3.4 | Error handling with retry on API failures | 30 min |

### Phase 4: Connect Frontend Dashboard

| # | Task | Effort |
|---|------|--------|
| 4.1 | Build API bridge to read Google Sheets | 2 hours |
| 4.2 | Replace mock data with real Sheets data | 2 hours |
| 4.3 | Live signal updates via polling | 1 hour |

## Google Sheets Structure (Already Configured)

**Sheet ID:** `1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU`

| Sheet Name | Purpose | Columns |
|------------|---------|---------|
| `Dhan_Signals` | Signal log | Timestamp, Signal, Confidence, RSI, MACD, VIX, Writers Zone, Spot Price, etc. |
| `Dhan_Active_Trades` | Open positions | Entry Order ID, SL/Target Order IDs, Prices, Status, PnL |
| `Dhan_Trade_Summary` | Trade history | Full trade details with exit info |

## Technical Indicators Calculated (21 total)

1. RSI (14) — Overbought/Oversold
2. EMA20 — Trend direction
3. SMA50 — Longer trend
4. MACD — Momentum crossover
5. VIX — Market volatility
6. Bollinger Bands — Breakout detection
7. ATR (14) — Volatility measure
8. ADX (14) — Trend strength
9. Stochastic — Momentum oscillator
10. VWAP — Institutional fair value
11. CCI — Commodity Channel Index
12. SuperTrend — Trend following
13. OBV — On-Balance Volume
14. Aroon — Trend start detection
15. Parabolic SAR — Trend reversal
16. MFI — Money Flow Index
17. Candlestick Patterns (11 patterns) — Price action
18. Price Action Score — Swing analysis
19. Volume Spike Detection — Unusual volume
20. Volume Strength Score — OBV + spike confirmation
21. Writers Zone (premium analysis) — Option premium analysis
