# 02 — AI Model Detection: How and When Does the AI Activate?
*Discussed: March 2026*

---

## The Key Question
The IDE was showing an error: "Could not find import of .models". This led to the question: is the AI model not detecting the models folder because it is not trained yet?

## Short Answer
No. These are two completely unrelated things:
- **`from .models import RawMarketData`** — This imports a Python class (a data blueprint) that validates incoming JSON from n8n. The file `models.py` exists in `api/engine/`. The IDE simply couldn't find it because VS Code's workspace root was set to the `project/` folder, not the `api/` folder.
- **The AI "model"** (like a `.pkl` file) — This is a trained machine learning model file that does not exist yet because we haven't collected enough data to train it.

---

## How the AI Model Detection Actually Works

Every time the Python server starts up, `signal_engine.py` runs a boot sequence check:

### Check 1: Are the required libraries installed?
It checks if `joblib` and `xgboost` Python packages are installed in the virtual environment. If not, it logs a warning and runs in RULES_FALLBACK mode.

### Check 2: Is there an environment override?
It reads an environment variable called `FORCE_RULES`. If `FORCE_RULES=true` is set in the `.env` file, the AI is bypassed even if the model file exists. This is the emergency kill-switch.

### Check 3: Does the model file exist on disk?
It looks for a file at this exact path: `api/models/signal_xgb_v1.pkl`

**If the file does NOT exist:** Logs `"No model found — running in RULES_FALLBACK mode"` and uses rule_engine.py.

**If the file EXISTS:** Loads the model into memory, logs `"AI Model loaded: signal_xgb_v1.pkl"`, and switches to AI_ENSEMBLE mode. The rules engine is completely bypassed.

---

## How to Create the AI Model File (The Training Process)

1. Collect 1,500+ rows of 5-minute market data in Google Sheets.
2. Download the data as a CSV file.
3. Run the Look-Ahead Labeler script (labels each row with the actual outcome).
4. Run: `python scripts/train_model.py --data training_data.csv`
5. The script generates three files in `api/models/`:
   - `signal_xgb_v1.pkl` → The trained AI brain
   - `feature_scaler.pkl` → Normalizes incoming numbers
   - `feature_list.txt` → The exact order of the 57 features
6. Restart the Python server. It auto-detects the `.pkl` file and activates AI mode.

---

## The Emergency Switch (FORCE_RULES)
If the AI is live but behaving badly during a news event:
1. Open `api/.env`
2. Set `FORCE_RULES=true`
3. Restart the server
4. The server instantly reverts to the safe 25-step rules engine without deleting the model

To re-enable AI: Change back to `FORCE_RULES=false` and restart.

---

## Health Check Endpoint
You can always check the current mode of the engine at: `http://localhost:8000/health`

- `"engine_mode": "RULES_FALLBACK"` → AI not trained yet, rules engine running
- `"engine_mode": "AI_ENSEMBLE"` → AI model is loaded and making predictions

---

## AI Runtime Behavior (Confidence Thresholds)

One of the most important questions is: **Does the engine fall back to rules if the AI is unsure?**

The answer is **No.** Once the AI is loaded and in `AI_ENSEMBLE` mode, it is the sole decision-maker.

### The 60% Confidence Rule
Inside `api/engine/signal_engine.py`, the variable `CONFIDENCE_THRESHOLD` is set to **60.0**.

- **If AI confidence > 60%:** It issues a trade signal (BUY CALL or BUY PUT).
- **If AI confidence < 60%:** It proactively blocks the trade and returns a **"WAIT"** signal. It will **not** check the rules engine for a second opinion.

### Why not fall back to rules?
The system is designed this way for safety. If the sophisticated AI model, which analyzes 57 different features, is confused by the current market data, the market is likely:
1.  **Ranging/Choppy:** Not safe for trading.
2.  **High Noise:** No clear pattern found.

In these cases, a "safe" rule-based system might still fire a signal, but that signal is much more likely to be a "fake-out" or a loss. The system is tuned for **quality over quantity**.

### Summary Matrix
| State | Logic Source | If Unsure? |
| :--- | :--- | :--- |
| **No Model Path** | `rule_engine.py` | Runs all 25 safety rules |
| **Model Loaded** | `signal_engine.py` | Signals **WAIT** if confidence < 60% |
| **Emergency Force** | `rule_engine.py` | Bypasses AI completely for safe manual trading |

