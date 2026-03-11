// ============================================================
// WRITERS ZONE ANALYSIS v2.0 — ALL BUGS FIXED
// Date: 07 March 2026
//
// FIXES APPLIED:
//  WZ-1: Premium PCR interpretation corrected (high PCR = bullish)
//  WZ-2: ATM skew interpretation clarified with IV context
//  WZ-3: Data format guard + better error reporting
//  WZ-4: Max Pain calculation added
//
// INPUT: Option Chain Request1, NIFTY Option Chain Builder1
// OUTPUT: writersZone, confidence, PCR ratios, support/resistance,
//         maxPain, OI change tracking
// ============================================================

// === DATA EXTRACTION ===
const ocData = $('Option Chain Request1').first().json?.data || {};
const spotPrice = parseFloat(ocData.last_price) || 0;
const ocMap = ocData.oc || {};

// ATM from Builder node (already computed as nearest 50)
const atmStrike = $('NIFTY Option Chain Builder1').first().json?.atmStrike || Math.round(spotPrice / 50) * 50;

// [WZ-3] Guard: verify we have valid data
const strikeKeys = Object.keys(ocMap);
if (spotPrice === 0 || strikeKeys.length === 0) {
    return {
        writersZone: "NEUTRAL",
        confidence: 0,
        maxCELTP: 0, maxPELTP: 0,
        maxCEStrike: 0, maxPEStrike: 0,
        totalCEValue: 0, totalPEValue: 0,
        totalCEOI: 0, totalPEOI: 0,
        putCallPremiumRatio: 1.0,
        putCallOIRatio: 1.0,
        ltpDataAvailable: false,
        oiDataAvailable: false,
        supportLevels: [],
        resistanceLevels: [],
        reasoning: [spotPrice === 0 ? "⚠️ Spot price missing" : "⚠️ OC data empty"],
        marketStructure: "NO_DATA",
        maxPain: 0,
        currentPrice: spotPrice,
        atmStrike,
        distanceFromATM: 0,
        underlying: "NIFTY",
        ceOptionsCount: 0,
        peOptionsCount: 0,
        timestamp: new Date().toISOString(),
        analysisVersion: "v2.0"
    };
}

console.log(`✅ Spot: ${spotPrice}, ATM: ${atmStrike}`);
console.log(`✅ Total strikes in OC: ${strikeKeys.length}`);

// === Parse OC map into flat CE/PE arrays ===
const ceOptions = [];
const peOptions = [];

Object.entries(ocMap).forEach(([strikeStr, optData]) => {
    const strike = parseFloat(strikeStr);
    if (!strike || isNaN(strike)) return;

    // CE
    if (optData.ce) {
        ceOptions.push({
            strike,
            ltp: parseFloat(optData.ce.last_price) || 0,
            oi: parseFloat(optData.ce.oi) || 0,
            prevOI: parseFloat(optData.ce.previous_oi) || 0,
            iv: parseFloat(optData.ce.implied_volatility) || 0,
            avgPrice: parseFloat(optData.ce.average_price) || 0,
            delta: parseFloat(optData.ce.greeks?.delta) || 0,
            theta: parseFloat(optData.ce.greeks?.theta) || 0,
            gamma: parseFloat(optData.ce.greeks?.gamma) || 0,
            vega: parseFloat(optData.ce.greeks?.vega) || 0,
            distanceFromATM: Math.abs(strike - atmStrike),
            type: 'CE'
        });
    }

    // PE
    if (optData.pe) {
        peOptions.push({
            strike,
            ltp: parseFloat(optData.pe.last_price) || 0,
            oi: parseFloat(optData.pe.oi) || 0,
            prevOI: parseFloat(optData.pe.previous_oi) || 0,
            iv: parseFloat(optData.pe.implied_volatility) || 0,
            avgPrice: parseFloat(optData.pe.average_price) || 0,
            delta: parseFloat(optData.pe.greeks?.delta) || 0,
            theta: parseFloat(optData.pe.greeks?.theta) || 0,
            gamma: parseFloat(optData.pe.greeks?.gamma) || 0,
            vega: parseFloat(optData.pe.greeks?.vega) || 0,
            distanceFromATM: Math.abs(strike - atmStrike),
            type: 'PE'
        });
    }
});

console.log(`📊 CE: ${ceOptions.length}, PE: ${peOptions.length}`);

// Sort by distance from ATM
ceOptions.sort((a, b) => a.distanceFromATM - b.distanceFromATM);
peOptions.sort((a, b) => a.distanceFromATM - b.distanceFromATM);

