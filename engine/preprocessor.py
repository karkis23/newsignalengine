# ============================================================
# engine/preprocessor.py
# Feature Engineering — Converts indicators + writers data
# into a structured feature vector for the AI models.
# Version: 4.0.0 | Date: 08 March 2026
#
# This is the "translation layer" between raw indicators and
# the ML model's input. Every feature group maps to a concept
# from your books and strategy list.
# ============================================================

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from .models import RawMarketData

logger = logging.getLogger("preprocessor")

IST = timezone(timedelta(hours=5, minutes=30))


class FeatureEngineer:
    """
    Builds a flat, normalized feature dictionary from indicators + writers zone.
    Feature groups:
      - TREND (EMA, PSAR, SuperTrend, Aroon, ADX, MACD)
      - MOMENTUM (RSI, Stochastic, CCI, MFI)
      - VOLATILITY (ATR, BB, VIX)
      - VOLUME (Volume Profile, OBV, Volume Spike)
      - OPTIONS (PCR, Max Pain, GEX, IV Skew, OI Changes)
      - PATTERN (Candle patterns, Heikin Ashi)
      - SMC (Price Action type, swing breaks)
      - TIME (Time of day, minutes from open, close time proximity)
      - WRITERS (Zone bias score, confidence)
    """

    def __init__(self, payload: RawMarketData, indicators: Dict, writers_zone: Dict):
        self.payload = payload
        self.ind = indicators
        self.wz = writers_zone
        self.ltp = float(payload.spotLTP)
        self.vix = float(payload.vix)
        self.now_ist = datetime.now(IST)

    # -------------------------------------------------------
    # Status → numeric converters
    # -------------------------------------------------------
    def _bullish_bearish(self, status: str, positive: float = 1.0, negative: float = -1.0) -> float:
        s = (status or "").lower()
        if s in ("bullish", "uptrend", "above", "buy", "strong buy", "overbought"): return positive
        if s in ("bearish", "downtrend", "below", "sell", "weak", "oversold"): return negative
        return 0.0

    def _candle_score(self, patterns: List[str]) -> float:
        """
        Score candle patterns:
        +1 = strong bullish, -1 = strong bearish, 0 = doji/no pattern
        """
        score = 0.0
        bullish = {"Hammer", "Bullish Engulfing", "Morning Star", "Bullish Marubozu", "Inverted Hammer"}
        bearish = {"Shooting Star", "Bearish Engulfing", "Evening Star", "Bearish Marubozu", "Hanging Man"}
        for p in patterns:
            if p in bullish: score += 1.0
            elif p in bearish: score -= 1.0
            elif p == "Doji": score += 0.0  # Indecision
        return max(-2.0, min(2.0, score))

    def _time_features(self) -> Dict[str, float]:
        """Time-of-day features (SMC Opening Drive, Late Day Move, etc.)"""
        open_time = self.now_ist.replace(hour=9, minute=15, second=0, microsecond=0)
        close_time = self.now_ist.replace(hour=15, minute=30, second=0, microsecond=0)
        total_mins = (close_time - open_time).seconds / 60  # 375 mins

        mins_from_open = (self.now_ist - open_time).seconds / 60
        mins_to_close = (close_time - self.now_ist).seconds / 60

        # Normalize to [0, 1]
        session_progress = min(1.0, max(0.0, mins_from_open / total_mins))

        is_opening_drive = 1.0 if mins_from_open <= 30 else 0.0   # 9:15–9:45
        is_midday = 1.0 if 60 <= mins_from_open <= 210 else 0.0   # 10:15–12:45
        is_late_session = 1.0 if mins_from_open >= 270 else 0.0   # After 14:00

        return {
            "minutes_from_open": round(mins_from_open, 1),
            "minutes_to_close": round(mins_to_close, 1),
            "session_progress": round(session_progress, 3),
            "is_opening_drive": is_opening_drive,
            "is_midday_session": is_midday,
            "is_late_session": is_late_session,
        }

    # -------------------------------------------------------
    # Build Feature Dictionary
    # -------------------------------------------------------
    def build_features(self) -> Dict[str, float]:
        """
        Returns a flat dict of float features ready for the AI model.
        Feature names are descriptive for easy debugging.
        """
        ind = self.ind
        wz = self.wz
        features = {}

        # ---- TREND GROUP ----
        ema20 = ind.get("EMA20", {})
        sma50 = ind.get("SMA50", {})
        psar = ind.get("ParabolicSAR", {})
        st = ind.get("SuperTrend", {})
        aroon = ind.get("Aroon", {})
        adx = ind.get("ADX", {})

        features["trend_ema20_status"] = self._bullish_bearish(ema20.get("status", ""))
        features["trend_ema20_distance"] = round((self.ltp - float(ema20.get("ema", self.ltp))) / max(self.ltp, 1) * 100, 3)
        features["trend_sma50_status"] = self._bullish_bearish(sma50.get("status", ""))
        features["trend_sma50_distance"] = round((self.ltp - float(sma50.get("sma", self.ltp))) / max(self.ltp, 1) * 100, 3)
        features["trend_psar_status"] = self._bullish_bearish(psar.get("status", ""))
        features["trend_psar_distance"] = round((self.ltp - float(psar.get("value", self.ltp))) / max(self.ltp, 1) * 100, 3)
        features["trend_supertrend_status"] = self._bullish_bearish(st.get("status", ""))
        features["trend_aroon_up"] = float(aroon.get("up", 50)) / 100.0
        features["trend_aroon_down"] = float(aroon.get("down", 50)) / 100.0
        features["trend_aroon_diff"] = (float(aroon.get("up", 50)) - float(aroon.get("down", 50))) / 100.0
        features["trend_adx"] = float(adx.get("value", 0)) / 100.0
        features["trend_adx_plus_di"] = float(adx.get("plusDI", 0)) / 100.0
        features["trend_adx_minus_di"] = float(adx.get("minusDI", 0)) / 100.0
        features["trend_adx_di_diff"] = (float(adx.get("plusDI", 0)) - float(adx.get("minusDI", 0))) / 100.0

        # ---- MACD GROUP ----
        macd = ind.get("MACD", {})
        features["macd_histogram"] = float(macd.get("histogram", 0))
        features["macd_prev_histogram"] = float(macd.get("prev_histogram", 0))
        features["macd_status"] = self._bullish_bearish(macd.get("status", ""))
        # MACD Flip detection
        curr_h = float(macd.get("histogram", 0))
        prev_h = float(macd.get("prev_histogram", 0))
        features["macd_flip_bullish"] = 1.0 if (prev_h < 0 and curr_h > 0) else 0.0
        features["macd_flip_bearish"] = 1.0 if (prev_h > 0 and curr_h < 0) else 0.0
        features["macd_histogram_rising"] = 1.0 if curr_h > prev_h else 0.0

        # ---- MOMENTUM GROUP ----
        rsi = ind.get("RSI", {})
        stoch = ind.get("Stochastic", {})
        cci = ind.get("CCI", {})
        mfi = ind.get("MFI", {})

        rsi_val = float(rsi.get("rsi", 50))
        features["momentum_rsi"] = rsi_val / 100.0
        features["momentum_rsi_overbought"] = 1.0 if rsi_val > 70 else 0.0
        features["momentum_rsi_oversold"] = 1.0 if rsi_val < 30 else 0.0
        features["momentum_rsi_neutral_bullish"] = 1.0 if 55 <= rsi_val <= 70 else 0.0
        features["momentum_rsi_neutral_bearish"] = 1.0 if 30 <= rsi_val <= 45 else 0.0
        features["momentum_stoch"] = float(stoch.get("value", 50)) / 100.0
        features["momentum_cci"] = max(-2.0, min(2.0, float(cci.get("value", 0)) / 100.0))
        features["momentum_mfi"] = float(mfi.get("value", 50)) / 100.0

        # ---- VOLATILITY GROUP ----
        bb = ind.get("BollingerBands", {})
        atr = ind.get("ATR", {})
        vwap_data = ind.get("VWAP", {})

        bb_upper = float(bb.get("upper", self.ltp))
        bb_lower = float(bb.get("lower", self.ltp))
        bb_mid = float(bb.get("middle", self.ltp))
        bb_width = float(bb.get("width", 0))

        features["vol_bb_status"] = self._bullish_bearish(bb.get("status", ""))
        features["vol_bb_position"] = round((self.ltp - bb_lower) / max(bb_upper - bb_lower, 1), 3)
        features["vol_bb_width"] = bb_width / 10.0  # Normalize: typical range 0–10%
        features["vol_atr"] = float(atr.get("value", 0)) / max(self.ltp, 1) * 100
        features["vol_vix"] = self.vix / 50.0   # Normalize (VIX typically 10–50)
        features["vol_vix_extreme"] = 1.0 if self.vix >= 25 else 0.0
        features["vol_vwap_status"] = self._bullish_bearish(vwap_data.get("status", ""))
        vwap_val = float(vwap_data.get("value", self.ltp))
        features["vol_vwap_distance"] = round((self.ltp - vwap_val) / max(vwap_val, 1) * 100, 3)

        # ---- VOLUME GROUP ----
        vol_spike = ind.get("VolumeSpike", {})
        vol_profile = ind.get("VolumeProfile", {})
        ha = ind.get("HeikinAshi", {})

        features["volume_spike"] = 1.0 if vol_spike.get("spike") else 0.0
        features["volume_ratio"] = min(5.0, float(vol_spike.get("ratio", 1.0)))
        poc = float(vol_profile.get("poc", self.ltp))
        vah = float(vol_profile.get("vah", self.ltp))
        val = float(vol_profile.get("val", self.ltp))
        features["volume_above_poc"] = 1.0 if self.ltp > poc else -1.0
        features["volume_poc_distance"] = round((self.ltp - poc) / max(poc, 1) * 100, 3)
        features["volume_in_value_area"] = 1.0 if val <= self.ltp <= vah else 0.0
        features["ha_trend"] = self._bullish_bearish(ha.get("trend", ""))
        features["ha_consecutive"] = min(10.0, float(ha.get("consecutive", 0))) / 10.0

        # ---- OPTIONS / WRITERS GROUP ----
        gex = wz.get("gammaExposure", {})
        iv_skew = wz.get("ivSkew", {})

        features["options_pcr_premium"] = min(3.0, float(wz.get("putCallPremiumRatio", 1.0)))
        features["options_pcr_oi"] = min(3.0, float(wz.get("putCallOIRatio", 1.0)))
        features["options_writers_zone"] = self._bullish_bearish(wz.get("writersZone", "NEUTRAL"))
        features["options_writers_confidence"] = float(wz.get("confidence", 0))
        features["options_max_pain"] = float(wz.get("maxPain", self.ltp))
        mp = float(wz.get("maxPain", self.ltp))
        features["options_max_pain_distance"] = round((self.ltp - mp) / max(mp, 1) * 100, 3)
        features["options_gex_positive"] = 1.0 if gex.get("regime") == "POSITIVE_GEX" else -1.0
        features["options_iv_skew"] = max(-10.0, min(10.0, float(iv_skew.get("skew", 0))))
        ce_oi_chg = float(wz.get("totalCEOIChange", 0))
        pe_oi_chg = float(wz.get("totalPEOIChange", 0))
        features["options_ce_oi_change_direction"] = 1.0 if ce_oi_chg > 0 else (-1.0 if ce_oi_chg < 0 else 0.0)
        features["options_pe_oi_change_direction"] = 1.0 if pe_oi_chg > 0 else (-1.0 if pe_oi_chg < 0 else 0.0)

        # ---- PATTERN GROUP ----
        features["pattern_candle_score"] = self._candle_score(ind.get("CandlePatterns", []))

        # ---- SMC GROUP ----
        pa = ind.get("PriceAction", {})
        features["smc_price_action_score"] = float(pa.get("score", 0)) / 2.0  # Normalize to [-1, 1]
        features["smc_is_breakout"] = 1.0 if pa.get("type") == "Breakout" else 0.0
        features["smc_is_breakdown"] = 1.0 if pa.get("type") == "Breakdown" else 0.0
        features["smc_is_ranging"] = 1.0 if pa.get("type") == "Ranging" else 0.0

        # ---- TIME GROUP ----
        time_f = self._time_features()
        features.update(time_f)

        # ---- CANDLE COUNT / DATA QUALITY ----
        features["data_candle_count"] = min(200, int(ind.get("candleCount", 0))) / 200.0
        features["data_today_candle_count"] = min(80, int(ind.get("todayCandleCount", 0))) / 80.0

        return features
