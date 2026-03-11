// ============================================================
// CALCULATE SL & TARGET — FIXED
// BUG #3 FIX: Corrected node reference from 'Prepare NIFTY Dhan Order'
//             to 'Prepare Dhan Order1'
// BUG #5 FIX: securityId is now taken from the actual executed order,
//             not hardcoded. SL/Target orders use this returned securityId.
// ============================================================

const orderStatus = $node['Get Order Status'].json.data;

// ❌ OLD: $node['Prepare NIFTY Dhan Order'].json
// ✅ FIXED:
const orderData = $node['Prepare Dhan Order1'].json;

// Validate execution
if (orderStatus.orderStatus !== 'TRADED') {
    throw new Error(`Order not executed. Status: ${orderStatus.orderStatus}`);
}

const fillPrice = parseFloat(orderStatus.price);
const quantity = parseInt(orderStatus.quantity);

// ✅ FIXED: Use the securityId from the ACTUAL executed order (not hardcoded "39856")
const securityId = orderStatus.securityId;
const tradingSymbol = orderData.selectedOption?.tradingSymbol || orderData.selectedOption?.symbol || '';

if (!fillPrice || fillPrice <= 0) {
    throw new Error(`Invalid fill price: ${fillPrice}`);
}

// --- Risk Management Settings ---
const SL_PERCENT = 0.15;   // 15% Stop Loss
const TARGET_PERCENT = 0.30; // 30% Target

const stopLossPrice = Math.max(fillPrice * (1 - SL_PERCENT), 0.5);
const targetPrice = fillPrice * (1 + TARGET_PERCENT);

// ✅ Both SL and Target use the REAL securityId from the order
const stopLossOrder = {
    securityId,           // ✅ dynamic — from actual order
    exchangeSegment: "NSE_FNO",
    transactionType: "SELL",
    quantity,
    orderType: "SL-M",
    productType: "INTRADAY",
    price: 0,
    triggerPrice: stopLossPrice,
    disclosedQuantity: 0,
    validity: "DAY",
    afterMarketOrder: false,
    boProfitValue: 0,
    boStopLossValue: 0
};

const targetOrder = {
    securityId,           // ✅ dynamic — from actual order
    exchangeSegment: "NSE_FNO",
    transactionType: "SELL",
    quantity,
    orderType: "LIMIT",
    productType: "INTRADAY",
    price: targetPrice,
    triggerPrice: 0,
    disclosedQuantity: 0,
    validity: "DAY",
    afterMarketOrder: false,
    boProfitValue: 0,
    boStopLossValue: 0
};

const riskAmount = fillPrice - stopLossPrice;
const rewardAmount = targetPrice - fillPrice;
const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

return {
    entryOrderId: orderStatus.orderId,
    fillPrice, quantity,
    securityId,        // ✅ correct instrument
    tradingSymbol,
    underlying: 'NIFTY',
    stopLoss: stopLossPrice,
    target: targetPrice,
    stopLossOrder,     // ✅ contains correct securityId
    targetOrder,       // ✅ contains correct securityId
    riskAmount: Math.round(riskAmount * 100) / 100,
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    maxLoss: Math.round(riskAmount * quantity * 100) / 100,
    maxProfit: Math.round(rewardAmount * quantity * 100) / 100,
    executionTime: orderStatus.createTime,
    orderStatus: orderStatus.orderStatus,
    exchangeOrderId: orderStatus.exchangeOrderId,
    timestamp: new Date().toISOString()
};
