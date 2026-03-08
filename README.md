# NIFTY AI Signal Engine — Setup Guide

## Prerequisites

You need Python 3.11 or 3.12 installed. If you don't have it:

1. Go to: https://www.python.org/downloads/
2. Download Python 3.12 (Windows installer)
3. During install: ✅ CHECK "Add Python to PATH"
4. Click Install Now

---

## Step 1 — Open a Terminal in the /api folder

```powershell
cd "C:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\api"
```

---

## Step 2 — Create a Virtual Environment

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

---

## Step 3 — Install Dependencies

```powershell
pip install -r requirements.txt
```

---

## Step 4 — Run the Server Locally

```powershell
uvicorn main:app --reload --port 8000
```

Server will start at: http://localhost:8000

---

## Step 5 — Test the Server

Open a second terminal, activate the venv, then run:
```powershell
python scripts/test_api.py
```

Or open in browser: http://localhost:8000/docs (Interactive Swagger UI)

---

## Step 6 — Connect n8n to this Server

In your n8n workflow:

### Replace these 3 nodes:
❌ `Calculate All Technical Indicators1`
❌ `Writers Zone Analysis1`
❌ `signal Code1`

### Add 1 new node:
✅ **HTTP Request** node (Name: "🧠 Call Python AI Engine")

Node Settings:
- **Method:** POST
- **URL:** http://localhost:8000/api/predict  (local) OR your Render URL (production)
- **Send Body:** JSON
- **Body Parameters:**

```json
{
  "spotLTP": "{{ $('NIFTY Spot (LTP)1').first().json.data[0].d[0] }}",
  "vix": "{{ $('INDIA VIX Spot1').first().json.data[0].d[0] }}",
  "atmStrike": "{{ $('NIFTY Option Chain Builder1').first().json.atmStrike }}",
  "angelOneCandles": "={{ $('Get 5Mins Candles1').first().json.data }}",
  "optionChainRaw": "={{ $('Option Chain Request1').first().json.data.oc }}",
  "currentIST": "={{ new Date().toISOString() }}",
  "sessionDate": "={{ new Date().toISOString().split('T')[0] }}"
}
```

The HTTP Request response will have the exact same fields as your old `signal Code1` output. No other nodes need changes.

---

## Step 7 — Deploy to Render (Production)

1. Create a free account at https://render.com
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Set Root Directory: `api`
5. Start Command: `gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --timeout 120`
6. After deploy, replace `http://localhost:8000` in n8n with your Render URL

---

## File Structure

```
api/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── Procfile                   # Render/Heroku deployment command
├── .env.example               # Environment variable template
│
├── engine/
│   ├── __init__.py
│   ├── models.py              # Pydantic request/response schemas
│   ├── indicators.py          # Technical indicator calculator (v4.0)
│   ├── writers_zone.py        # Options chain analyzer (v4.0)
│   ├── preprocessor.py        # Feature engineering for AI model
│   ├── rule_engine.py         # Rules engine (v3.0 JS port — fallback)
│   └── signal_engine.py       # AI model loader & predictor
│
├── models/
│   ├── README.py              # Instructions
│   ├── signal_xgb_v1.pkl     # Trained model (after training)
│   ├── feature_scaler.pkl     # Feature scaler (after training)
│   └── feature_list.txt       # Feature names (after training)
│
└── scripts/
    ├── train_model.py         # Model training script
    └── test_api.py            # API test script
```

---

## Modes of Operation

The engine operates in 2 modes automatically:

| Mode | When | How |
|---|---|---|
| **RULES_FALLBACK** | No model trained yet | Uses the v3.0 rule engine (same logic as your current JS) |
| **AI_ENSEMBLE** | After training | Uses XGBoost + rule engine for final signal |

When you first run, it will be in RULES_FALLBACK mode — which is already an improvement because Python's Pandas/NumPy compute indicators more accurately than the JS versions, and you now get GEX + Volume Profile + Heikin Ashi out of the box.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check + mode |
| `/health` | GET | Model status |
| `/api/predict` | POST | ⭐ Main signal endpoint (use this from n8n) |
| `/api/predict/debug` | POST | Returns all intermediate calculations |
| `/api/model/status` | GET | AI model training status |
| `/docs` | GET | Swagger interactive UI |
