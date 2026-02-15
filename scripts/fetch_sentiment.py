#!/usr/bin/env python3
"""
fetch_sentiment.py
==================
Collects crypto market sentiment data from two free, keyless APIs:

1. **Fear & Greed Index** from alternative.me
   - Historical daily values (0 = extreme fear, 100 = extreme greed)

2. **Global market cap & dominance** from CoinGecko
   - Total market cap, BTC/ETH dominance, 24h volume
   - Top coin market caps for context

Output files (written to /home/user/tokenrevenueproject/data/)
--------------------------------------------------------------
- fear_greed.json          : full Fear & Greed history
- coingecko_market.json    : global market stats + top coin data

Usage
-----
    python3 scripts/fetch_sentiment.py
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# Rate limiting: seconds to wait between API requests
RATE_LIMIT_SECONDS = 1.5  # CoinGecko free tier is strict — be conservative

# CoinGecko free API base URL
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def ensure_data_dir():
    """Create the data output directory if it does not exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"[INFO] Output directory: {DATA_DIR}")


def rate_limit():
    """Sleep to respect rate limits between API calls."""
    time.sleep(RATE_LIMIT_SECONDS)


def save_json(filename: str, data) -> None:
    """Write *data* as pretty-printed JSON to DATA_DIR/filename."""
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as fh:
        json.dump(data, fh, indent=2, default=str)
    print(f"[INFO] Saved {path}")


def safe_get(url: str, params: dict | None = None, timeout: int = 30) -> dict | list | None:
    """
    Perform a GET request with full error handling.

    Returns parsed JSON on success, None on any failure.
    """
    print(f"  -> GET {url}")
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        if resp.status_code == 429:
            # Rate-limited — back off and retry once
            print("     [WARN] Rate-limited (429). Waiting 60 s and retrying ...")
            time.sleep(60)
            resp = requests.get(url, params=params, timeout=timeout)
        if resp.status_code == 404:
            print(f"     [WARN] 404 Not Found — skipping")
            return None
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.HTTPError as exc:
        print(f"     [ERROR] HTTP {exc.response.status_code}: {exc}")
        return None
    except requests.exceptions.ConnectionError as exc:
        print(f"     [ERROR] Connection error: {exc}")
        return None
    except requests.exceptions.Timeout:
        print(f"     [ERROR] Request timed out")
        return None
    except requests.exceptions.RequestException as exc:
        print(f"     [ERROR] Request failed: {exc}")
        return None
    except json.JSONDecodeError:
        print(f"     [ERROR] Invalid JSON in response")
        return None


# ---------------------------------------------------------------------------
# Fear & Greed Index
# ---------------------------------------------------------------------------


def fetch_fear_greed() -> dict:
    """
    Fetch the full history of the Crypto Fear & Greed Index.

    API docs: https://alternative.me/crypto/fear-and-greed-index/#api

    Returns a dict with:
        - metadata : name, data source info
        - data     : list of daily readings [{value, value_classification, timestamp, ...}]
        - summary  : basic stats (count, earliest, latest, average)
    """
    print("\n=== Fetching Fear & Greed Index ===")
    url = "https://api.alternative.me/fng/"
    params = {
        "limit": 0,           # 0 = all available data
        "date_format": "us",  # US-style date strings
    }

    raw = safe_get(url, params=params)
    rate_limit()

    result: dict = {"metadata": {}, "data": [], "summary": {}}

    if raw is None:
        print("     [WARN] Could not retrieve Fear & Greed data")
        return result

    # The API wraps data in {"name": ..., "data": [...], "metadata": {...}}
    result["metadata"] = {
        "name": raw.get("name", "Crypto Fear & Greed Index"),
        "source": "https://alternative.me/crypto/fear-and-greed-index/",
    }

    entries = raw.get("data", [])
    result["data"] = entries

    # Compute quick summary
    if entries:
        values = []
        for e in entries:
            try:
                values.append(int(e.get("value", 0)))
            except (TypeError, ValueError):
                continue
        result["summary"] = {
            "total_entries": len(entries),
            "earliest_date": entries[-1].get("timestamp") if entries else None,
            "latest_date": entries[0].get("timestamp") if entries else None,
            "average_value": round(sum(values) / len(values), 2) if values else None,
            "min_value": min(values) if values else None,
            "max_value": max(values) if values else None,
        }
        print(f"     Retrieved {len(entries)} daily readings")
        print(f"     Average index value: {result['summary']['average_value']}")
    else:
        print("     [WARN] No data entries found in response")

    return result


# ---------------------------------------------------------------------------
# CoinGecko — Global market data
# ---------------------------------------------------------------------------


