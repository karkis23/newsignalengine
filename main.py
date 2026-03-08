# ============================================================
# NIFTY AI SIGNAL ENGINE — main.py
# FastAPI Application Entry Point
# Version: 4.0.0 | Date: 08 March 2026
# ============================================================

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import os
from dotenv import load_dotenv

from engine.models import RawMarketData, SignalResponse
from engine.preprocessor import FeatureEngineer
from engine.indicators import IndicatorCalculator
from engine.writers_zone import WritersZoneAnalyzer
from engine.signal_engine import AISignalEngine
from engine.rule_engine import RulesEngine

load_dotenv()

# --- Logging Setup ---
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("nifty_ai_engine")

# --- FastAPI App ---
app = FastAPI(
    title="NIFTY AI Signal Engine",
    description="AI-powered NIFTY Options Trading Signal Engine v4.0. Combines ML Ensemble (XGBoost + Rules-based fallback) with SMC, Greeks, and Market Regime detection.",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- CORS (Allow n8n to call this) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Engine (singleton, loaded once at startup) ---
signal_engine = AISignalEngine()
rules_engine = RulesEngine()

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "NIFTY AI Signal Engine",
        "version": "4.0.0",
        "status": "online",
        "model_ready": signal_engine.is_model_ready(),
        "timestamp": time.time()
    }

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "model_loaded": signal_engine.is_model_ready(),
        "engine_mode": "AI_ENSEMBLE" if signal_engine.is_model_ready() else "RULES_FALLBACK"
    }

@app.post("/api/predict", response_model=SignalResponse, tags=["Signal"])
async def predict_signal(payload: RawMarketData):
    """
    Main prediction endpoint. n8n sends raw market data here.
    Returns a structured signal response with the same format as v3.0 signal Code1.
    """
    start_time = time.time()
    logger.info(f"📊 Prediction request received | LTP={payload.spotLTP} | VIX={payload.vix}")

    try:
        # Step 1: Calculate all technical indicators from raw OHLCV
        indicator_calc = IndicatorCalculator(payload)
        indicators = indicator_calc.calculate_all()
        logger.debug(f"✅ Indicators computed: RSI={indicators.get('RSI', {}).get('rsi')}, ADX={indicators.get('ADX', {}).get('value')}")

        # Step 2: Writers Zone (Options Chain)
        writers_calc = WritersZoneAnalyzer(payload)
        writers_zone = writers_calc.analyze()
        logger.debug(f"✅ Writers Zone: {writers_zone.get('writersZone')} | maxPain={writers_zone.get('maxPain')}")

        # Step 3: Feature Engineering for AI Model
        feature_eng = FeatureEngineer(payload, indicators, writers_zone)
        features = feature_eng.build_features()

        # Step 4: Generate Signal (AI Model if ready, else Rules-based fallback)
        if signal_engine.is_model_ready():
            signal_result = signal_engine.predict(features, indicators, writers_zone, payload)
            logger.info(f"🤖 AI Model signal: {signal_result.get('finalSignal')} | confidence={signal_result.get('confidence')}")
        else:
            signal_result = rules_engine.predict(indicators, writers_zone, payload)
            logger.info(f"📐 Rules Engine signal: {signal_result.get('finalSignal')} | confidence={signal_result.get('confidence')}")

        # Step 5: Attach metadata
        elapsed = round((time.time() - start_time) * 1000, 1)
        signal_result["processingTimeMs"] = elapsed
        signal_result["engineVersion"] = "v4.0_AI_Ensemble" if signal_engine.is_model_ready() else "v4.0_Rules"

        logger.info(f"✅ Response ready in {elapsed}ms | Signal={signal_result.get('finalSignal')}")
        return signal_result

    except Exception as e:
        logger.error(f"❌ Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Signal prediction failed: {str(e)}")


@app.post("/api/predict/debug", tags=["Debug"])
async def predict_debug(payload: RawMarketData):
    """
    Debug endpoint — returns ALL intermediate calculations.
    Use for tuning and understanding signal logic.
    """
    try:
        indicator_calc = IndicatorCalculator(payload)
        indicators = indicator_calc.calculate_all()

        writers_calc = WritersZoneAnalyzer(payload)
        writers_zone = writers_calc.analyze()

        feature_eng = FeatureEngineer(payload, indicators, writers_zone)
        features = feature_eng.build_features()

        return {
            "raw_input_summary": {
                "spotLTP": payload.spotLTP,
                "vix": payload.vix,
                "candleCount": len(payload.angelOneCandles),
                "optionStrikeCount": len(payload.optionChainRaw)
            },
            "indicators": indicators,
            "writers_zone": writers_zone,
            "feature_vector_length": len(features),
            "feature_sample": {k: v for k, v in list(features.items())[:20]}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model/status", tags=["Model"])
async def model_status():
    """Returns model training status and metadata."""
    return signal_engine.get_status()
