# ============================================================
# scripts/test_api.py
# Local API Test Script — Test the running FastAPI server.
# Version: 4.0.0 | Date: 08 March 2026
#
# Usage: python scripts/test_api.py
# Make sure the server is running: uvicorn main:app --reload
# ============================================================

import json
import requests
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    print("=== Health Check ===")
    r = requests.get(f"{BASE_URL}/health")
    print(json.dumps(r.json(), indent=2))

def test_predict():
    print("\n=== Signal Prediction Test ===")

    # Simulated payload that n8n would send
    payload = {
        "spotLTP": 22450.5,
        "vix": 14.3,
        "atmStrike": 22450.0,
        "currentIST": "2026-03-08T10:05:00+05:30",
        "sessionDate": "2026-03-08",

        # Simulated 5-min OHLCV candles (last 50 bars)
        "angelOneCandles": [
            ["2026-03-08 09:15:00", 22300, 22340, 22280, 22310, 450000],
            ["2026-03-08 09:20:00", 22310, 22380, 22300, 22360, 520000],
            ["2026-03-08 09:25:00", 22360, 22420, 22350, 22390, 610000],
            ["2026-03-08 09:30:00", 22390, 22450, 22370, 22430, 480000],
            ["2026-03-08 09:35:00", 22430, 22480, 22410, 22460, 540000],
            ["2026-03-08 09:40:00", 22460, 22500, 22430, 22475, 510000],
            ["2026-03-08 09:45:00", 22475, 22520, 22450, 22505, 580000],
            ["2026-03-08 09:50:00", 22505, 22540, 22480, 22520, 490000],
            ["2026-03-08 09:55:00", 22520, 22560, 22495, 22545, 470000],
            ["2026-03-08 10:00:00", 22545, 22580, 22510, 22560, 520000],
            ["2026-03-08 10:05:00", 22560, 22600, 22540, 22580, 600000],
        ],

        # Simulated option chain (minimal test data)
        "optionChainRaw": {
            "22300": {
                "ce": {"last_price": 180.5, "oi": 500000, "previous_oi": 450000, "implied_volatility": 14.5, "average_price": 160.0,
                       "greeks": {"delta": 0.72, "gamma": 0.0012, "theta": -3.5, "vega": 0.45}},
                "pe": {"last_price": 25.0, "oi": 200000, "previous_oi": 220000, "implied_volatility": 13.0, "average_price": 30.0,
                       "greeks": {"delta": -0.28, "gamma": 0.0012, "theta": -2.1, "vega": 0.35}}
            },
            "22450": {
                "ce": {"last_price": 95.0, "oi": 800000, "previous_oi": 700000, "implied_volatility": 13.8, "average_price": 80.0,
                       "greeks": {"delta": 0.52, "gamma": 0.0018, "theta": -4.2, "vega": 0.55}},
                "pe": {"last_price": 60.5, "oi": 750000, "previous_oi": 780000, "implied_volatility": 14.2, "average_price": 70.0,
                       "greeks": {"delta": -0.48, "gamma": 0.0018, "theta": -4.0, "vega": 0.54}}
            },
            "22600": {
                "ce": {"last_price": 35.0, "oi": 1200000, "previous_oi": 1100000, "implied_volatility": 13.5, "average_price": 25.0,
                       "greeks": {"delta": 0.28, "gamma": 0.0015, "theta": -3.8, "vega": 0.48}},
                "pe": {"last_price": 120.0, "oi": 300000, "previous_oi": 280000, "implied_volatility": 14.8, "average_price": 130.0,
                       "greeks": {"delta": -0.72, "gamma": 0.0015, "theta": -3.2, "vega": 0.46}}
            }
        }
    }

    r = requests.post(f"{BASE_URL}/api/predict", json=payload)
    if r.status_code == 200:
        result = r.json()
        print(f"\n📊 SIGNAL: {result['finalSignal']}")
        print(f"   Confidence: {result['confidence']}")
        print(f"   Regime: {result['regime']}")
        print(f"   ADX: {result['ADX']}")
        print(f"   RSI: {result['RSI']}")
        print(f"   SuperTrend: {result['SuperTrend']}")
        print(f"   Writers Zone: {result['writersZone']}")
        print(f"   Max Pain: {result['maxPain']}")
        print(f"   Engine: {result['engineVersion']}")
        print(f"   Processing: {result['processingTimeMs']}ms")
        print(f"\n   Reason: {result['reason']}")
        if result.get("ai_insights"):
            print(f"\n   AI Insights:")
            for insight in result["ai_insights"]:
                print(f"      • {insight}")
        print(f"\n   Full Response:\n{json.dumps(result, indent=2)}")
    else:
        print(f"❌ Error {r.status_code}: {r.text}")


def test_debug():
    print("\n=== Debug Endpoint Test ===")
    payload = {
        "spotLTP": 22450.5,
        "vix": 14.3,
        "atmStrike": 22450.0,
        "angelOneCandles": [
            ["2026-03-08 09:45:00", 22460, 22500, 22430, 22475, 510000],
            ["2026-03-08 09:50:00", 22475, 22520, 22450, 22505, 580000],
            ["2026-03-08 09:55:00", 22505, 22540, 22480, 22520, 490000],
        ],
        "optionChainRaw": {}
    }
    r = requests.post(f"{BASE_URL}/api/predict/debug", json=payload)
    print(json.dumps(r.json(), indent=2))


if __name__ == "__main__":
    test_health()
    test_predict()
    # Uncomment to test debug:
    # test_debug()
