// ============================================================
// PAPER TRADING EXECUTION HANDLER
// Use this node INSTEAD of 'Place Entry Order' during testing
// ============================================================

const orderData = $node['Prepare Dhan Order1'].json;
const selectedOption = orderData.selectedOption;

// Simulate a market fill with 0.1% slippage
const fillPrice = selectedOption.ltp * 1.001;

return {
    json: {
        status: "PAPER_SUCCESS",
        orderId: `PAPER_${Date.now()}`,
        exchangeOrderId: `EX_PAPER_${Math.floor(Math.random() * 1000000)}`,
        tradingSymbol: orderData.tradingSymbol,
        securityId: orderData.dhanOrder.securityId,
        quantity: orderData.quantity,
        price: fillPrice.toFixed(2),
        orderStatus: "TRADED", // 👈 This makes the SL/Target node think it's real
        createTime: new Date().toISOString(),
        isPaperTrade: true
    }
};
