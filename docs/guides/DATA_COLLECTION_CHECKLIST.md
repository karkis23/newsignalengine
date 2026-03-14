# 📊 Phase 1: The Data Collection Protocol (Checklist & Tips)
**Date:** March 2026

You are entering the most critical phase of machine learning: **Data Collection**. For the next 1 to 2 months, your primary job is to gather the highest quality data possible. The smarter your data, the smarter your AI will become.

Here is your daily, weekly, and general protocol to ensure absolute success.

---

## 📅 Daily Checklist (Trading Days)

This must be completed **before 09:15 AM IST** every trading day.

- [ ] **Start the Python Engine:** 
  - Navigate to `api/` and run `start_server.bat`. 
  - Keep this black console window open all day. If it closes, the engine is dead!
- [ ] **Verify Python is Healthy:** 
  - Go to `http://localhost:8000/health` in your browser. 
  - Ensure it prints: `{"status": "healthy", "engine_mode": "RULES_FALLBACK"}`.
- [ ] **Check n8n is Active:** 
  - Open n8n and ensure your `v4.0_AI_TEST` workflow is activated and set to run every 5 minutes automatically.
- [ ] **Start the React Dashboard (Optional but Recommended):** 
  - Run `npm run dev` in your `project/` folder so you can watch what the bot is thinking live on your screen.

---

## 🧹 Weekly Checklist (Friday Evenings)

- [ ] **Verify the Google Sheet Logging:** 
  - Open your AI Dataset Google Sheet. 
  - Scroll to the bottom and ensure the data is continuously adding new rows every 5 minutes.
  - ***Warning:*** *Check that columns like `gammaExposure`, `ADX`, and `macd_histogram` actually have numbers in them. If they are completely blank, a data feed (like Angel One or TradingView) might have broken.*
- [ ] **Backup the Data:** 
  - At the end of every week, go to `File -> Download -> .csv` in Google Sheets. 
  - Save a backup copy to your local machine (e.g., `backup_week1.csv`). If Google Sheets ever gets corrupted, you will not lose your hard work.
- [ ] **Check Local Python Logs:** 
  - Scroll through the black Python console window. Are there giant red error blocks? If so, note them down. (A few occasional errors are normal if a websocket drops, but constant red errors mean an API token expired).

---

## 💡 Pro-Tips for the Next 2 Months

### 1. 🚨 DO NOT TOUCH THE CODE
Once the engine is running and logging correctly, **do not change the `rule_engine.py` logic or the `preprocessor.py` 57 features.** 
If you add a new feature halfway through the month, your CSV will have "holes" in it. Machine learning algorithms hate missing data. Keep the code exactly as it is until the training phase.

### 2. Embrace the "Bad" Trades
When the rules engine takes a terrible trade (buys a breakout that immediately crashes), **smile.** That failure is being logged into the Google Sheet. When the AI trains, it will look at that exact timestamp and learn precisely what a "fake-out" looks like. The more traps the rule engine falls for now, the smarter the AI will be later. Let it fail!

### 3. Record Major News Events Manually
If there is a massive macro-economic event (e.g., RBI Rate Hike, Election Results, massive global crash), write the date down on a sticky note. 
When we train the model, we can decide if we want to "delete" that day from the AI's training data. Sometimes, "Black Swan" events can confuse an AI into learning weird patterns. 

### 4. Watch the API Limits
Since n8n is pulling data from Angel One and TradingView every 5 minutes, ensure your brokerage API tokens or TradingView cookies haven't expired. If the bot stops logging entirely, check n8n first.

---

## 🚀 The Finish Line (What Happens Next?)

When you reach **1,500 to 2,000 rows** in your Google Sheet (approx 4-6 weeks of trading):
1. Reach out.
2. We will write the "Look-Ahead Labeler" script.
3. We will perfectly grade your entire 1,500 rows.
4. We will run `train_model.py`.
5. We will launch **v4.0 AI_ENSEMBLE Mode**.

*Have patience, and let the data flow!*
