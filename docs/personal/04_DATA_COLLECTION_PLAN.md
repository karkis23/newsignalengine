# 04 — Data Collection Plan: How We Train the AI
*Discussed: March 2026*

---

## The Core Concept: Teaching the AI Requires Labeled Data

An AI cannot learn from raw market data alone. It needs to know not just what the market looked like (the 57 features), but also what ACTUALLY happened after (did the market go up or down in the next 60 minutes?). This pairing is called "labeled data."

---

## Step 1: Collect Raw Data (Happening Now)
The Google Sheet is logging every 5-minute market snapshot. Each row contains:
- All 57 features (RSI, MACD, GEX, IV Skew, Spot Price, etc.)
- What signal the rule engine predicted
- Timestamps

**Target:** 1,500 to 2,000 rows minimum. This takes approximately 4 to 6 weeks of trading days.

### Data Volume Hierarchy
| Level | Rows | Time | Reliability | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 1,500 - 2,000 | 1 Month | Medium | Basic trend detection |
| **Better** | 5,000 | 4 Months | High | Strong regime detection (Recommended) |
| **Professional** | 10,000+ | 8+ Months | Excellent | Veteran-level patterns & fakeout detection |

**Important:** Do NOT change any code during this phase. If you add a new feature midway, earlier rows will have a "hole" in that column, which confuses the AI.


---

## Step 2: The Look-Ahead Labeler (The Grading Script)

The rule engine's signal (BUY CE, BUY PE, WAIT) is NOT the label we train on. It is just a guess. The training label should be the ACTUAL TRUTH of what the market did.

The Look-Ahead Labeler script works like this:

1. Opens the CSV file.
2. Looks at Row #1 (e.g., 10:15 AM, NIFTY at 22,000).
3. Scans ahead through the next 10–12 rows (i.e., 60 minutes into the future).
4. Checks: Did NIFTY hit 22,025 (= +25 points target) first?
   - YES → Labels as `0` (BUY CE was the correct call)
5. Checks: Did NIFTY hit 21,975 (= -25 points) first?
   - YES → Labels as `1` (BUY PE was the correct call)
6. If neither +25 nor -25 was hit within 60 minutes → Labels as `2` (WAIT / neither worked)
7. Repeats this for EVERY single row in the CSV.

The output is a new file called `training_data.csv` with a perfect `label` column added.

---

## Step 3: Run the Training Script

```powershell
python scripts/train_model.py --data training_data.csv
```

The training script will:
1. Load the CSV and separate the 57 feature columns from the label column.
2. Split the data 80/20: 80% for training, 20% for testing/validation.
3. Balance the dataset (WAIT signals are more frequent, so CE/PE signals get upweighted).
4. Train the XGBoost classifier across 500 decision trees.
5. Test the model on the hidden 20% data.
6. Print the accuracy, confusion matrix, and classification report.
7. Save three files to `api/models/`:
   - `signal_xgb_v1.pkl` → The AI brain
   - `feature_scaler.pkl` → Normalizer
   - `feature_list.txt` → The 57 feature names in order

---

## Step 4: Auto-Activation

The next time the Python server starts, it detects the `.pkl` file and switches to AI_ENSEMBLE mode automatically. No n8n changes required.

---

## The Labeling Logic (Summary)

| Outcome within 60 mins | Label | Meaning |
|------------------------|-------|---------|
| NIFTY rose +25 points | `0` | BUY CALL (CE) was correct |
| NIFTY fell -25 points | `1` | BUY PUT (PE) was correct |
| Neither happened | `2` | WAIT was correct |

---

## Important Personal Note on This
We discussed that the Look-Ahead Labeler script has NOT been written yet. It will be built when you return with 1,500+ rows of data. At that point, I will write the exact labeler script tailored to your Google Sheet column structure and your specific profit target (currently set at +25 points for CE, -25 for PE).
