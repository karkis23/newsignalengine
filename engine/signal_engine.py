# ============================================================
# engine/signal_engine.py
# AI Model Manager — Loads, predicts, and manages models.
# Version: 4.0.0 | Date: 08 March 2026
#
# Model Strategy:
#  - PRIMARY: XGBoost Ensemble (tabular features)
#  - SECONDARY: Rule Engine fallback (when model not trained)
#  - Future: LSTM time-series layer for sequence detection
#
# The model is loaded from disk at startup. If no model file
# exists (/app/models/), it falls back to the rules engine.
# ============================================================

import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger("signal_engine")

IST = timezone(timedelta(hours=5, minutes=30))

# ---- Optional model imports (graceful fallback if not installed) ----
try:
    import joblib
    import numpy as np
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False
    logger.warning("joblib/numpy not available. AI model disabled.")

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    logger.warning("xgboost not installed. AI model disabled.")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "signal_xgb_v1.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "feature_scaler.pkl")
FEATURE_LIST_PATH = os.path.join(MODEL_DIR, "feature_list.txt")


class AISignalEngine:
    """
    Manages the XGBoost AI model:
    - Loads from disk at startup
    - Provides predict() method
    - Reports status via get_status()
    """

    def __init__(self):
        self._model = None
        self._scaler = None
        self._feature_list: List[str] = []
        self._load_model()

    def _load_model(self):
        """Attempt to load the trained model from disk."""
        if not JOBLIB_AVAILABLE or not XGB_AVAILABLE:
            logger.info("⚠️  joblib/xgboost not available — running in RULES_FALLBACK mode")
            return

        force_rules = os.getenv("FORCE_RULES", "false").lower() == "true"
        if force_rules:
            logger.info("⚠️  FORCE_RULES=true detected in environment. Bypassing AI model and explicitly forcing RULES_FALLBACK mode.")
            return

        if not os.path.exists(MODEL_PATH):
            logger.info(f"⚠️  No model found at {MODEL_PATH} — running in RULES_FALLBACK mode")
            logger.info("   Train model first: python scripts/train_model.py")
            return

        try:
            self._model = joblib.load(MODEL_PATH)
            logger.info(f"✅ AI Model loaded: {MODEL_PATH}")

            if os.path.exists(SCALER_PATH):
                self._scaler = joblib.load(SCALER_PATH)
                logger.info(f"✅ Feature scaler loaded: {SCALER_PATH}")

            if os.path.exists(FEATURE_LIST_PATH):
                with open(FEATURE_LIST_PATH, "r") as f:
                    self._feature_list = [line.strip() for line in f.readlines() if line.strip()]
                logger.info(f"✅ Feature list loaded: {len(self._feature_list)} features")

        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            self._model = None

    def is_model_ready(self) -> bool:
        return self._model is not None

    def get_status(self) -> Dict:
        return {
            "model_loaded": self.is_model_ready(),
            "mode": "AI_ENSEMBLE" if self.is_model_ready() else "RULES_FALLBACK",
            "model_path": MODEL_PATH,
            "model_exists_on_disk": os.path.exists(MODEL_PATH),
            "scaler_loaded": self._scaler is not None,
            "feature_count": len(self._feature_list),
            "xgboost_available": XGB_AVAILABLE,
            "instructions": "Run: python scripts/train_model.py to train the AI model." if not self.is_model_ready() else "Model ready."
        }

    def predict(
        self,
        features: Dict[str, float],
        indicators: Dict,
        writers_zone: Dict,
        payload: Any
    ) -> Dict:
        """
        Run AI model prediction.
        Returns a fully structured signal result dict.
        """
        if not self.is_model_ready():
            raise RuntimeError("AI model not loaded. Use RulesEngine as fallback.")

        try:
            import numpy as np

            # Build feature vector in the correct order
            feature_names = self._feature_list if self._feature_list else list(features.keys())
            feature_vector = np.array([[features.get(f, 0.0) for f in feature_names]], dtype=np.float32)

            # Scale if scaler available
            if self._scaler:
                feature_vector = self._scaler.transform(feature_vector)

            # Predict probability
            proba = self._model.predict_proba(feature_vector)[0]
            # Classes: 0=BUY_CE, 1=BUY_PE, 2=WAIT (defined during training)
            class_labels = {0: "BUY CALL (CE)", 1: "BUY PUT (PE)", 2: "WAIT"}

            predicted_class = int(np.argmax(proba))
            raw_confidence = float(np.max(proba)) * 100

            # Confidence threshold: only fire BUY if model is > 60% confident
            CONFIDENCE_THRESHOLD = 60.0
            if predicted_class in (0, 1) and raw_confidence < CONFIDENCE_THRESHOLD:
                final_signal = "WAIT"
                blocked_reason = f"AI confidence {raw_confidence:.1f}% < {CONFIDENCE_THRESHOLD}% threshold"
            else:
                final_signal = class_labels[predicted_class]
                blocked_reason = ""

            ai_insights = self._generate_ai_insights(features, proba, predicted_class)

            # Build response in v3.0-compatible format
            from engine.rule_engine import RulesEngine
            rules = RulesEngine()
            base = rules._make_response(
                final_signal=final_signal,
                regime=self._classify_regime(indicators, payload),
                confidence=round(raw_confidence, 2),
                reason=f"AI Model: {class_labels[predicted_class]} ({raw_confidence:.1f}% confidence)",
                streak_count=0,
                vix=float(payload.vix),
                indicators=indicators,
                writers_zone=writers_zone,
                debug_flags=["AI_MODEL_PREDICTION"],
                blocked_reason=blocked_reason,
                ai_insights=ai_insights
            )
            base["rawSignal"] = class_labels[predicted_class]
            base["engineVersion"] = "v4.0_AI_Ensemble"
            return base

        except Exception as e:
            logger.error(f"❌ AI model prediction error: {e}", exc_info=True)
            raise

    def _classify_regime(self, indicators: Dict, payload: Any) -> str:
        vix = float(payload.vix)
        adx = float(indicators.get("ADX", {}).get("value", 0))
        st = indicators.get("SuperTrend", {}).get("status", "Neutral")
        ema = indicators.get("EMA20", {}).get("status", "Neutral")
        pa = indicators.get("PriceAction", {}).get("type", "Ranging")
        if vix >= 25: return "HIGH_VOLATILITY"
        if adx < 20 and pa == "Ranging": return "SIDEWAYS_RANGING"
        if st == "Bullish" and ema == "Bullish": return "STRONG_BULLISH"
        if st == "Bearish" and ema == "Bearish": return "STRONG_BEARISH"
        if ema == "Bullish": return "BULLISH_TREND"
        if ema == "Bearish": return "BEARISH_TREND"
        return "MIXED"

    def _generate_ai_insights(self, features: Dict, proba: Any, predicted_class: int) -> List[str]:
        """Generate human-readable insights from AI feature importance."""
        insights = []
        import numpy as np

        if self._model and hasattr(self._model, "feature_importances_"):
            feature_names = self._feature_list if self._feature_list else []
            importances = self._model.feature_importances_
            if feature_names and len(feature_names) == len(importances):
                top_indices = np.argsort(importances)[::-1][:5]
                top_features = [(feature_names[i], importances[i]) for i in top_indices]
                for name, imp in top_features:
                    val = features.get(name, 0)
                    insights.append(f"AI Key Feature: {name}={val:.3f} (importance={imp:.3f})")

        ce_conf = round(float(proba[0]) * 100, 1)
        pe_conf = round(float(proba[1]) * 100, 1)
        wait_conf = round(float(proba[2]) * 100, 1)
        insights.append(f"AI Probabilities → CE: {ce_conf}% | PE: {pe_conf}% | WAIT: {wait_conf}%")

        return insights
