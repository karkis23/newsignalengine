import requests
import pandas as pd
from datetime import datetime

# Step 1: Setup
ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzUzNDc2MDI1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwNzg0MzE3NCJ9.X8lZdN2JzPw9EYG0-cmr_L378Uc_EOEuUhcjD2Cn-rQFFRWpmZtd2bG_b3nRuH5gr41ZtPzTNU7efT6L0MJ4aA"  # Replace with your Dhan token
MASTER_URL = "https://api.dhan.co/instruments-master/download"  # Static endpoint
OUTPUT_PATH = "nifty_options_filtered.csv"

headers = {
    "access-token": ACCESS_TOKEN
}

# Step 2: Download the full instrument master file
response = requests.get(MASTER_URL, headers=headers)
if response.status_code != 200:
    raise Exception(f"Failed to download: {response.status_code} - {response.text}")

with open("full_master.csv", "wb") as f:
    f.write(response.content)

# Step 3: Filter for NIFTY OPTIDX only
df = pd.read_csv("full_master.csv")

# Ensure the exact column names match (sample: SEM_EXCHANGE, SEM_NAME etc.)
nifty_df = df[
    (df["SEM_EXCHANGE"] == "NFO") &
    (df["SEM_NAME"] == "NIFTY") &
    (df["SEM_INSTRUMENT_TYPE"] == "OPTIDX") &
    (df["SEM_OPTION_TYPE"].isin(["CE", "PE"]))
]

# Optional: Filter only for nearest expiry
nifty_df["SEM_EXPIRY_DATE"] = pd.to_datetime(nifty_df["SEM_EXPIRY_DATE"], errors='coerce')
nearest_expiry = nifty_df["SEM_EXPIRY_DATE"].min()
nifty_df = nifty_df[nifty_df["SEM_EXPIRY_DATE"] == nearest_expiry]

# Step 4: Save the filtered CSV
nifty_df.to_csv(OUTPUT_PATH, index=False)
print(f"[✅] Saved filtered file: {OUTPUT_PATH}")