// === Aggregate stats ===
let maxCELTP = 0, maxPELTP = 0;
let maxCEStrike = 0, maxPEStrike = 0;
let totalCEValue = 0, totalPEValue = 0;
let totalCEOI = 0, totalPEOI = 0;
let totalCEOIChange = 0, totalPEOIChange = 0;

// Max OI strikes (for support/resistance)
let maxCEOI = 0, maxPEOI = 0;
let maxCEOIStrike = 0, maxPEOIStrike = 0;

ceOptions.forEach(o => {
    totalCEValue += o.ltp;
    totalCEOI += o.oi;
    totalCEOIChange += (o.oi - o.prevOI);
    if (o.ltp > maxCELTP) { maxCELTP = o.ltp; maxCEStrike = o.strike; }
    if (o.oi > maxCEOI) { maxCEOI = o.oi; maxCEOIStrike = o.strike; }
});

peOptions.forEach(o => {
    totalPEValue += o.ltp;
    totalPEOI += o.oi;
    totalPEOIChange += (o.oi - o.prevOI);
    if (o.ltp > maxPELTP) { maxPELTP = o.ltp; maxPEStrike = o.strike; }
    if (o.oi > maxPEOI) { maxPEOI = o.oi; maxPEOIStrike = o.strike; }
});

const ltpDataAvailable = totalCEValue > 0 || totalPEValue > 0;
const oiDataAvailable = totalCEOI > 0 || totalPEOI > 0;

// Put-Call ratios
const putCallPremiumRatio = totalCEValue > 0 ? totalPEValue / totalCEValue : 1.0;
const putCallOIRatio = totalCEOI > 0 ? totalPEOI / totalCEOI : 1.0;

// === [WZ-4] MAX PAIN CALCULATION ===
function calculateMaxPain() {
    const allStrikes = [...new Set([
        ...ceOptions.map(o => o.strike),
        ...peOptions.map(o => o.strike)
    ])].sort((a, b) => a - b);

    if (allStrikes.length === 0) return 0;

    let minPain = Infinity;
    let maxPainStrike = allStrikes[Math.floor(allStrikes.length / 2)];

    allStrikes.forEach(testStrike => {
        let totalPain = 0;

        // CE writers' pain: if settlement > strike, CE buyers profit
        ceOptions.forEach(ce => {
            if (testStrike > ce.strike) {
                totalPain += (testStrike - ce.strike) * ce.oi;
            }
        });

        // PE writers' pain: if settlement < strike, PE buyers profit
        peOptions.forEach(pe => {
            if (testStrike < pe.strike) {
                totalPain += (pe.strike - testStrike) * pe.oi;
            }
        });

        if (totalPain < minPain) {
            minPain = totalPain;
            maxPainStrike = testStrike;
        }
    });

    return maxPainStrike;
}

const maxPain = calculateMaxPain();

