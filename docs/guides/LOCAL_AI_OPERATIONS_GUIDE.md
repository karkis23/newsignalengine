# 🚀 NIFTY AI Signal Engine v4.0 — Local Operations Guide

This guide covers everything you need to run the Python AI Signal Engine locally on your own PC, test it in parallel with n8n, collect data, and eventually train the machine learning model.

## 💻 Hardware Requirements (Local)

Because you are only running inference (predicting signals) during market hours and not training massive models 24/7, the requirements are very low:

- **CPU:** Any dual-core processor (Intel i3 / AMD Ryzen 3 or better)
- **RAM:** Minimum 4 GB (8 GB recommended for training phase)
- **Storage:** 2 GB free space
- **OS:** Windows 10/11 (Instructions are tailored for Windows PowerShell)

---

## 🛠️ Phase 1: One-Time Setup (Do this once)

You need to install Python and configure the virtual environment to hold the heavy libraries (like Pandas and XGBoost).

### Step 1: Install Python
1. Download **Python 3.12** from the [official website](https://www.python.org/downloads/).
2. Run the installer.
3. ⚠️ **CRITICAL:** At the bottom of the very first window, check the box that says **"Add python.exe to PATH"**.
4. Click **Install Now**.

### Step 2: Initialize the Project
Open a PowerShell window (or the terminal in VS Code/Cursor).

1. Navigate to the API directory:
   ```powershell
   cd "C:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\api"
   ```

2. Create a virtual environment (this creates a folder called `.venv`):
   ```powershell
   python -m venv .venv
   ```

3. Activate the environment:
   ```powershell
   .venv\Scripts\Activate.ps1
   ```
   *(If you get an Execution Policy error on Windows, run this first: `Set-ExecutionPolicy Unrestricted -Scope CurrentUser`, then try activating again).*

4. Install all the heavy AI requirement packages (~700MB):
   ```powershell
   pip install -r requirements.txt
   ```

---

## ⚡ Phase 2: Daily Operations (Trading Days)

You do not need to repeat Phase 1. Every morning before 09:15 AM IST, follow this step to start the engine.

### Step 1: Start the Server
1. Navigate to `project/api/` in your File Explorer.
2. Double-click the **`start_server.bat`** file.
3. A black console window will open, activate the environment automatically, and show:
   ```
   [OK] Server started.
   Application startup complete.
   Uvicorn running on http://0.0.0.0:8000
   ```
4. **Leave this window open** during trading hours. Closing it will shut down the engine.

### Step 2: Verify it is Running
1. Open your browser and go to: `http://localhost:8000/health`
2. You should see `{"status": "healthy", "engine_mode": "RULES_FALLBACK"}`.

### Step 3: Run n8n in Parallel
As configured in `docs/guides/AI_ENGINE_SETUP_GUIDE.md`, your live v3.0 n8n workflow trades normally. Your *copied* v4.0 n8n workflow executes the HTTP Request node targeting `http://localhost:8000/api/predict` and logs the AI output.

---

## 🧪 Phase 3: Testing & Debugging

If you want to simulate n8n sending data without waiting for the 5-minute interval, you can run the built-in test script.

1. Keep the `start_server.bat` window running.
2. Open a *new* separate PowerShell terminal.
3. Navigate to the API folder and activate the environment:
   ```powershell
   cd "C:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\api"
   .venv\Scripts\Activate.ps1
   ```
4. Run the test script:
   ```powershell
   python scripts\test_api.py
   ```
5. You should see a highly detailed output showing exactly what the AI Engine computed, including MACD flips, Writers Zone regime, and the final signal confidence score.

---

## 🤖 Phase 4: Training the AI Model (The Future)

Right now, the engine is running in **RULES_FALLBACK** mode. It uses the exact same 25-step logic as your v3.0 JS engine. 

To upgrade it to **AI_ENSEMBLE** mode, you must train the XGBoost model. **You cannot do this until you have collected at least 3-4 weeks (approx. 1500+ intervals) of live market logs via your v4.0 n8n workflow.**

Once you have enough data logged in Google Sheets:

### Step 1: Export Data
1. Go to your new Nifty AI v4.0 data Google Sheet: `https://docs.google.com/spreadsheets/d/1NILZ2uOrbBMQ1sw_2shGpsAx6sQzTiAvBpIh7qYU4Sk/edit?usp=sharing`
2. Download the data as a CSV file.
3. Save it to `project/api/data/historical_signals.csv` (you will need to create the `data/` folder).

### Step 2: Train the Model
1. Open PowerShell, navigate to `api`, and activate the environment (`.venv\Scripts\Activate.ps1`).
2. Run the training script:
   ```powershell
   python scripts\train_model.py
   ```
3. The script will automatically:
   - Load the CSV.
   - Run the Feature Engineer (`preprocessor.py`) over every row.
   - Balance the dataset (since WAIT signals heavily outnumber BUY signals).
   - Train the XGBoost Decision Tree.
   - Save the trained binary model directly to `models/xgboost_model.pkl`.

### Step 3: Switch to AI Inference
1. Stop your local server (`Ctrl+C` in the `start_server.bat` window).
2. Start it again by double-clicking `start_server.bat`.
3. The `signal_engine.py` orchestrator will instantly detect the `xgboost_model.pkl` file on startup.
4. Go to `http://localhost:8000/health`.
5. It will now say `{"status": "healthy", "engine_mode": "AI_ENSEMBLE"}`.
6. The AI is now making predictions natively based on your historical data patterns instead of fixed rules!

---

## 🔄 Toggling Between AI and Rules

What if your XGBoost model is fully trained, but it is taking bad trades, and you want to **instantly force the system to go back to the classic v3.0 logic** without deleting your model file?

You can do this using Environment Variables:

1. In your `project/api` folder, create a new file and name it exactly: `.env`
2. Open the file in a text editor (like Notepad or VS Code) and type this exactly:
   ```env
   FORCE_RULES=true
   ```
3. Save the file.
4. Stop `start_server.bat` and restart it.
5. You will see a message in the console: `"⚠️ FORCE_RULES=true detected. Bypassing AI model..."`

When you want the AI back, simply change `true` to `false` in that file and restart the server.
