// ============================================================
// PREPARE DHAN ORDER v2
// Updated to handle new signal types: WAIT, AVOID, SIDEWAYS
// Also handles strict regime gating (no orders in bad markets)
// ============================================================

// === Read Signal ===
const signalData = $('signal Code').first().json;
const finalSignal = signalData.finalSignal;
const rawSignal = signalData.rawSignal;
const confidence = signalData.confidence;
const regime = signalData.regime || "UNKNOWN";
const streakCount = signalData.streakCount || 0;
const blockedReason = signalData.blockedReason || null;

// === IMMEDIATE SKIP CONDITIONS ===
// Any non-trade signal: skip cleanly without error
const SKIP_SIGNALS = ["WAIT", "AVOID", "SIDEWAYS"];
if (SKIP_SIGNALS.includes(finalSignal)) {
    return [{
        json: {
            status: "SKIPPED",
            reason: blockedReason || `Signal is '${finalSignal}' — no order placed`,
            finalSignal,
            rawSignal,
            confidence,
            regime,
            streakCount,
            orderPlaced: false
        }
    }];
}

// === REGIME GATE ===
// Even with a BUY signal, block orders in clearly bad market conditions
const dangerRegimes = ["HIGH_VOLATILITY", "SIDEWAYS_RANGING"];
if (dangerRegimes.includes(regime)) {
    return [{
        json: {
            status: "BLOCKED_BY_REGIME",
            reason: `Regime '${regime}' blocked order despite signal '${finalSignal}'`,
            finalSignal,
            confidence,
            regime,
            orderPlaced: false
        }
    }];
}

// === OPTION SELECTION ===
const spotPrice = $('NIFTY Option Chain Builder').first().json.spotPrice;
const atmStrike = $('NIFTY Option Chain Builder').first().json.atmStrike;
const ceOptions = $('NIFTY Option Chain Builder').first().json.ceOptions || [];
const peOptions = $('NIFTY Option Chain Builder').first().json.peOptions || [];
let quantity = $('Parse master Copy').first().json.lotSize || 75;

let selectedOption;
let orderType;

if (finalSignal === 'BUY CALL (CE)') {
    // Prefer ATM, then ATM+50 (slightly OTM), then first available
    selectedOption =
        ceOptions.find(opt => opt.strike === atmStrike) ||
        ceOptions.find(opt => opt.strike === atmStrike + 50) ||
        ceOptions[0];
    orderType = 'BUY';

} else if (finalSignal === 'BUY PUT (PE)') {
    selectedOption =
        peOptions.find(opt => opt.strike === atmStrike) ||
        peOptions.find(opt => opt.strike === atmStrike - 50) ||
        peOptions[0];
    orderType = 'BUY';

} else {
    // Unknown signal type — safety skip
    return [{
        json: {
            status: "SKIPPED",
            reason: `Unknown signal type: ${finalSignal}`,
            finalSignal,
            orderPlaced: false
        }
    }];
}

// === OPTION VALIDITY CHECK ===
if (!selectedOption) {
    return [{
        json: {
            status: "SKIPPED",
            reason: `No suitable NIFTY option found for signal: ${finalSignal}`,
            finalSignal,
            atmStrike,
            ceCount: ceOptions.length,
            peCount: peOptions.length,
            orderPlaced: false
        }
    }];
}

// Optional: Block very low premium options (< ₹5 LTP = near-expiry junk)
if (selectedOption.ltp < 5) {
    return [{
        json: {
            status: "SKIPPED",
            reason: `Option premium too low: ₹${selectedOption.ltp} (min ₹5) — near expiry or illiquid`,
            finalSignal,
            selectedOption,
            orderPlaced: false
        }
    }];
}

// === BUILD DHAN ORDER ===
const dhanOrder = {
    dhanClientId: "1107843174",
    correlationId: `SIG_${Date.now()}`,     // Unique ID for tracking
    transactionType: orderType,
    exchangeSegment: "NSE_FNO",
    productType: "INTRADAY",
    orderType: "MARKET",
    validity: "DAY",
    securityId: selectedOption.securityCode || selectedOption.securityId,
    quantity: quantity,
    disclosedQuantity: 0,
    price: 0,
    triggerPrice: 0,
    afterMarketOrder: false,
    boProfitValue: 0,
    boStopLossValue: 0
};

// === FINAL OUTPUT ===
return [{
    json: {
        // For Place Entry Order node
        dhanOrder,
        selectedOption,

        // Signal context (carry forward for logging)
        signal: finalSignal,
        orderType,
        quantity,
        confidence,
        regime,
        streakCount,

        // Option details
        underlying: 'NIFTY',
        spotPrice,
        atmStrike,
        selectedStrike: selectedOption.strike,
        expectedPremium: selectedOption.ltp,
        optionType: selectedOption.optionType,
        expiry: selectedOption.expiry,
        tradingSymbol: selectedOption.tradingSymbol || selectedOption.symbol,
        lotSize: quantity,

        // Risk estimates
        maxLoss: Math.round(selectedOption.ltp * quantity * 100) / 100,
        breakeven: selectedOption.optionType === 'CE'
            ? selectedOption.strike + selectedOption.ltp
            : selectedOption.strike - selectedOption.ltp,

        // Status flags
        orderPlaced: true,
        timestamp: new Date().toISOString()
    }
}];
