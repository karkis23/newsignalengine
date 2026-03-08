# ============================================================
# engine/rule_engine.py
# Rules-Based Signal Engine — Python port of Signal Code v3.0
# This runs when the AI model is NOT yet trained.
# Version: 4.0.0 | Date: 08 March 2026
#
# Faithful port of all 25 logic steps from v3.0 JS, with:
#  - All scoring weights preserved
#  - All VIX graduated scaling preserved
#  - All ADX/streak/ORB logic preserved
#  - Memory state now handled server-side (no n8n $getWorkflowStaticData)
# ============================================================

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from engine.models import RawMarketData

logger = logging.getLogger("rule_engine")

IST = timezone(timedelta(hours=5, minutes=30))

# ---- Memory State (server-side singleton) ----
# In production, consider Redis for multi-instance deployments.
_MEMORY: Dict[str, Any] = {
    "lastSignal": None,
    "prevMACDHist": None,
    "streakSignal": None,
    "streakCount": 0,
    "lastFireTime": None,
    "lastTradeDate": None,
    "prevLTP": None,
    "prevRSI": None,
    "prevADX": None,
    "orbHigh": None,
    "orbLow": None,
    "orbBarCount": 0,
    "orbSet": False,
    "ltpHistory": [],
    "rsiHistory": [],
    "lastVWAP": None,
    "vwapStuckCount": 0,
    "firedSignalDirection": None,
    "consecutiveWaits": 0,
    "firstBarOfDay": True,
}

# ---- Constants ----
BUY_CE_THRESHOLD = 25
BUY_PE_THRESHOLD = -25
MIN_STREAK = 2
ADX_BOOST_MIN_SCORE = 5
REPEAT_CLEAR_AFTER_WAITS = 3
OPENING_BUFFER_MINUTES = 30
ORB_BARS = 3
WRITERS_WEIGHT = 12.0