// === WRITERS ZONE ANALYSIS ===
function analyzeWritersZone() {
    let analysis = {
        zone: 'NEUTRAL', confidence: 0,
        reasoning: [], supportLevels: [], resistanceLevels: [],
        marketStructure: 'BALANCED'
    };

    if (!ltpDataAvailable && !oiDataAvailable) {
        analysis.reasoning.push('⚠️ No LTP or OI data available — market closed or data feed issue');
        return analysis;
    }

    const factor = spotPrice > 20000 ? 100 : 50;

    // === 1. PRICE vs ATM ===
    const diff = spotPrice - atmStrike;
    if (diff > factor) {
        analysis.zone = 'BULLISH'; analysis.confidence += 0.25;
        analysis.reasoning.push(`Price ${diff.toFixed(0)} pts above ATM ${atmStrike}`);
    } else if (diff < -factor) {
        analysis.zone = 'BEARISH'; analysis.confidence += 0.25;
        analysis.reasoning.push(`Price ${Math.abs(diff).toFixed(0)} pts below ATM ${atmStrike}`);
    } else {
        analysis.reasoning.push(`Price near ATM (diff: ${diff.toFixed(0)} pts)`);
    }

    // === 2. [WZ-1 FIX] PREMIUM PCR — CORRECTED INTERPRETATION ===
    // In Indian markets:
    //   High PCR (>1.15) = More PUT premium being paid
    //     → Could mean: heavy PUT writing (writers expect support) = BULLISH
    //     → Or: heavy PUT buying (hedging) — needs OI context
    //   Low PCR (<0.85) = More CALL premium being paid
    //     → Could mean: heavy CALL writing (writers expect resistance) = BEARISH
    //     → Or: heavy CALL buying (speculation) — needs OI context
    //
    // KEY INSIGHT: Premium PCR direction should ALIGN with OI PCR direction.
    // If PUT premium is high AND PUT OI is high → writers are SELLING puts → BULLISH
    // If CALL premium is high AND CALL OI is high → writers are SELLING calls → BEARISH

    if (ltpDataAvailable) {
        if (putCallPremiumRatio > 1.15) {
            // High PCR = heavy PUT activity
            if (putCallOIRatio > 1.0) {
                // High PUT premium + High PUT OI → PUT WRITING (support) → BULLISH
                analysis.marketStructure = 'PUT_WRITING_SUPPORT';
                if (analysis.zone === 'BULLISH') {
                    analysis.confidence += 0.3;
                    analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} + OI PCR ${putCallOIRatio.toFixed(2)} → PUT writing confirms BULLISH`);
                } else {
                    analysis.zone = 'BULLISH';
                    analysis.confidence += 0.2;
                    analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} + OI PCR ${putCallOIRatio.toFixed(2)} → PUT writing → BULLISH bias`);
                }
            } else {
                // High PUT premium but low PUT OI → PUT BUYING (fear/hedging)
                analysis.marketStructure = 'PUT_BUYING_FEAR';
                analysis.confidence += 0.1;
                analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} but low OI PCR → PUT buying (hedging/fear)`);
            }
        } else if (putCallPremiumRatio < 0.85) {
            // Low PCR = heavy CALL activity
            if (putCallOIRatio < 1.0) {
                // High CALL premium + High CALL OI → CALL WRITING (resistance) → BEARISH
                analysis.marketStructure = 'CALL_WRITING_RESISTANCE';
                if (analysis.zone === 'BEARISH') {
                    analysis.confidence += 0.3;
                    analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} + OI PCR ${putCallOIRatio.toFixed(2)} → CALL writing confirms BEARISH`);
                } else {
                    analysis.zone = 'BEARISH';
                    analysis.confidence += 0.2;
                    analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} + OI PCR ${putCallOIRatio.toFixed(2)} → CALL writing → BEARISH bias`);
                }
            } else {
                // Low PCR but high PUT OI → CALL BUYING (bullish speculation)
                analysis.marketStructure = 'CALL_BUYING_BULLISH';
                analysis.confidence += 0.1;
                analysis.reasoning.push(`PCR ${putCallPremiumRatio.toFixed(2)} but high OI PCR → CALL buying (bullish speculation)`);
            }
        } else {
            analysis.reasoning.push(`Balanced PCR: ${putCallPremiumRatio.toFixed(2)}`);
        }
    }

    // === 3. OI-BASED PCR (kept correct — already aligned) ===
    if (oiDataAvailable && !ltpDataAvailable) {
        // Only score OI PCR independently if premium data is unavailable
        if (putCallOIRatio > 1.3) {
            analysis.confidence += 0.2;
            analysis.reasoning.push(`OI PCR ${putCallOIRatio.toFixed(2)} — heavy PE writing (bullish for market)`);
            if (analysis.zone === 'NEUTRAL') { analysis.zone = 'BULLISH'; }
        } else if (putCallOIRatio < 0.7) {
            analysis.confidence += 0.2;
            analysis.reasoning.push(`OI PCR ${putCallOIRatio.toFixed(2)} — heavy CE writing (bearish for market)`);
            if (analysis.zone === 'NEUTRAL') { analysis.zone = 'BEARISH'; }
        } else {
            analysis.reasoning.push(`OI PCR: ${putCallOIRatio.toFixed(2)} (neutral)`);
        }
    }

    // === 4. OI CHANGE TRACKING (new in v2.0) ===
    if (oiDataAvailable) {
        const ceOIBuildUp = totalCEOIChange > 0;
        const peOIBuildUp = totalPEOIChange > 0;

        if (peOIBuildUp && !ceOIBuildUp) {
            analysis.confidence += 0.15;
            analysis.reasoning.push(`PE OI building (+${totalPEOIChange.toFixed(0)}), CE OI flat/declining → market support strengthening`);
        } else if (ceOIBuildUp && !peOIBuildUp) {
            analysis.confidence += 0.15;
            analysis.reasoning.push(`CE OI building (+${totalCEOIChange.toFixed(0)}), PE OI flat/declining → resistance strengthening`);
        } else if (ceOIBuildUp && peOIBuildUp) {
            analysis.reasoning.push(`Both CE & PE OI building → range expansion expected`);
        }
    }

    // === 5. [WZ-2] ATM SKEW (with IV context) ===
    const atmCE = ceOptions.find(o => o.strike === atmStrike);
    const atmPE = peOptions.find(o => o.strike === atmStrike);
    if (atmCE && atmPE && atmPE.ltp > 0 && atmCE.ltp > 0) {
        const premiumSkew = atmCE.ltp / atmPE.ltp;

        if (premiumSkew > 1.15) {
            // CE premium > PE premium at ATM
            // Check IV: if CE IV > PE IV, it's demand-driven (bullish)
            if (atmCE.iv > atmPE.iv) {
                analysis.confidence += 0.1;
                analysis.reasoning.push(`ATM skew ${premiumSkew.toFixed(2)} + higher CE IV → demand-driven bullish`);
            } else {
                analysis.reasoning.push(`ATM skew ${premiumSkew.toFixed(2)} but PE IV higher → mixed signal`);
            }
        } else if (premiumSkew < 0.85) {
            // PE premium > CE premium at ATM
            if (atmPE.iv > atmCE.iv) {
                analysis.confidence += 0.1;
                analysis.reasoning.push(`ATM skew ${premiumSkew.toFixed(2)} + higher PE IV → demand-driven bearish`);
            } else {
                analysis.reasoning.push(`ATM skew ${premiumSkew.toFixed(2)} but CE IV higher → mixed signal`);
            }
        }
    }

    // === 6. MAX PAIN PROXIMITY ===
    if (maxPain > 0) {
        const distToMaxPain = spotPrice - maxPain;
        if (Math.abs(distToMaxPain) < 50) {
            analysis.reasoning.push(`Near Max Pain ${maxPain} (${distToMaxPain > 0 ? '+' : ''}${distToMaxPain.toFixed(0)} pts) → gravitational pull`);
        } else if (distToMaxPain > 100) {
            analysis.reasoning.push(`Above Max Pain ${maxPain} by ${distToMaxPain.toFixed(0)} pts → may face pullback pressure`);
        } else if (distToMaxPain < -100) {
            analysis.reasoning.push(`Below Max Pain ${maxPain} by ${Math.abs(distToMaxPain).toFixed(0)} pts → may face recovery pressure`);
        }
    }

    // === 7. SUPPORT & RESISTANCE (OI-based) ===
    analysis.supportLevels = peOptions
        .filter(o => o.strike <= spotPrice && (o.oi > 0 || o.ltp > 0))
        .sort((a, b) => b.oi - a.oi)
        .slice(0, 3).map(o => o.strike);

    analysis.resistanceLevels = ceOptions
        .filter(o => o.strike >= spotPrice && (o.oi > 0 || o.ltp > 0))
        .sort((a, b) => b.oi - a.oi)
        .slice(0, 3).map(o => o.strike);

    // === FINAL CONFIDENCE CAP ===
    analysis.confidence = Math.min(analysis.confidence, 1.0);

    if (analysis.confidence < 0.3) {
        analysis.zone = 'NEUTRAL';
        analysis.reasoning.push('Insufficient conviction for directional bias');
    }

    return analysis;
}

const writersAnalysis = analyzeWritersZone();

return {
    writersZone: writersAnalysis.zone,
    confidence: Math.round(writersAnalysis.confidence * 100) / 100,
    maxCELTP, maxPELTP, maxCEStrike, maxPEStrike,
    totalCEValue: Math.round(totalCEValue * 100) / 100,
    totalPEValue: Math.round(totalPEValue * 100) / 100,
    totalCEOI,
    totalPEOI,
    totalCEOIChange: Math.round(totalCEOIChange),
    totalPEOIChange: Math.round(totalPEOIChange),
    putCallPremiumRatio: Math.round(putCallPremiumRatio * 100) / 100,
    putCallOIRatio: Math.round(putCallOIRatio * 100) / 100,
    ltpDataAvailable,
    oiDataAvailable,
    supportLevels: writersAnalysis.supportLevels,
    resistanceLevels: writersAnalysis.resistanceLevels,
    reasoning: writersAnalysis.reasoning,
    marketStructure: writersAnalysis.marketStructure,
    maxPain,
    maxCEOIStrike,
    maxPEOIStrike,
    currentPrice: spotPrice,
    atmStrike,
    distanceFromATM: Math.abs(spotPrice - atmStrike),
    underlying: "NIFTY",
    ceOptionsCount: ceOptions.length,
    peOptionsCount: peOptions.length,
    timestamp: new Date().toISOString(),
    analysisVersion: "v2.0"
};
