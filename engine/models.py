# ============================================================
# engine/models.py
# Pydantic Data Models — Request and Response Schemas
# Version: 4.0.0 | Date: 08 March 2026
# ============================================================

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class RawMarketData(BaseModel):
    """
    The exact JSON body sent from n8n's HTTP Request node.
    Contains raw data from Angel One, TradingView, and NSE Option Chain.
    """
    # --- NIFTY Spot & VIX ---
    spotLTP: float = Field(..., description="NIFTY spot price from TradingView Scanner")
    vix: float = Field(..., description="India VIX from TradingView Scanner")

    # --- OHLCV Candle Data from Angel One ---
    # Each candle: [timestamp, open, high, low, close, volume]
    angelOneCandles: List[List[Any]] = Field(
        ..., description="Raw OHLCV candle array from Angel One 5-min endpoint. Format: [[ts, o, h, l, c, v]]"
    )

    # --- Option Chain Data from NSE (via Angel One) ---
    # This is the raw 'oc' map from Option Chain Request1: {"22000": {"ce": {...}, "pe": {...}}}
    optionChainRaw: Dict[str, Any] = Field(
        ..., description="Raw option chain OC map from NSE. Keys are strike prices."
    )

    # --- ATM Strike (pre-calculated by NIFTY Option Chain Builder1) ---
    atmStrike: float = Field(..., description="At-the-money strike nearest to spot price (rounded to 50)")

    # --- Optional context ---
    currentIST: Optional[str] = Field(None, description="Current IST timestamp string, e.g. 2026-03-08T10:05:00+05:30")
    sessionDate: Optional[str] = Field(None, description="Current trading date YYYY-MM-DD for daily reset logic")


class AIInsight(BaseModel):
    """A single AI observation / reasoning string."""
    category: str  # e.g. "SMC", "Options", "Volume"
    detail: str


class SignalResponse(BaseModel):
    """
    Structured signal output — same format as Signal Engine v3.0 output.
    Backward compatible so Dhan Execution nodes need NO changes.
    """
    # --- Core Signal ---
    finalSignal: str = Field(..., description="BUY CALL (CE) / BUY PUT (PE) / WAIT / AVOID / SIDEWAYS / MARKET_CLOSED")
    rawSignal: str = Field(..., description="Pre-filter signal direction before repeat protection")
    confidence: float = Field(..., description="Final composite confidence score")
    blockedReason: str = Field("", description="Why the signal was blocked from firing")

    # --- Market Regime ---
    regime: str = Field(..., description="Market regime: STRONG_BULLISH, BEARISH_TREND, SIDEWAYS_RANGING, etc.")

    # --- Key Indicator Values (used by Logging nodes) ---
    ADX: float
    RSI: float
    VIX: float
    MACDFlip: str = Field("NONE", description="BULLISH_FLIP / BEARISH_FLIP / NONE")
    SuperTrend: str = Field("Neutral", description="Bullish / Bearish / Neutral")
    SuperTrendValidated: bool = False

    # --- Options & Writers ---
    writersZone: str = Field("NEUTRAL", description="BULLISH / NEUTRAL / BEARISH")
    writersConfidence: float = 0.0
    maxPain: float = 0.0
    putCallOIRatio: float = 1.0
    putCallPremiumRatio: float = 1.0
    maxCEOIStrike: float = 0.0
    maxPEOIStrike: float = 0.0

    # --- ORB (Opening Range Breakout) ---
    orbRange: Optional[Dict[str, float]] = None

    # --- Momentum ---
    Momentum: float = 0.0
    VolumeRatio: Optional[float] = None

    # --- Signal Streak ---
    streakCount: int = 0
    streakConfirmed: bool = False

    # --- VIX/Multiplier Details ---
    vixMultiplier: float = 1.0
    combinedMultiplier: float = 1.0

    # --- Reasoning ---
    reason: str = ""
    debugFlags: List[str] = []
    ai_insights: List[str] = []

    # --- Meta ---
    sessionDate: Optional[str] = None
    processingTimeMs: float = 0.0
    engineVersion: str = "v4.0_AI_Ensemble"
