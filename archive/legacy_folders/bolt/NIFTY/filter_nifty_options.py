import pandas as pd
import requests
from datetime import datetime, timedelta

# === 1. Download full Dhan Option Master CSV ===
url = "https://images.dhan.co/api-data/dhan-instruments.csv"
r = requests.get(url)

raw_csv = "full_option_master.csv"
with open(raw_csv, "wb") as f:
    f.write(r.content)

# === 2. Load into DataFrame ===
df = pd.read_csv(raw_csv)

# === 3. Find upcoming Thursday expiry ===
today = datetime.now()
days_until_thu = (3 - today.weekday()) % 7
if days_until_thu == 0 and today.hour >= 15:
    days_until_thu = 7  # past expiry time today
expiry = (today + timedelta(days=days_until_thu)).strftime('%d-%b-%Y').upper()

# === 4. Filter NIFTY CE/PE ===
filtered = df[
    (df['SEM_EXCH_ID'] == 'NSE_FNO') &
    (df['SEM_INS_TYPE'] == 'OPTIDX') &
    (df['SEM_NAME'] == 'NIFTY') &
    (df['SEM_EXPIRY_DATE'] == expiry) &
    (df['SEM_OPTION_TYPE'].isin(['CE', 'PE']))
]

# === 5. Save as small CSV ===
filtered.to_csv("nifty_options.csv", index=False)
print(f"[✔] Saved filtered NIFTY option data ({len(filtered)} rows)")
