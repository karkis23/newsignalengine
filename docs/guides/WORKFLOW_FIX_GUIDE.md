# 🔧 n8n Workflow — Step-by-Step Fix Guide
# Apply ALL 9 fixes in order. Each fix is a specific action in n8n.

---

## FIX #1 — signal Code1: Wrong node names (CRITICAL)

**Node:** `signal Code1`

1. Click the `signal Code1` node
2. In the JS Code, find line 2–3:
   ```js
   const tech    = $node["Calculate All Technical Indicators"].json;
   const writers = $node["Writers Zone Analysis"].json;
   ```
3. Replace with:
   ```js
   const tech    = $node["Calculate All Technical Indicators1"].json;
   const writers = $node["Writers Zone Analysis1"].json;
   ```
4. **OR replace the entire code** with contents of:
   `fixed_nodes/signal_code_fix.js`
5. Click **Save**

---

## FIX #2 — Prepare Dhan Order1: Wrong node names (CRITICAL)

**Node:** `Prepare Dhan Order1`

Replace entire code with contents of:
`fixed_nodes/prepare_dhan_order_fix.js`

Key changes (4 lines):
```js
// OLD → NEW
$('signal Code')                  → $('signal Code1')
$('NIFTY Option Chain Builder')   → $('NIFTY Option Chain Builder1')
$('NIFTY Option Chain Builder')   → $('NIFTY Option Chain Builder1')   (x2)
$('Parse master Copy')            → $('Parse master Copy1')
```

---

## FIX #3 — Calculate SL & Target: Wrong node name (CRITICAL)

**Node:** `Calculate SL & Target`

Replace entire code with contents of:
`fixed_nodes/calculate_sl_target_fix.js`

Key change (1 line):
```js
// OLD:
const orderData = $node['Prepare NIFTY Dhan Order'].json;
// NEW:
const orderData = $node['Prepare Dhan Order1'].json;
```

---

## FIX #4 — Add IF gate before Place Entry Order (CRITICAL)

This prevents WAIT/AVOID/SIDEWAYS signals from placing orders.

**Steps:**
1. Click the connection between `Prepare Dhan Order1` and `Place Entry Order`
2. Click the **+** button to add a node in between
3. Search for **IF** node and add it
4. Name it: `Skip If No Order`
5. Configure the condition:
   - **Value 1:** `{{ $json.orderPlaced }}`
   - **Operation:** `Equal`
   - **Value 2:** `true`  (toggle to Boolean)
6. Connect:
   - **TRUE** output → `Place Entry Order`
   - **FALSE** output → (leave disconnected / end)

**Result:**
```
Prepare Dhan Order1 → [IF: orderPlaced = true] → TRUE → Place Entry Order
                                                → FALSE → (stop, no order)
```

---

## FIX #5 — Place Stop Loss: Fix hardcoded securityId (CRITICAL)

**Node:** `Place Stop Loss`

1. Click the node
2. Go to **Body** tab
3. Find the JSON body — it currently has:
   ```json
   "securityId": "39856"
   ```
4. Replace the **entire JSON body** with:
   ```json
   {
     "dhanClientId": "1107843174",
     "correlationId": "SL_{{ $now.toMillis() }}",
     "transactionType": "SELL",
     "exchangeSegment": "NSE_FNO",
     "productType": "INTRADAY",
     "orderType": "SL-M",
     "validity": "DAY",
     "securityId": "{{ $('Calculate SL & Target').item.json.stopLossOrder.securityId }}",
     "quantity": {{ $('Calculate SL & Target').item.json.quantity }},
     "disclosedQuantity": 0,
     "price": 0,
     "triggerPrice": {{ $('Calculate SL & Target').item.json.stopLoss }},
     "afterMarketOrder": false,
     "boProfitValue": 0,
     "boStopLossValue": 0
   }
   ```

---

## FIX #6 — Place Target Order: Fix hardcoded securityId (CRITICAL)

**Node:** `Place Target Order`

Replace the entire JSON body with:
```json
{
  "dhanClientId": "1107843174",
  "correlationId": "TGT_{{ $now.toMillis() }}",
  "transactionType": "SELL",
  "exchangeSegment": "NSE_FNO",
  "productType": "INTRADAY",
  "orderType": "LIMIT",
  "validity": "DAY",
  "securityId": "{{ $('Calculate SL & Target').item.json.targetOrder.securityId }}",
  "quantity": {{ $('Calculate SL & Target').item.json.quantity }},
  "disclosedQuantity": 0,
  "price": {{ $('Calculate SL & Target').item.json.target }},
  "triggerPrice": 0,
  "afterMarketOrder": false,
  "boProfitValue": 0,
  "boStopLossValue": 0
}
```

