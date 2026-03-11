// ============================================================
// PREPARE DHAN ORDER v2 — FIXED
// BUG #2 FIX: All node references corrected (added "1" suffix)
// ============================================================

// ❌ OLD: $('signal Code').first().json
// ✅ FIXED:
const signalData = $('signal Code1').first().json;

const finalSignal = signalData.finalSignal;
const rawSignal = signalData.rawSignal;
const confidence = signalData.confidence;
const regime = signalData.regime || "UNKNOWN";
const streakCount = signalData.streakCount || 0;
const blockedReason = signalData.blockedReason || null;

// === SKIP NON-TRADE SIGNALS ===
const SKIP_SIGNALS = ["WAIT", "AVOID", "SIDEWAYS"];
if (SKIP_SIGNALS.includes(finalSignal)) {
    return [{
        json: {
            status: "SKIPPED",
            reason: blockedReason || `Signal is '${finalSignal}' — no order placed`,
            finalSignal, rawSignal, confidence, regime, streakCount,
            orderPlaced: false
        }
    }];
}

// === REGIME GATE ===
const dangerRegimes = ["HIGH_VOLATILITY", "SIDEWAYS_RANGING"];
if (dangerRegimes.includes(regime)) {
    return [{
        json: {
            status: "BLOCKED_BY_REGIME",
            reason: `Regime '${regime}' blocked order`,
            finalSignal, confidence, regime,
            orderPlaced: false
        }
    }];
}

// ❌ OLD: $('NIFTY Option Chain Builder').first()
// ✅ FIXED:
const spotPrice = $('NIFTY Option Chain Builder1').first().json.spotPrice;
const atmStrike = $('NIFTY Option Chain Builder1').first().json.atmStrike;
const ceOptions = $('NIFTY Option Chain Builder1').first().json.ceOptions || [];
const peOptions = $('NIFTY Option Chain Builder1').first().json.peOptions || [];

// ❌ OLD: $('Parse master Copy').first()
// ✅ FIXED:
let quantity = $('Parse master Copy1').first().json.lotSize || 75;

let selectedOption;
let orderType;

if (finalSignal === 'BUY CALL (CE)') {
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
    return [{ json: { status: "SKIPPED", reason: `Unknown signal: ${finalSignal}`, finalSignal, orderPlaced: false } }];
}

// === VALIDITY CHECKS ===
if (!selectedOption) {
    return [{
        json: {
            status: "SKIPPED",
            reason: `No option found for signal: ${finalSignal}`,
            finalSignal, atmStrike, orderPlaced: false
        }
    }];
}

if (selectedOption.ltp < 5) {
    return [{
        json: {
            status: "SKIPPED",
            reason: `Premium too low: ₹${selectedOption.ltp} (min ₹5)`,
            finalSignal, selectedOption, orderPlaced: false
        }
    }];
}

// === BUILD ORDER ===
const dhanOrder = {
    dhanClientId: "1107843174",
    correlationId: `SIG_${Date.now()}`,
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

return [{
    json: {
        dhanOrder,
        selectedOption,
        signal: finalSignal,
        orderType,
        quantity,
        confidence,
        regime,
        streakCount,
        underlying: 'NIFTY',
        spotPrice,
        atmStrike,
        selectedStrike: selectedOption.strike,
        expectedPremium: selectedOption.ltp,
        optionType: selectedOption.optionType,
        expiry: selectedOption.expiry,
        tradingSymbol: selectedOption.tradingSymbol || selectedOption.symbol,
        lotSize: quantity,
        maxLoss: Math.round(selectedOption.ltp * quantity * 100) / 100,
        breakeven: selectedOption.optionType === 'CE'
            ? selectedOption.strike + selectedOption.ltp
            : selectedOption.strike - selectedOption.ltp,
        orderPlaced: true,
        timestamp: new Date().toISOString()
    }
}];
