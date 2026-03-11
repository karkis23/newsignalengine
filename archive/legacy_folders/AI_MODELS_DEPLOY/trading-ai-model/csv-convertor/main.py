import pandas as pd
import requests
import json
import math

# --- CONFIG ---
DHAN_MASTER_URL = "https://images-dhan.dhan.co/api-data/api-scrip-master.csv"
NIFTY_SPOT_API = "https://api.dhan.co/market/feed/indices/NSE_INDEX/NIFTY%2050"

# Replace with your actual token
DHAN_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzU0MDA4NDgzLCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwNzg0MzE3NCJ9.CEeMBORRorG4EDqxi2sKX9-gQVOXgSpURdLL4ST33SwFQ0sNH2IFRMWm7jQUYCuRU5wMlCNVwJO3e7pz5NoOlQ"
HEADERS = {"access-token": DHAN_API_KEY}


def download_master_csv(filepath="dhan_master.csv"):
    print("⬇️  Downloading Dhan instrument master file...")
    resp = requests.get(DHAN_MASTER_URL)
    resp.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(resp.content)
    print("✅ Downloaded and saved to", filepath)


def get_nifty_spot():
    print("📈 Fetching NIFTY spot price...")
    resp = requests.get(NIFTY_SPOT_API, headers=HEADERS)
    resp.raise_for_status()
    data = resp.json()
    spot = float(data["payload"]["lastTradedPrice"]) / 100  # Dhan returns in paise
    print(f"✅ NIFTY Spot: {spot}")
    return spot


def filter_options(filepath, spot_price, strike_range=3):
    print("🔍 Filtering option instruments (ATM ±", strike_range, ")")
    df = pd.read_csv(filepath)

    # Filter for NIFTY options (weekly and monthly)
    df = df[df["segment"] == "NFO-OPT"]
    df = df[df["name"] == "NIFTY"]
    df = df[df["instrument_type"].isin(["OPTIDX"])]

    df["strike"] = pd.to_numeric(df["strike"], errors="coerce")
    atm = round(spot_price / 50) * 50

    min_strike = atm - (strike_range * 50)
    max_strike = atm + (strike_range * 50)

    filtered = df[
        (df["strike"] >= min_strike)
        & (df["strike"] <= max_strike)
        & (df["expiry"].notna())
        & (df["symbol"].notna())
    ]

    print(f"✅ Filtered {len(filtered)} records between {min_strike} and {max_strike}")
    return filtered.to_dict(orient="records")


def main():
    try:
        download_master_csv()
        spot_price = get_nifty_spot()
        result = filter_options("dhan_master.csv", spot_price)

        with open("filtered_options.json", "w") as f:
            json.dump(result, f, indent=2)

        print("📦 Saved filtered JSON to filtered_options.json")

    except Exception as e:
        print("❌ Error:", e)


if __name__ == "__main__":
    main()
