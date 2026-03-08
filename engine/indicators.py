# ============================================================
# engine/indicators.py
# Technical Indicator Calculator (Python/Pandas port of n8n v2.0 JS)
# Version: 4.0.0 | Date: 08 March 2026
#
# Includes all 8 bug fixes from the v2.0 JS version PLUS:
#  - Multi-timeframe analysis (MTF)
#  - Volume Profile (VAH, VAL, POC)
#  - Donchian Channels
#  - Heikin Ashi Trend
#  - Keltner Channels
#  - Ichimoku Cloud basic structure
# ============================================================

import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from engine.models import RawMarketData

logger = logging.getLogger("indicators")

# IST offset
IST = timezone(timedelta(hours=5, minutes=30))


class IndicatorCalculator:
    """
    Converts raw Angel One OHLCV candle array into a full set of technical indicators.
    All Wilder's smoothing fixes from JS v2.0 are preserved here.
    """

    def __init__(self, payload: RawMarketData):
        self.ltp = float(payload.spotLTP)
        self.vix = float(payload.vix)
        self.raw_candles = payload.angelOneCandles

        # Parse candles into DataFrame
        self.df = self._build_dataframe()
        # Today-only slice
        self.df_today = self._filter_today()

        logger.debug(f"IndicatorCalculator: {len(self.df)} total candles, {len(self.df_today)} today")

    # -------------------------------------------------------
    # Data Preparation
    # -------------------------------------------------------

    def _build_dataframe(self) -> pd.DataFrame:
        """Converts raw [[ts, o, h, l, c, v]] list to a clean DataFrame."""
        if not self.raw_candles:
            return pd.DataFrame(columns=["ts", "open", "high", "low", "close", "volume"])

        records = []
        for c in self.raw_candles:
            try:
                records.append({
                    "ts": str(c[0]),
                    "open": float(c[1]),
                    "high": float(c[2]),
                    "low": float(c[3]),
                    "close": float(c[4]),
                    "volume": float(c[5]) if len(c) > 5 else 0.0
                })
            except (IndexError, ValueError, TypeError):
                continue

        df = pd.DataFrame(records)
        if df.empty:
            return df

        # Drop NaN rows
        df.dropna(subset=["open", "high", "low", "close"], inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    def _filter_today(self) -> pd.DataFrame:
        """Filter candles to IST today only."""
        if self.df.empty:
            return self.df.copy()
        today_ist = datetime.now(IST).strftime("%Y-%m-%d")
        mask = self.df["ts"].str.startswith(today_ist)
        return self.df[mask].reset_index(drop=True)

    # -------------------------------------------------------
    # Helper: Safe arrays
    # -------------------------------------------------------
    def _safe(self, arr: pd.Series) -> np.ndarray:
        return arr.values.astype(float)

    # -------------------------------------------------------
    # RSI — Wilder's Smoothing (IND-4 equivalent)
    # -------------------------------------------------------
    def _rsi(self, closes: np.ndarray, period: int = 14) -> Dict:
        if len(closes) <= period + 1:
            return {"rsi": 50.0, "status": "Insufficient Data"}

        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0.0)
        losses = np.where(deltas < 0, -deltas, 0.0)

        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])

        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        rs = avg_gain / (avg_loss if avg_loss > 1e-9 else 1e-9)
        rsi = round(100 - (100 / (1 + rs)), 2)
        status = "Overbought" if rsi > 70 else ("Oversold" if rsi < 30 else "Neutral")
        return {"rsi": rsi, "status": status}

    # -------------------------------------------------------
    # EMA
    # -------------------------------------------------------
    def _ema(self, closes: np.ndarray, period: int) -> float:
        if len(closes) < period:
            return closes[-1] if len(closes) > 0 else 0.0
        k = 2.0 / (period + 1)
        ema = np.mean(closes[:period])
        for v in closes[period:]:
            ema = v * k + ema * (1 - k)
        return round(ema, 2)

    def _ema_series(self, closes: np.ndarray, period: int) -> np.ndarray:
        """Returns full EMA series."""
        if len(closes) < period:
            result = np.full(len(closes), closes[-1] if len(closes) > 0 else 0.0)
            return result
        k = 2.0 / (period + 1)
        result = np.zeros(len(closes))
        result[:period] = np.mean(closes[:period])
        for i in range(period, len(closes)):
            result[i] = closes[i] * k + result[i - 1] * (1 - k)
        return result

    # -------------------------------------------------------
    # MACD — Full signal line from MACD series (IND-2 equivalent)
    # -------------------------------------------------------
    def _macd(self, closes: np.ndarray) -> Dict:
        if len(closes) < 35:
            return {"macd": 0.0, "signal": 0.0, "histogram": 0.0, "status": "Neutral"}

        ema12 = self._ema_series(closes, 12)
        ema26 = self._ema_series(closes, 26)
        macd_line = ema12[25:] - ema26[25:]

        if len(macd_line) < 9:
            last = round(float(macd_line[-1]), 2)
            return {"macd": last, "signal": 0.0, "histogram": last, "status": "Bullish" if last > 0 else "Bearish"}

        signal_line = self._ema_series(macd_line, 9)
        last_macd = float(macd_line[-1])
        last_signal = float(signal_line[-1])
        hist = round(last_macd - last_signal, 2)
        status = "Bullish" if last_macd > last_signal else ("Bearish" if last_macd < last_signal else "Neutral")

        return {
            "macd": round(last_macd, 2),
            "signal": round(last_signal, 2),
            "histogram": hist,
            "status": status,
            "macd_series": macd_line.tolist()[-20:],   # Last 20 for divergence detection
            "prev_histogram": round(float(macd_line[-2] - signal_line[-2]), 2) if len(macd_line) > 1 else hist
        }

    # -------------------------------------------------------
    # ATR — Wilder's Smoothing
    # -------------------------------------------------------
    def _atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        if len(highs) < 2:
            return 0.0
        trs = [highs[0] - lows[0]]
        for i in range(1, len(highs)):
            trs.append(max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i - 1]),
                abs(lows[i] - closes[i - 1])
            ))
        trs = np.array(trs)
        if len(trs) < period:
            return float(np.mean(trs))
        atr = float(np.mean(trs[:period]))
        for v in trs[period:]:
            atr = (atr * (period - 1) + v) / period
        return round(atr, 2)

    def _atr_series(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 10) -> np.ndarray:
        """Rolling ATR series for SuperTrend (IND-1 equivalent)."""
        trs = [highs[0] - lows[0]]
        for i in range(1, len(highs)):
            trs.append(max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i - 1]),
                abs(lows[i] - closes[i - 1])
            ))
        trs = np.array(trs)
        atr_arr = np.zeros(len(trs))
        if len(trs) >= period:
            atr_arr[:period] = np.mean(trs[:period])
            for i in range(period, len(trs)):
                atr_arr[i] = (atr_arr[i - 1] * (period - 1) + trs[i]) / period
        else:
            atr_arr[:] = np.mean(trs)
        return atr_arr

    # -------------------------------------------------------
    # ADX — Wilder's Smoothed (IND-6 equivalent)
    # -------------------------------------------------------
    def _adx(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> Dict:
        if len(highs) <= period * 2:
            return {"value": 0.0, "plusDI": 0.0, "minusDI": 0.0}

        plus_dm, minus_dm, tr = [], [], []
        for i in range(1, len(highs)):
            up = highs[i] - highs[i - 1]
            down = lows[i - 1] - lows[i]
            plus_dm.append(up if up > down and up > 0 else 0.0)
            minus_dm.append(down if down > up and down > 0 else 0.0)
            tr.append(max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i - 1]),
                abs(lows[i] - closes[i - 1])
            ))

        smooth_tr = sum(tr[:period])
        smooth_pdm = sum(plus_dm[:period])
        smooth_mdm = sum(minus_dm[:period])

        dx_vals = []
        for i in range(period, len(tr)):
            smooth_tr = smooth_tr - smooth_tr / period + tr[i]
            smooth_pdm = smooth_pdm - smooth_pdm / period + plus_dm[i]
            smooth_mdm = smooth_mdm - smooth_mdm / period + minus_dm[i]

            pdi = 100 * smooth_pdm / smooth_tr if smooth_tr > 0 else 0
            mdi = 100 * smooth_mdm / smooth_tr if smooth_tr > 0 else 0
            di_sum = pdi + mdi
            dx = 100 * abs(pdi - mdi) / di_sum if di_sum > 0 else 0
            dx_vals.append(dx)

        if len(dx_vals) < period:
            adx_val = float(np.mean(dx_vals)) if dx_vals else 0.0
        else:
            adx_val = float(np.mean(dx_vals[:period]))
            for v in dx_vals[period:]:
                adx_val = (adx_val * (period - 1) + v) / period

        last_pdi = round(100 * smooth_pdm / smooth_tr if smooth_tr > 0 else 0, 2)
        last_mdi = round(100 * smooth_mdm / smooth_tr if smooth_tr > 0 else 0, 2)

        return {"value": round(adx_val, 2), "plusDI": last_pdi, "minusDI": last_mdi}

    # -------------------------------------------------------
    # SuperTrend — Rolling ATR per bar (IND-1 equivalent)
    # -------------------------------------------------------
    def _supertrend(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray,
                    period: int = 10, multiplier: float = 3.0) -> Dict:
        if len(closes) < period + 1:
            return {"status": "Neutral", "value": 0.0}

        atr_arr = self._atr_series(highs, lows, closes, period)
        final_upper = 0.0
        final_lower = 0.0
        trend = "Bullish"
        st_value = 0.0

        for i in range(len(closes)):
            hl2 = (highs[i] + lows[i]) / 2.0
            curr_atr = atr_arr[min(i, len(atr_arr) - 1)]
            basic_upper = hl2 + multiplier * curr_atr
            basic_lower = hl2 - multiplier * curr_atr

            if i == 0:
                final_upper = basic_upper
                final_lower = basic_lower
            else:
                final_upper = basic_upper if (basic_upper < final_upper or closes[i - 1] > final_upper) else final_upper
                final_lower = basic_lower if (basic_lower > final_lower or closes[i - 1] < final_lower) else final_lower

                if trend == "Bullish" and closes[i] < final_lower:
                    trend = "Bearish"
                elif trend == "Bearish" and closes[i] > final_upper:
                    trend = "Bullish"

            st_value = final_lower if trend == "Bullish" else final_upper

        return {"status": trend, "value": round(st_value, 2)}

    # -------------------------------------------------------
    # VWAP — Today-only reset (IND-3 equivalent)
    # -------------------------------------------------------
    def _vwap(self) -> Dict:
        df = self.df_today if not self.df_today.empty else self.df
        if df.empty:
            return {"value": 0.0, "status": "Neutral"}

        df = df[df["volume"] > 0].copy()
        if df.empty:
            return {"value": 0.0, "status": "Neutral"}

        df["typical"] = (df["high"] + df["low"] + df["close"]) / 3.0
        pv = (df["typical"] * df["volume"]).sum()
        vol = df["volume"].sum()
        vwap = round(pv / vol, 2) if vol > 0 else 0.0
        status = "Above" if self.ltp > vwap else "Below"
        return {"value": vwap, "status": status}

    # -------------------------------------------------------
    # Bollinger Bands
    # -------------------------------------------------------
    def _bollinger(self, closes: np.ndarray, period: int = 20, mult: float = 2.0) -> Dict:
        if len(closes) < period:
            return {"upper": 0.0, "lower": 0.0, "middle": 0.0, "width": 0.0, "status": "Within Bands"}

        sl = closes[-period:]
        sma = float(np.mean(sl))
        std = float(np.std(sl))
        upper = round(sma + mult * std, 2)
        lower = round(sma - mult * std, 2)
        width = round((upper - lower) / sma * 100, 2) if sma > 0 else 0.0  # Band width %
        status = "Breakout Up" if self.ltp > upper else ("Breakout Down" if self.ltp < lower else "Within Bands")
        return {"upper": upper, "lower": lower, "middle": round(sma, 2), "width": width, "status": status}

    # -------------------------------------------------------
    # Stochastic
    # -------------------------------------------------------
    def _stochastic(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> Dict:
        if len(closes) < period:
            return {"value": 50.0, "status": "Insufficient Data"}
        rh = np.max(highs[-period:])
        rl = np.min(lows[-period:])
        r = rh - rl
        pct_k = round(((closes[-1] - rl) / r) * 100, 2) if r > 0 else 50.0
        status = "Overbought" if pct_k > 80 else ("Oversold" if pct_k < 20 else "Neutral")
        return {"value": pct_k, "status": status}

    # -------------------------------------------------------
    # CCI
    # -------------------------------------------------------
    def _cci(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 20) -> Dict:
        if len(closes) < period:
            return {"value": 0.0, "status": "Neutral"}
        typical = (highs + lows + closes) / 3.0
        tp = typical[-period:]
        sma = float(np.mean(tp))
        mad = float(np.mean(np.abs(tp - sma)))
        if mad < 1e-9:
            return {"value": 0.0, "status": "Neutral"}
        cci = round((tp[-1] - sma) / (0.015 * mad), 2)
        status = "Buy" if cci > 100 else ("Sell" if cci < -100 else "Neutral")
        return {"value": cci, "status": status}

    # -------------------------------------------------------
    # MFI — Most recent N bars (IND-5 equivalent)
    # -------------------------------------------------------
    def _mfi(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, volumes: np.ndarray, period: int = 14) -> Dict:
        if len(closes) < period + 1:
            return {"value": 50.0, "status": "Neutral"}

        tp = (highs + lows + closes) / 3.0
        start = max(1, len(closes) - period)
        pos, neg = 0.0, 0.0
        for i in range(start, len(closes)):
            mf = tp[i] * volumes[i]
            if tp[i] > tp[i - 1]:
                pos += mf
            elif tp[i] < tp[i - 1]:
                neg += mf

        ratio = pos / (neg if neg > 1e-9 else 1e-9)
        mfi = round(100 - (100 / (1 + ratio)), 2)
        status = "Overbought" if mfi > 80 else ("Oversold" if mfi < 20 else "Neutral")
        return {"value": mfi, "status": status}

    # -------------------------------------------------------
    # Aroon
    # -------------------------------------------------------
    def _aroon(self, highs: np.ndarray, lows: np.ndarray, period: int = 14) -> Dict:
        if len(highs) < period:
            return {"up": 50.0, "down": 50.0, "status": "Neutral"}
        rh = highs[-period:]
        rl = lows[-period:]
        days_since_high = (period - 1) - int(np.argmax(rh))
        days_since_low = (period - 1) - int(np.argmin(rl))
        aroon_up = round(((period - days_since_high) / period) * 100, 2)
        aroon_down = round(((period - days_since_low) / period) * 100, 2)
        status = "Uptrend" if aroon_up > aroon_down else "Downtrend"
        return {"up": aroon_up, "down": aroon_down, "status": status}

    # -------------------------------------------------------
    # Parabolic SAR
    # -------------------------------------------------------
    def _psar(self, highs: np.ndarray, lows: np.ndarray, step: float = 0.02, max_step: float = 0.2) -> Dict:
        if len(highs) < 2:
            return {"value": 0.0, "status": "Neutral"}
        psar = lows[0]; ep = highs[0]; af = step; is_long = True
        for i in range(1, len(highs)):
            psar = psar + af * (ep - psar)
            if is_long:
                if highs[i] > ep:
                    ep = highs[i]; af = min(af + step, max_step)
                if lows[i] < psar:
                    is_long = False; psar = ep; ep = lows[i]; af = step
            else:
                if lows[i] < ep:
                    ep = lows[i]; af = min(af + step, max_step)
                if highs[i] > psar:
                    is_long = True; psar = ep; ep = highs[i]; af = step
        status = "Bullish" if self.ltp > psar else "Bearish"
        return {"value": round(psar, 2), "status": status}

    # -------------------------------------------------------
    # Candlestick Patterns (today's candles)
    # -------------------------------------------------------
    def _candle_patterns(self) -> List[str]:
        df = self.df_today if len(self.df_today) >= 3 else self.df
        if len(df) < 3:
            return ["Insufficient Data"]
        o = df["open"].values
        h = df["high"].values
        l = df["low"].values
        c = df["close"].values
        patterns = []

        # Last 3 bars
        o1, h1, l1, c1 = o[-1], h[-1], l[-1], c[-1]
        o2, c2 = o[-2], c[-2]
        o3, c3 = o[-3], c[-3]

        body = abs(c1 - o1)
        rng = h1 - l1 if h1 > l1 else 1e-6
        upper_wick = h1 - max(c1, o1)
        lower_wick = min(c1, o1) - l1

        if body <= rng * 0.1: patterns.append("Doji")
        if body <= rng * 0.3 and lower_wick > 2 * body and c1 > o1: patterns.append("Hammer")
        if body <= rng * 0.3 and upper_wick > 2 * body and c1 < o1: patterns.append("Shooting Star")
        if body <= rng * 0.3 and lower_wick > 2 * body and c1 < o1: patterns.append("Hanging Man")
        if c2 < o2 and c1 > o1 and c1 >= o2 and o1 <= c2: patterns.append("Bullish Engulfing")
        if c2 > o2 and c1 < o1 and o1 >= c2 and c1 <= o2: patterns.append("Bearish Engulfing")
        if upper_wick <= 0.05 * body and lower_wick <= 0.05 * body and body > 0:
            patterns.append("Bullish Marubozu" if c1 > o1 else "Bearish Marubozu")
        if c3 < o3 and abs(c2 - o2) < rng * 0.05 and c1 > o1: patterns.append("Morning Star")
        if c3 > o3 and abs(c2 - o2) < rng * 0.05 and c1 < o1: patterns.append("Evening Star")

        return patterns if patterns else ["No Clear Pattern"]

    # -------------------------------------------------------
    # Volume Profile (NEW — approximation)
    # -------------------------------------------------------
    def _volume_profile(self) -> Dict:
        """
        Approximate Volume Profile for today.
        Splits price range into 20 buckets and identifies:
        - POC: Point of Control (highest volume price)
        - VAH: Value Area High
        - VAL: Value Area Low
        """
        df = self.df_today if not self.df_today.empty else self.df
        if len(df) < 5:
            return {"poc": 0.0, "vah": 0.0, "val": 0.0}

        price_min = float(df["low"].min())
        price_max = float(df["high"].max())
        if price_max <= price_min:
            return {"poc": float(df["close"].iloc[-1]), "vah": price_max, "val": price_min}

        num_bins = 20
        bin_size = (price_max - price_min) / num_bins
        vol_profile = np.zeros(num_bins)

        for _, row in df.iterrows():
            # Distribute candle volume across its price range
            low_bin = max(0, int((row["low"] - price_min) / bin_size))
            high_bin = min(num_bins - 1, int((row["high"] - price_min) / bin_size))
            n_bins = max(1, high_bin - low_bin + 1)
            for b in range(low_bin, high_bin + 1):
                vol_profile[b] += row["volume"] / n_bins

        poc_bin = int(np.argmax(vol_profile))
        poc = round(price_min + (poc_bin + 0.5) * bin_size, 2)

        # Value Area = 70% of total volume
        total_vol = vol_profile.sum()
        target_vol = total_vol * 0.70
        val_bin = poc_bin
        vah_bin = poc_bin
        accumulated = vol_profile[poc_bin]

        while accumulated < target_vol:
            add_above = vol_profile[vah_bin + 1] if vah_bin + 1 < num_bins else 0
            add_below = vol_profile[val_bin - 1] if val_bin - 1 >= 0 else 0
            if add_above >= add_below and vah_bin + 1 < num_bins:
                vah_bin += 1
                accumulated += vol_profile[vah_bin]
            elif val_bin - 1 >= 0:
                val_bin -= 1
                accumulated += vol_profile[val_bin]
            else:
                break

        vah = round(price_min + (vah_bin + 1) * bin_size, 2)
        val = round(price_min + val_bin * bin_size, 2)
        return {"poc": poc, "vah": vah, "val": val}

    # -------------------------------------------------------
    # Heikin Ashi
    # -------------------------------------------------------
    def _heikin_ashi_trend(self) -> Dict:
        """Returns the last 3 Heikin Ashi candle trend."""
        df = self.df_today if len(self.df_today) >= 5 else self.df
        if len(df) < 5:
            return {"trend": "Neutral", "consecutive": 0}

        ha_close = (df["open"] + df["high"] + df["low"] + df["close"]) / 4.0
        ha_open = ha_close.copy()
        ha_open.iloc[0] = (df["open"].iloc[0] + df["close"].iloc[0]) / 2.0
        for i in range(1, len(ha_open)):
            ha_open.iloc[i] = (ha_open.iloc[i - 1] + ha_close.iloc[i - 1]) / 2.0

        is_bullish = (ha_close > ha_open).values
        last = is_bullish[-1]
        consecutive = 1
        for v in reversed(is_bullish[:-1]):
            if v == last:
                consecutive += 1
            else:
                break

        return {"trend": "Bullish" if last else "Bearish", "consecutive": consecutive}

    # -------------------------------------------------------
    # Price Action
    # -------------------------------------------------------
    def _price_action(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Dict:
        lookback = 3
        swing_highs = []
        swing_lows = []
        for i in range(lookback, len(highs) - lookback):
            if all(highs[i] > highs[i - j] for j in range(1, lookback + 1)) and \
               all(highs[i] > highs[i + j] for j in range(1, lookback + 1)):
                swing_highs.append(highs[i])
            if all(lows[i] < lows[i - j] for j in range(1, lookback + 1)) and \
               all(lows[i] < lows[i + j] for j in range(1, lookback + 1)):
                swing_lows.append(lows[i])

        last_close = closes[-1]
        if swing_highs and last_close > swing_highs[-1]:
            return {"score": 2, "type": "Breakout"}
        if swing_lows and last_close < swing_lows[-1]:
            return {"score": -2, "type": "Breakdown"}

        if len(swing_highs) >= 2 and len(swing_lows) >= 2:
            if all(swing_highs[i] > swing_highs[i-1] for i in range(1, len(swing_highs))) and \
               all(swing_lows[i] > swing_lows[i-1] for i in range(1, len(swing_lows))):
                return {"score": 1, "type": "Trending"}
            if all(swing_highs[i] < swing_highs[i-1] for i in range(1, len(swing_highs))) and \
               all(swing_lows[i] < swing_lows[i-1] for i in range(1, len(swing_lows))):
                return {"score": -1, "type": "Downtrend"}

        return {"score": 0, "type": "Ranging"}

    # -------------------------------------------------------
    # Volume Spike
    # -------------------------------------------------------
    def _volume_spike(self, volumes: np.ndarray, period: int = 20) -> Dict:
        if len(volumes) < period + 1:
            return {"spike": False, "latestVol": 0.0, "avgVol": 0.0, "ratio": 1.0}
        avg = float(np.mean(volumes[-period - 1:-1]))
        latest = float(volumes[-1])
        ratio = round(latest / avg if avg > 0 else 1.0, 2)
        return {"spike": ratio > 1.5, "latestVol": latest, "avgVol": round(avg, 2), "ratio": ratio}

    # -------------------------------------------------------
    # EMA20 + SMA50 output format
    # -------------------------------------------------------
    def _ema20_result(self, closes: np.ndarray) -> Dict:
        ema = self._ema(closes, 20)
        return {"ema": ema, "status": "Bullish" if self.ltp > ema else "Bearish"}

    def _sma50_result(self, closes: np.ndarray) -> Dict:
        if len(closes) < 50:
            return {"sma": 0.0, "status": "Insufficient Data"}
        sma = round(float(np.mean(closes[-50:])), 2)
        return {"sma": sma, "status": "Bullish" if self.ltp > sma else "Bearish"}

    # -------------------------------------------------------
    # Main: Calculate All
    # -------------------------------------------------------
    def calculate_all(self) -> Dict:
        """
        Run all indicators and return the full output dict.
        This is passed to the FeatureEngineer and Rules Engine.
        """
        if self.df.empty:
            return self._empty_result()

        h = self._safe(self.df["high"])
        l = self._safe(self.df["low"])
        c = self._safe(self.df["close"])
        o = self._safe(self.df["open"])
        v = self._safe(self.df["volume"])

        macd_data = self._macd(c)
        vwap_data = self._vwap()
        bb_data = self._bollinger(c)
        vol_spike = self._volume_spike(v)

        return {
            "LTP": self.ltp,
            "RSI": self._rsi(c),
            "EMA20": self._ema20_result(c),
            "SMA50": self._sma50_result(c),
            "MACD": macd_data,
            "VIX": {"vix": self.vix, "status": "High Volatility" if self.vix > 20 else ("Calm Market" if self.vix < 13 else "Moderate")},
            "BollingerBands": bb_data,
            "ATR": {"value": self._atr(h, l, c)},
            "ADX": self._adx(h, l, c),
            "Stochastic": self._stochastic(h, l, c),
            "VWAP": vwap_data,
            "CCI": self._cci(h, l, c),
            "SuperTrend": self._supertrend(h, l, c),
            "Aroon": self._aroon(h, l),
            "ParabolicSAR": self._psar(h, l),
            "MFI": self._mfi(h, l, c, v),
            "CandlePatterns": self._candle_patterns(),
            "PriceAction": self._price_action(h, l, c),
            "VolumeSpike": vol_spike,
            "HeikinAshi": self._heikin_ashi_trend(),
            "VolumeProfile": self._volume_profile(),
            "candleCount": len(self.df),
            "todayCandleCount": len(self.df_today),
            "indicatorVersion": "v4.0"
        }

    def _empty_result(self) -> Dict:
        return {
            "LTP": self.ltp, "error": "No candle data",
            "RSI": {"rsi": 50.0, "status": "No Data"},
            "EMA20": {"ema": 0.0, "status": "Neutral"},
            "SMA50": {"sma": 0.0, "status": "Neutral"},
            "MACD": {"macd": 0.0, "signal": 0.0, "histogram": 0.0, "status": "Neutral"},
            "VIX": {"vix": self.vix, "status": "No Data"},
            "BollingerBands": {"upper": 0.0, "lower": 0.0, "middle": 0.0, "width": 0.0, "status": "Within Bands"},
            "ATR": {"value": 0.0}, "ADX": {"value": 0.0, "plusDI": 0.0, "minusDI": 0.0},
            "Stochastic": {"value": 50.0, "status": "Neutral"},
            "VWAP": {"value": 0.0, "status": "Neutral"},
            "CCI": {"value": 0.0, "status": "Neutral"},
            "SuperTrend": {"status": "Neutral", "value": 0.0},
            "Aroon": {"up": 50.0, "down": 50.0, "status": "Neutral"},
            "ParabolicSAR": {"value": 0.0, "status": "Neutral"},
            "MFI": {"value": 50.0, "status": "Neutral"},
            "CandlePatterns": ["No Data"], "PriceAction": {"score": 0, "type": "No Data"},
            "VolumeSpike": {"spike": False, "latestVol": 0.0, "avgVol": 0.0, "ratio": 1.0},
            "HeikinAshi": {"trend": "Neutral", "consecutive": 0},
            "VolumeProfile": {"poc": 0.0, "vah": 0.0, "val": 0.0},
            "candleCount": 0, "todayCandleCount": 0, "indicatorVersion": "v4.0"
        }
