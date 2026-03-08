# 🧠 NIFTY AI Signal Engine (v4.0)

A highly advanced Python FastAPI microservice for NIFTY Options Intraday trading.
Includes full Technical Indicators (SMC, VAH/VAL), Option Chain Greeks (Gamma Exposure, IV Skew), a robust Rules-based 25-step Logic Fallback, and an XGBoost Model loader for predictive signaling.

## 🚀 Deployment on Vercel
This API is fully configured for instantaneous deployment on Vercel.

1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Import this GitHub repository (`Signal-engine`).
3. Vercel will automatically detect the Python environment and build the FastAPI app using the provided `vercel.json`.
4. Deploy!

Once deployed, update your n8n `HTTP Request` node to point to the Vercel URL:
`POST https://<your-vercel-domain>/api/predict`

## 💻 Running Locally

Requirements: Python 3.12+

```bash
# 1. Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
uvicorn main:app --reload --port 8000
```

## 📡 Endpoints
* `GET /` — Health & Status
* `GET /health` — Kubernetes-friendly health check
* `POST /api/predict` — Main inference endpoint for n8n payload containing `RawMarketData`
* `POST /api/predict/debug` — Returns intermediate indicators, features, and raw weights
* `GET /api/model/status` — Returns info on whether the XGBoost model has been trained and loaded

## 📁 Architecture
- `main.py` — FastAPI routes
- `engine/indicators.py` — NumPy/Pandas native technical calculations
- `engine/writers_zone.py` — OI & Gamma Exposure analytics
- `engine/rule_engine.py` — v3.0 logic fallback for zero-shot accuracy
- `engine/signal_engine.py` — XGBoost model inference orchestrator
- `engine/preprocessor.py` — High-dimensional Feature Engineering
- `scripts/train_model.py` — Stratified training pipeline for `xgboost`