---

## FIX #7 — Log Active Trade: Add column mappings (HIGH)

**Node:** `Log Active Trade`

Currently has empty `"value": {}` — maps nothing to the sheet.

Click the node → Columns tab → Map these fields:

| Column Name | Expression |
|-------------|-----------|
| Entry Order ID | `={{ $('Calculate SL & Target').item.json.entryOrderId }}` |
| SL Order ID | `={{ $('Place Stop Loss').item.json.data.orderId }}` |
| Target Order ID | `={{ $('Place Target Order').item.json.data.orderId }}` |
| Trading Symbol | `={{ $('Calculate SL & Target').item.json.tradingSymbol }}` |
| Security ID | `={{ $('Calculate SL & Target').item.json.securityId }}` |
| Entry Price | `={{ $('Calculate SL & Target').item.json.fillPrice }}` |
| Stop Loss | `={{ $('Calculate SL & Target').item.json.stopLoss }}` |
| Target | `={{ $('Calculate SL & Target').item.json.target }}` |
| Quantity | `={{ $('Calculate SL & Target').item.json.quantity }}` |
| Risk Reward Ratio | `={{ $('Calculate SL & Target').item.json.riskRewardRatio }}` |
| Max Loss | `={{ $('Calculate SL & Target').item.json.maxLoss }}` |
| Max Profit | `={{ $('Calculate SL & Target').item.json.maxProfit }}` |
| Status | `=ACTIVE` |
| Timestamp | `={{ $('Calculate SL & Target').item.json.timestamp }}` |
| Exit Type | `` |
| Exit Price | `` |
| PnL | `` |
| Actual Risk Reward | `` |
| Exit Timestamp | `` |
| Execution Time | `={{ $('Calculate SL & Target').item.json.executionTime }}` |

---

## FIX #8 — Log Trade Summary: Add column mappings (HIGH)

**Node:** `Log Trade Summary`

Same issue — empty `"value": {}`. Map these:

| Column Name | Expression |
|-------------|-----------|
| Entry Order ID | `={{ $('Calculate SL & Target').item.json.entryOrderId }}` |
| Timestamp | `={{ $('Calculate SL & Target').item.json.timestamp }}` |
| Signal | `={{ $('signal Code1').item.json.finalSignal }}` |
| Confidence | `={{ $('signal Code1').item.json.confidence }}` |
| Trading Symbol | `={{ $('Calculate SL & Target').item.json.tradingSymbol }}` |
| Entry Price | `={{ $('Calculate SL & Target').item.json.fillPrice }}` |
| Stop Loss | `={{ $('Calculate SL & Target').item.json.stopLoss }}` |
| Target | `={{ $('Calculate SL & Target').item.json.target }}` |
| Quantity | `={{ $('Calculate SL & Target').item.json.quantity }}` |
| Risk Reward Ratio | `={{ $('Calculate SL & Target').item.json.riskRewardRatio }}` |
| Max Loss | `={{ $('Calculate SL & Target').item.json.maxLoss }}` |
| Max Profit | `={{ $('Calculate SL & Target').item.json.maxProfit }}` |
| Writers Zone | `={{ $('Writers Zone Analysis1').item.json.writersZone }}` |
| Market Strength | `={{ $('signal Code1').item.json.regime }}` |
| VIX | `={{ $('signal Code1').item.json.VIX }}` |
| Status | `=ACTIVE` |
| Exit Price | `` |
| PnL | `` |
| Exit Type | `` |
| Actual Risk Reward | `` |
| Exit Timestamp | `` |

---

## FIX #9 — Option Chain Expiry: Dynamic calculation (HIGH)

**Node:** `Option Chain Request1`

Current JSON body has:
```json
"Expiry": "2025-09-09"
```

Replace with dynamic expression (click the gear icon next to value to toggle expression mode):
```
={{ (() => {
  const d = new Date();
  const day = d.getDay();
  const daysToThu = (4 - day + 7) % 7;
  const add = (daysToThu === 0 && d.getHours() >= 15) ? 7 : (daysToThu || 7);
  d.setDate(d.getDate() + add);
  return d.toISOString().split('T')[0];
})() }}
```

---

## FIX #10 — Log Signal to Sheets4: Add new v2 fields (MEDIUM)

**Node:** `Log Signal to Sheets4`

