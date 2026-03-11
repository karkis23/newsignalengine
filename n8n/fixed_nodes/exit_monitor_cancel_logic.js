// ============================================================
// EXIT MONITOR & AUTO-CANCELLER
// Use this node after your "Get Order Status" for SL/Target orders
// ============================================================

const slStatus = $node['Get SL Status'].json.data;
const targetStatus = $node['Get Target Status'].json.data;

const entryOrderId = $node['Calculate SL & Target'].json.entryOrderId;
const slOrderId = slStatus.orderId;
const targetOrderId = targetStatus.orderId;

let actionRequired = "NONE";
let orderToCancel = null;
let reason = "";

if (slStatus.orderStatus === 'TRADED') {
    actionRequired = "CANCEL_ORDER";
    orderIdToCancel = targetOrderId;
    reason = "Target cancelled because Stop Loss was hit.";
}
else if (targetStatus.orderStatus === 'TRADED') {
    actionRequired = "CANCEL_ORDER";
    orderIdToCancel = slOrderId;
    reason = "SL cancelled because Target was hit.";
}

return {
    actionRequired,
    orderIdToCancel, // Use this in the 'Order ID' field of Dhan Delete node
    reason,
    entryOrderId,
    orderHit: slStatus.orderStatus === 'TRADED' ? "SL" : "TARGET",
    timestamp: new Date().toISOString()
};