class RulesEngine:
    """
    Faithful Python port of Signal Engine v3.0 (25-step logic).
    Used as fallback when the AI model is not yet trained.
    """

    def predict(
        self,
        indicators: Dict,
        writers_zone: Dict,
        payload: RawMarketData
    ) -> Dict:
        """
        Main entry point. Runs the v3.0 scoring logic.
        Returns a SignalResponse-compatible dict.
        """
        global _MEMORY

        now_ist = datetime.now(IST)
        session_date = now_ist.strftime("%Y-%m-%d")
        time_str = now_ist.strftime("%H:%M")
        minutes_from_open = (now_ist.hour * 60 + now_ist.minute) - (9 * 60 + 15)
        minutes_from_open = max(0, minutes_from_open)

        ltp = float(payload.spotLTP)
        vix = float(payload.vix)
        reason_parts: List[str] = []
        debug_flags: List[str] = []
        ai_insights: List[str] = []

        # ---- Safely extract indicators ----
        rsi_val = float(indicators.get("RSI", {}).get("rsi", 50))
        ema20_status = indicators.get("EMA20", {}).get("status", "Neutral")
        sma50_status = indicators.get("SMA50", {}).get("status", "Neutral")
        macd = indicators.get("MACD", {})
        macd_hist = float(macd.get("histogram", 0))
        prev_macd_hist = float(macd.get("prev_histogram", 0))
        macd_status = macd.get("status", "Neutral")
        adx_val = float(indicators.get("ADX", {}).get("value", 0))
        plus_di = float(indicators.get("ADX", {}).get("plusDI", 0))
        minus_di = float(indicators.get("ADX", {}).get("minusDI", 0))
        supertrend_status = indicators.get("SuperTrend", {}).get("status", "Neutral")
        psar_status = indicators.get("ParabolicSAR", {}).get("status", "Neutral")
        aroon_status = indicators.get("Aroon", {}).get("status", "Neutral")
        aroon_up = float(indicators.get("Aroon", {}).get("up", 50))
        aroon_down = float(indicators.get("Aroon", {}).get("down", 50))
        stoch_val = float(indicators.get("Stochastic", {}).get("value", 50))
        stoch_status = indicators.get("Stochastic", {}).get("status", "Neutral")
        bb_status = indicators.get("BollingerBands", {}).get("status", "Within Bands")
        bb_width = float(indicators.get("BollingerBands", {}).get("width", 0))
        cci_val = float(indicators.get("CCI", {}).get("value", 0))
        mfi_val = float(indicators.get("MFI", {}).get("value", 50))
        vwap_status = indicators.get("VWAP", {}).get("status", "Neutral")
        vol_spike = indicators.get("VolumeSpike", {})
        vol_ratio = float(vol_spike.get("ratio", 1.0))
        candle_patterns = indicators.get("CandlePatterns", [])
        price_action = indicators.get("PriceAction", {})
        pa_type = price_action.get("type", "Ranging")

        writers_zone_val = writers_zone.get("writersZone", "NEUTRAL")
        writers_conf = float(writers_zone.get("confidence", 0))
        pcr_oi = float(writers_zone.get("putCallOIRatio", 1.0))

        # ===================================
        # STEP 1: Daily Reset
        # ===================================
        if _MEMORY["lastTradeDate"] != session_date:
            logger.info(f"🌅 Daily reset for {session_date}")
            _MEMORY.update({
                "lastSignal": None, "prevMACDHist": None,
                "streakSignal": None, "streakCount": 0,
                "prevLTP": None, "prevRSI": None, "prevADX": None,
                "orbHigh": None, "orbLow": None, "orbBarCount": 0, "orbSet": False,
                "ltpHistory": [], "rsiHistory": [],
                "lastVWAP": None, "vwapStuckCount": 0,
                "firedSignalDirection": None, "consecutiveWaits": 0,
                "firstBarOfDay": True, "lastTradeDate": session_date
            })

        # ===================================
        # STEP 2: LTP Guard
        # ===================================
        if ltp == 0:
            return self._make_response("ERROR", "DATA_FAILURE", 0, "LTP = 0 (data failure)", 0, vix, indicators, writers_zone, debug_flags)

        # ===================================
        # STEP 3: Market Hours Gate
        # ===================================
        market_open_min = 9 * 60 + 15
        market_close_min = 15 * 60 + 30
        current_min = now_ist.hour * 60 + now_ist.minute

        if not (market_open_min <= current_min <= market_close_min):
            return self._make_response("MARKET_CLOSED", "OFF_MARKET", 0, "Outside trading hours", 0, vix, indicators, writers_zone, debug_flags)

        # ===================================
        # STEP 4: ORB Tracking (first 3 bars)
        # ===================================
        if not _MEMORY["orbSet"] and _MEMORY["orbBarCount"] < ORB_BARS:
            if _MEMORY["orbHigh"] is None or ltp > _MEMORY["orbHigh"]:
                _MEMORY["orbHigh"] = ltp
            if _MEMORY["orbLow"] is None or ltp < _MEMORY["orbLow"]:
                _MEMORY["orbLow"] = ltp
            _MEMORY["orbBarCount"] += 1
            if _MEMORY["orbBarCount"] >= ORB_BARS:
                _MEMORY["orbSet"] = True
                logger.info(f"📏 ORB set: {_MEMORY['orbLow']} — {_MEMORY['orbHigh']}")

        orb_range = {"high": _MEMORY["orbHigh"], "low": _MEMORY["orbLow"]} if _MEMORY["orbSet"] else None

        # ===================================
        # STEP 5: Opening Buffer (no signals before 9:45)
        # ===================================
        if minutes_from_open < OPENING_BUFFER_MINUTES:
            return self._make_response("WAIT", "OPENING_BUFFER", 0, f"Opening buffer — {OPENING_BUFFER_MINUTES - minutes_from_open:.0f} min remaining", 0, vix, indicators, writers_zone, debug_flags, orb_range)

        # ===================================
        # STEP 6: VIX Graduated Scaling
        # ===================================
        vix_multiplier = 1.0
        if vix >= 25:
            return self._make_response("AVOID", "HIGH_VOLATILITY", 0, f"AVOID: VIX {vix:.1f} >= 25", 0, vix, indicators, writers_zone, debug_flags, orb_range)
        elif vix >= 22:
            vix_multiplier = 0.3; debug_flags.append("VIX_22_SCALE_0.3")
        elif vix >= 20:
            vix_multiplier = 0.5; debug_flags.append("VIX_20_SCALE_0.5")
        elif vix >= 18:
            vix_multiplier = 0.7; debug_flags.append("VIX_18_SCALE_0.7")

        # ===================================
        # STEP 7: ADX Sideways Filter
        # ===================================
        if adx_val < 20 and pa_type == "Ranging":
            return self._make_response("SIDEWAYS", "SIDEWAYS_RANGING", 0, f"ADX {adx_val:.1f} < 20 + Ranging price action", 0, vix, indicators, writers_zone, debug_flags, orb_range)

        # ===================================
        # STEP 8: Score Indicators
        # ===================================
        score = 0.0

        # MACD — Flip vs continuation vs crossover
        if _MEMORY["firstBarOfDay"]:
            _MEMORY["firstBarOfDay"] = False  # Skip MACD flip on day open (gap risk)
        else:
            prev_hist = _MEMORY["prevMACDHist"] if _MEMORY["prevMACDHist"] is not None else prev_macd_hist
            if prev_hist < 0 and macd_hist > 0:
                score += 12; reason_parts.append("MACD BULLISH FLIP")
                debug_flags.append("MACD_FLIP_BULLISH")
            elif prev_hist > 0 and macd_hist < 0:
                score -= 12; reason_parts.append("MACD BEARISH FLIP")
                debug_flags.append("MACD_FLIP_BEARISH")
            elif macd_hist > 0 and macd_hist > prev_hist:
                score += 6; reason_parts.append("MACD Rising")
            elif macd_hist < 0 and macd_hist < prev_hist:
                score -= 6; reason_parts.append("MACD Declining")
            elif macd_status == "Bullish":
                score += 4; reason_parts.append("MACD Above Signal")
            elif macd_status == "Bearish":
                score -= 4; reason_parts.append("MACD Below Signal")

        # EMA20 — highest accuracy
        if ema20_status == "Bullish":
            score += 12; reason_parts.append("EMA20 Bullish")
        elif ema20_status == "Bearish":
            score -= 12; reason_parts.append("EMA20 Bearish")

        # PSAR
        if psar_status == "Bullish":
            score += 10; reason_parts.append("PSAR Bullish")
        elif psar_status == "Bearish":
            score -= 10; reason_parts.append("PSAR Bearish")

        # SuperTrend — cross-validated against EMA + PSAR
        st_validated = (ema20_status == supertrend_status and psar_status == supertrend_status)
        if supertrend_status == "Bullish":
            score += 8 if st_validated else 3
            reason_parts.append("SuperTrend Bullish" + (" (validated)" if st_validated else " (unvalidated)"))
        elif supertrend_status == "Bearish":
            score -= 8 if st_validated else 3
            reason_parts.append("SuperTrend Bearish" + (" (validated)" if st_validated else " (unvalidated)"))

        # SMA50
        if sma50_status == "Bullish":
            score += 5; reason_parts.append("SMA50 Bullish")
        elif sma50_status == "Bearish":
            score -= 5; reason_parts.append("SMA50 Bearish")

        # RSI
        if rsi_val < 30:
            score += 8; reason_parts.append(f"RSI Oversold ({rsi_val:.1f})")
        elif rsi_val > 70:
            score -= 8; reason_parts.append(f"RSI Overbought ({rsi_val:.1f})")
        elif 55 <= rsi_val <= 65:
            score += 3; reason_parts.append(f"RSI Neutral-Bullish ({rsi_val:.1f})")
        elif 35 <= rsi_val <= 45:
            score -= 3; reason_parts.append(f"RSI Neutral-Bearish ({rsi_val:.1f})")

        # RSI Divergence
        _MEMORY["ltpHistory"].append(ltp)
        _MEMORY["rsiHistory"].append(rsi_val)
        if len(_MEMORY["ltpHistory"]) > 20: _MEMORY["ltpHistory"] = _MEMORY["ltpHistory"][-20:]
        if len(_MEMORY["rsiHistory"]) > 20: _MEMORY["rsiHistory"] = _MEMORY["rsiHistory"][-20:]
        if len(_MEMORY["ltpHistory"]) >= 6:
            prev_ltp_min = min(_MEMORY["ltpHistory"][-6:-1])
            prev_rsi_min = min(_MEMORY["rsiHistory"][-6:-1])
            if ltp < prev_ltp_min and rsi_val > prev_rsi_min:
                score += 10; reason_parts.append("RSI Bullish Divergence"); debug_flags.append("RSI_DIVERGENCE_BULLISH")
            prev_ltp_max = max(_MEMORY["ltpHistory"][-6:-1])
            prev_rsi_max = max(_MEMORY["rsiHistory"][-6:-1])
            if ltp > prev_ltp_max and rsi_val < prev_rsi_max:
                score -= 10; reason_parts.append("RSI Bearish Divergence"); debug_flags.append("RSI_DIVERGENCE_BEARISH")

        # VWAP — stuck detection
        if vwap_status == _MEMORY["lastVWAP"]:
            _MEMORY["vwapStuckCount"] += 1
        else:
            _MEMORY["vwapStuckCount"] = 0
        _MEMORY["lastVWAP"] = vwap_status

        if _MEMORY["vwapStuckCount"] < 20:
            if vwap_status == "Above":
                score += 6; reason_parts.append("VWAP Above")
            elif vwap_status == "Below":
                score -= 6; reason_parts.append("VWAP Below")
        else:
            debug_flags.append("VWAP_STUCK_IGNORED")

        # Aroon
        if aroon_status == "Uptrend":
            score += 8; reason_parts.append(f"Aroon Uptrend ({aroon_up:.0f}/{aroon_down:.0f})")
        elif aroon_status == "Downtrend":
            score -= 8; reason_parts.append(f"Aroon Downtrend ({aroon_up:.0f}/{aroon_down:.0f})")

        # Stochastic (trend-filtered)
        is_uptrend = (ema20_status == "Bullish" and supertrend_status == "Bullish")
        is_downtrend = (ema20_status == "Bearish" and supertrend_status == "Bearish")
        if stoch_status == "Oversold":
            score += 5; reason_parts.append(f"Stochastic Oversold ({stoch_val:.0f})")
        elif stoch_status == "Overbought":
            if is_uptrend:
                score += 2; reason_parts.append("Stochastic OB in Uptrend (ignored)")
            else:
                score -= 5; reason_parts.append(f"Stochastic Overbought ({stoch_val:.0f})")

        # Bollinger Bands + Squeeze
        if bb_width < 2.0:
            debug_flags.append("BB_SQUEEZE")
        if bb_status == "Breakout Up":
            score += 6; reason_parts.append("BB Breakout Up")
        elif bb_status == "Breakout Down":
            score -= 6; reason_parts.append("BB Breakout Down")

        # CCI
        if cci_val > 100:
            score += 3; reason_parts.append(f"CCI Bullish ({cci_val:.0f})")
        elif cci_val < -100:
            score -= 3; reason_parts.append(f"CCI Bearish ({cci_val:.0f})")

        # MFI
        if mfi_val > 80:
            score += 2
        elif mfi_val < 20:
            score -= 2

        # ORB Breakout
        if orb_range and orb_range["high"] and orb_range["low"]:
            orb_h = orb_range["high"]
            orb_l = orb_range["low"]
            if ltp > orb_h:
                score += 12; reason_parts.append(f"ORB Breakout Above {orb_h:.0f}"); debug_flags.append("ORB_BREAKOUT")
            elif ltp < orb_l:
                score -= 12; reason_parts.append(f"ORB Breakdown Below {orb_l:.0f}"); debug_flags.append("ORB_BREAKDOWN")

        # ===================================
        # STEP 15: OI PCR Scoring
        # ===================================
        if pcr_oi > 1.3:
            score += 4; reason_parts.append(f"PCR OI Bullish ({pcr_oi:.2f})")
        elif pcr_oi < 0.7:
            score -= 4; reason_parts.append(f"PCR OI Bearish ({pcr_oi:.2f})")

        # ===================================
        # STEP 16: Writers Zone Scoring
        # ===================================
        if writers_zone_val == "BULLISH":
            score += writers_conf * WRITERS_WEIGHT; reason_parts.append(f"Writers Bullish (conf={writers_conf:.2f})")
        elif writers_zone_val == "BEARISH":
            score -= writers_conf * WRITERS_WEIGHT; reason_parts.append(f"Writers Bearish (conf={writers_conf:.2f})")

        # ===================================
        # STEP 17: ADX Bonus/Penalty
        # ===================================
        if adx_val >= 25 and abs(score) >= ADX_BOOST_MIN_SCORE:
            adx_boost = 8 if score > 0 else -8
            score += adx_boost; reason_parts.append(f"ADX Boost ({adx_val:.1f})")

        # ===================================
        # STEP 18: Volume Scoring
        # ===================================
        # Phantom flip guard: only score volume if it's driving a consistent direction
        if vol_ratio > 1.5 and abs(score) >= 3:
            vol_pts = 5 if score > 0 else -5
            score += vol_pts; reason_parts.append(f"Volume Confirmation ({vol_ratio:.1f}x)")

        # ===================================
        # STEP 19: Candle Patterns
        # ===================================
        bullish_patterns = {"Hammer", "Bullish Engulfing", "Morning Star", "Bullish Marubozu"}
        bearish_patterns = {"Shooting Star", "Bearish Engulfing", "Evening Star", "Bearish Marubozu"}
        for p in candle_patterns:
            if p in bullish_patterns:
                score += 5; reason_parts.append(f"Candle: {p}")
            elif p in bearish_patterns:
                score -= 5; reason_parts.append(f"Candle: {p}")
            elif p == "Doji":
                score *= 0.95  # Slight confidence reduction

        # ===================================
        # STEP 20: Trend Exhaustion
        # ===================================
        prev_adx = _MEMORY.get("prevADX")
        exhaustion_multiplier = 1.0
        if prev_adx and prev_adx > 40 and adx_val < prev_adx:
            exhaustion_multiplier = 0.7
            debug_flags.append("TREND_EXHAUSTION")
            reason_parts.append("Trend Exhaustion Detected")
        _MEMORY["prevADX"] = adx_val

        # ===================================
        # STEP 21–22: Combined Multiplier
        # ===================================
        combined_multiplier = max(0.3, vix_multiplier * exhaustion_multiplier)
        score = score * combined_multiplier

        # ===================================
        # STEP 22: Time-of-Day Penalty (after 14:30)
        # ===================================
        if current_min >= 14 * 60 + 30:
            score = score * 0.7
            debug_flags.append("LATE_DAY_PENALTY")

        score = round(score, 2)

        # ===================================
        # STEP 23: Determine Raw Signal
        # ===================================
        if score >= BUY_CE_THRESHOLD:
            raw_signal = "BUY CALL (CE)"
        elif score <= BUY_PE_THRESHOLD:
            raw_signal = "BUY PUT (PE)"
        else:
            raw_signal = "WAIT"

        # ===================================
        # STEP 23 cont: Streak Check
        # ===================================
        if raw_signal == _MEMORY["streakSignal"] and raw_signal != "WAIT":
            _MEMORY["streakCount"] += 1
        else:
            _MEMORY["streakSignal"] = raw_signal
            _MEMORY["streakCount"] = 1

        streak_count = _MEMORY["streakCount"]
        streak_confirmed = streak_count >= MIN_STREAK

        # ===================================
        # STEP 24: Repeat Protection
        # ===================================
        blocked_reason = ""
        final_signal = raw_signal

        if raw_signal in ("BUY CALL (CE)", "BUY PUT (PE)"):
            if not streak_confirmed:
                final_signal = "WAIT"
                blocked_reason = f"Streak not confirmed ({streak_count}/{MIN_STREAK})"
            elif _MEMORY["firedSignalDirection"] and _MEMORY["firedSignalDirection"] == raw_signal:
                final_signal = "WAIT"
                blocked_reason = f"Repeat signal blocked (already fired {_MEMORY['firedSignalDirection']})"
            else:
                _MEMORY["firedSignalDirection"] = raw_signal
                _MEMORY["consecutiveWaits"] = 0
                _MEMORY["lastFireTime"] = now_ist.isoformat()

        if raw_signal == "WAIT":
            _MEMORY["consecutiveWaits"] += 1
            if _MEMORY["consecutiveWaits"] >= REPEAT_CLEAR_AFTER_WAITS:
                _MEMORY["firedSignalDirection"] = None
                debug_flags.append("REPEAT_LOCK_CLEARED")

        # Update memory
        _MEMORY["prevMACDHist"] = macd_hist
        _MEMORY["lastSignal"] = final_signal
        _MEMORY["prevLTP"] = ltp
        _MEMORY["prevRSI"] = rsi_val

        # ===================================
        # STEP 25: Regime Classification
        # ===================================
        regime = self._classify_regime(vix, adx_val, supertrend_status, ema20_status, pa_type)

        # ===================================
        # AI Insights (rule-based, for logging)
        # ===================================
        ai_insights = self._generate_insights(
            score, adx_val, vix, orb_range, ltp,
            writers_zone, debug_flags, pa_type
        )

        macd_flip = "NONE"
        if "MACD_FLIP_BULLISH" in debug_flags: macd_flip = "BULLISH_FLIP"
        elif "MACD_FLIP_BEARISH" in debug_flags: macd_flip = "BEARISH_FLIP"

        return self._make_response(
            final_signal, regime, score, " | ".join(reason_parts),
            streak_count, vix, indicators, writers_zone, debug_flags,
            orb_range, vix_multiplier, combined_multiplier,
            raw_signal, blocked_reason, streak_confirmed,
            supertrend_status, st_validated, macd_flip,
            session_date, rsi_val, macd_hist, vol_ratio,
            ai_insights
        )

    def _classify_regime(self, vix, adx, st_status, ema_status, pa_type) -> str:
        if vix >= 25: return "HIGH_VOLATILITY"
        if adx < 20 and pa_type == "Ranging": return "SIDEWAYS_RANGING"
        if adx < 20: return "SIDEWAYS_WEAK_TREND"
        if st_status == "Bullish" and ema_status == "Bullish": return "STRONG_BULLISH"
        if st_status == "Bearish" and ema_status == "Bearish": return "STRONG_BEARISH"
        if ema_status == "Bullish": return "BULLISH_TREND"
        if ema_status == "Bearish": return "BEARISH_TREND"
        return "MIXED"

    def _generate_insights(self, score, adx, vix, orb_range, ltp, writers_zone, flags, pa_type) -> List[str]:
        insights = []
        if orb_range and orb_range.get("high"):
            if ltp > orb_range["high"]:
                insights.append(f"SMC: Price broke above Opening Range ({orb_range['high']:.0f}) — Opening Drive up")
            elif ltp < orb_range["low"]:
                insights.append(f"SMC: Price broke below Opening Range ({orb_range['low']:.0f}) — Opening Drive down")
        if "BB_SQUEEZE" in flags:
            insights.append("Volatility: Bollinger Band Squeeze — breakout imminent")
        if "TREND_EXHAUSTION" in flags:
            insights.append("Caution: Trend Exhaustion (ADX was >40, now declining)")
        if pa_type in ("Breakout", "Breakdown"):
            insights.append(f"Price Action: {pa_type} detected — structural break")
        if writers_zone.get("writersZone") in ("BULLISH", "BEARISH"):
            gex = writers_zone.get("gammaExposure", {})
            insights.append(f"Options: Writers Zone {writers_zone['writersZone']} | GEX {gex.get('regime', 'UNKNOWN')}")
        mp = writers_zone.get("maxPain", 0)
        if mp > 0:
            dist = ltp - mp
            if abs(dist) < 50:
                insights.append(f"Options Pinning: Spot near Max Pain {mp:.0f} — expect range compression")
        return insights

    def _make_response(
        self, final_signal, regime, confidence, reason,
        streak_count, vix, indicators, writers_zone, debug_flags,
        orb_range=None, vix_multiplier=1.0, combined_multiplier=1.0,
        raw_signal=None, blocked_reason="", streak_confirmed=False,
        supertrend_status="Neutral", st_validated=False, macd_flip="NONE",
        session_date=None, rsi_val=50.0, macd_hist=0.0, vol_ratio=1.0,
        ai_insights=None
    ) -> Dict:
        return {
            "finalSignal": final_signal,
            "rawSignal": raw_signal or final_signal,
            "confidence": confidence,
            "blockedReason": blocked_reason,
            "regime": regime,
            "ADX": float(indicators.get("ADX", {}).get("value", 0)),
            "RSI": rsi_val,
            "VIX": vix,
            "MACDFlip": macd_flip,
            "SuperTrend": supertrend_status,
            "SuperTrendValidated": st_validated,
            "writersZone": writers_zone.get("writersZone", "NEUTRAL"),
            "writersConfidence": float(writers_zone.get("confidence", 0)),
            "maxPain": float(writers_zone.get("maxPain", 0)),
            "putCallOIRatio": float(writers_zone.get("putCallOIRatio", 1.0)),
            "putCallPremiumRatio": float(writers_zone.get("putCallPremiumRatio", 1.0)),
            "maxCEOIStrike": float(writers_zone.get("maxCEOIStrike", 0)),
            "maxPEOIStrike": float(writers_zone.get("maxPEOIStrike", 0)),
            "gammaExposure": writers_zone.get("gammaExposure"),
            "ivSkew": writers_zone.get("ivSkew"),
            "orbRange": orb_range,
            "Momentum": macd_hist,
            "VolumeRatio": vol_ratio,
            "streakCount": streak_count,
            "streakConfirmed": streak_confirmed,
            "lastSignal": _MEMORY.get("lastSignal"),
            "lastFireTime": _MEMORY.get("lastFireTime"),
            "vixMultiplier": vix_multiplier,
            "combinedMultiplier": combined_multiplier,
            "reason": reason,
            "debugFlags": debug_flags,
            "ai_insights": ai_insights or [],
            "sessionDate": session_date,
            "candlePatterns": indicators.get("CandlePatterns", []),
            "PA_Type": indicators.get("PriceAction", {}).get("type", "Ranging"),
            "MACD_status": indicators.get("MACD", {}).get("status", "Neutral")
        }