First add these columns to your `Dhan_Signals` Google Sheet (row 1 headers):
`ADX | Regime | Raw Signal | Streak Count | MACD Flip | Blocked Reason | SuperTrend`

Then in n8n, add these mappings to the existing ones:

| Column | Expression |
|--------|-----------|
| ADX | `={{ $('signal Code1').item.json.ADX }}` |
| Regime | `={{ $('signal Code1').item.json.regime }}` |
| Raw Signal | `={{ $('signal Code1').item.json.rawSignal }}` |
| Streak Count | `={{ $('signal Code1').item.json.streakCount }}` |
| MACD Flip | `={{ $('signal Code1').item.json.MACDFlip }}` |
| Blocked Reason | `={{ $('signal Code1').item.json.blockedReason }}` |
| SuperTrend | `={{ $('signal Code1').item.json.SuperTrend }}` |

---

## FIX #11 — Signal-Filter3 connections: Move logging BEFORE the filter (MEDIUM)

**Current (wrong) flow:**
```
signal Code1 → Signal-Filter3 → [TRUE/FALSE both] → Log Signal → Prepare Order
```

**Fixed flow:**
```
signal Code1 → Log Signal to Sheets4 → Signal-Filter3 → TRUE → Prepare Dhan Order1
                                                        → FALSE → (end, stop)
```

**Steps:**
1. Click connection from `Signal-Filter3` → `Log Signal to Sheets4` (TRUE path) — **delete it**
2. Click connection from `Signal-Filter3` → `Log Signal to Sheets4` (FALSE path) — **delete it**
3. Draw new connection: `signal Code1` → `Log Signal to Sheets4`
4. Draw new connection: `Log Signal to Sheets4` → `Signal-Filter3`
5. Draw new connection: `Signal-Filter3` TRUE → `Prepare Dhan Order1`
6. FALSE path — leave disconnected (or optionally connect to a No-Op Set node for cleanliness)

---

## Final Flow Diagram (After All Fixes)

```
Trading Hours Trigger
        ↓
Trading Hour Filter1 (TRUE only)
        ↓
TOTP Auth1 → Angel One Login → Get 5Min Candles
                                      ↓
                               NIFTY Spot (LTP)1
                                      ↓
                               INDIA VIX Spot1
                                      ↓
                         VIX Filter Condition (<18)
                           TRUE ↓          FALSE → [stop]
                         Download file1
                                ↓
                         Extract from File
                                ↓
                         Parse master Copy1
                                ↓
                         NIFTY Option Chain Builder1
                                ↓
                         Option Chain Request1 (dynamic expiry ✅)
                                ↓
                         Calculate All Technical Indicators1
                                ↓
                         Writers Zone Analysis1
                                ↓
                         signal Code1 (fixed node refs ✅)
                                ↓
                         Log Signal to Sheets4 (all signals ✅ + new fields ✅)
                                ↓
                         Signal-Filter3
                    TRUE ↓            FALSE → [stop]
                  Prepare Dhan Order1 (fixed node refs ✅)
                         ↓
               [IF: orderPlaced = true] ← FIX #4 ✅
          TRUE ↓              FALSE → [stop]
        Place Entry Order
                ↓
        Wait-for-Order-Fill (60s)
                ↓
        Get Order Status
                ↓
        Calculate SL & Target (fixed refs + dynamic securityId ✅)
               ↓ ↓
    Place Stop Loss ── Place Target Order
    (dynamic securityId ✅)  (dynamic securityId ✅)
               ↓
        Log Active Trade (with full mappings ✅)
               ↓
        Log Trade Summary (with full mappings ✅)
```

---

## Priority Order for Applying Fixes

| Priority | Fix # | Time to Apply |
|----------|-------|--------------|
| 🔴 Do First | #1 signal Code1 node names | 2 min |
| 🔴 Do First | #2 Prepare Dhan Order1 names | 2 min |
| 🔴 Do First | #3 Calculate SL & Target name | 1 min |
| 🔴 Do First | #4 Add IF gate node | 3 min |
| 🔴 Do First | #5 Place Stop Loss securityId | 2 min |
| 🔴 Do First | #6 Place Target securityId | 2 min |
| 🟠 High | #7 Log Active Trade mappings | 5 min |
| 🟠 High | #8 Log Trade Summary mappings | 5 min |
| 🟠 High | #9 Dynamic expiry | 2 min |
| 🟡 Medium | #10 New signal fields | 5 min |
| 🟡 Medium | #11 Move Log before filter | 3 min |

**Total time: ~30 minutes to fix all critical bugs**