def fetch_coingecko_global() -> dict:
    """
    Fetch global crypto market statistics from CoinGecko.

    Returns total market cap, volume, BTC/ETH dominance, etc.
    """
    print("\n=== Fetching CoinGecko global market data ===")
    data = safe_get(f"{COINGECKO_BASE}/global")
    rate_limit()

    if data is None or "data" not in data:
        print("     [WARN] Could not retrieve global market data")
        return {}

    gd = data["data"]
    result = {
        "total_market_cap_usd": gd.get("total_market_cap", {}).get("usd"),
        "total_volume_24h_usd": gd.get("total_volume", {}).get("usd"),
        "market_cap_percentage": gd.get("market_cap_percentage", {}),
        "active_cryptocurrencies": gd.get("active_cryptocurrencies"),
        "markets": gd.get("markets"),
        "market_cap_change_24h_pct": gd.get("market_cap_change_percentage_24h_usd"),
        "updated_at": gd.get("updated_at"),
    }
    if result["total_market_cap_usd"]:
        print(f"     Total market cap: ${result['total_market_cap_usd']:,.0f}")
    btc_dom = gd.get("market_cap_percentage", {}).get("btc")
    if btc_dom:
        print(f"     BTC dominance: {btc_dom:.1f}%")
    return result


def fetch_coingecko_top_coins() -> list[dict]:
    """
    Fetch top coins by market cap from CoinGecko.

    Returns a cleaned list of coin data (top 50).
    """
    print("\n=== Fetching CoinGecko top coins ===")
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 50,
        "page": 1,
        "sparkline": "false",
    }
    data = safe_get(f"{COINGECKO_BASE}/coins/markets", params=params)
    rate_limit()

    if data is None or not isinstance(data, list):
        print("     [WARN] Could not retrieve top coins data")
        return []

    # Slim down the response to the fields we care about
    coins = []
    for coin in data:
        coins.append({
            "id": coin.get("id"),
            "symbol": coin.get("symbol"),
            "name": coin.get("name"),
            "market_cap": coin.get("market_cap"),
            "market_cap_rank": coin.get("market_cap_rank"),
            "current_price": coin.get("current_price"),
            "total_volume": coin.get("total_volume"),
            "price_change_24h_pct": coin.get("price_change_percentage_24h"),
            "ath": coin.get("ath"),
            "ath_date": coin.get("ath_date"),
            "circulating_supply": coin.get("circulating_supply"),
            "total_supply": coin.get("total_supply"),
        })

    print(f"     Retrieved data for {len(coins)} coins")
    if coins:
        print(f"     Top coin: {coins[0]['name']} (${coins[0].get('current_price', 'N/A'):,})")
    return coins


def fetch_coingecko_market_chart() -> dict:
    """
    Fetch 365-day market cap chart for Bitcoin as a proxy for overall
    market sentiment trend.
    """
    print("\n=== Fetching BTC 1-year market chart (sentiment proxy) ===")
    params = {
        "vs_currency": "usd",
        "days": 365,
        "interval": "daily",
    }
    data = safe_get(f"{COINGECKO_BASE}/coins/bitcoin/market_chart", params=params)
    rate_limit()

    if data is None:
        print("     [WARN] Could not retrieve BTC market chart")
        return {}

    result = {
        "coin": "bitcoin",
        "vs_currency": "usd",
        "days": 365,
        "prices_count": len(data.get("prices", [])),
        "market_caps_count": len(data.get("market_caps", [])),
        "total_volumes_count": len(data.get("total_volumes", [])),
        # Store the actual data points
        "prices": data.get("prices", []),
        "market_caps": data.get("market_caps", []),
        "total_volumes": data.get("total_volumes", []),
    }
    print(f"     Retrieved {result['prices_count']} daily price points")
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    start = time.time()
    print("=" * 60)
    print("Sentiment & Market Data Collection Script")
    print(f"Started at {datetime.now(tz=timezone.utc).isoformat()}")
    print("=" * 60)

    ensure_data_dir()

    # ---- Fear & Greed Index ----
    fear_greed = fetch_fear_greed()
    save_json("fear_greed.json", fear_greed)

    # ---- CoinGecko data ----
    coingecko_data: dict = {}

    coingecko_data["global"] = fetch_coingecko_global()
    coingecko_data["top_coins"] = fetch_coingecko_top_coins()
    coingecko_data["btc_market_chart_1y"] = fetch_coingecko_market_chart()

    # Add a collection timestamp
    coingecko_data["collected_at"] = datetime.now(tz=timezone.utc).isoformat()

    save_json("coingecko_market.json", coingecko_data)

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"Done! Completed in {elapsed:.1f} seconds.")
    print(f"Files written to {DATA_DIR}/")
    print("  - fear_greed.json")
    print("  - coingecko_market.json")
    print("=" * 60)


if __name__ == "__main__":
    main()
