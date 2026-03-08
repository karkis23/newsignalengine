"""
models/ directory — DO NOT DELETE this file.
Trained model artifacts are stored here:

  signal_xgb_v1.pkl     - Trained XGBoost classifier
  feature_scaler.pkl     - StandardScaler fitted on training data
  feature_list.txt       - Ordered list of feature column names
  training_report.json   - Accuracy metrics from last training run

To train the model:
  python scripts/train_model.py --data data/training_data.csv
"""
