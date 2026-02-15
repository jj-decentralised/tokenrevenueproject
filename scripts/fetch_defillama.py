#!/usr/bin/env python3
"""
fetch_defillama.py
==================
Collects protocol-level fees, revenue, and TVL data from DefiLlama's free
public API, organizes everything by quarter (Q1-2020 through present), and
writes three JSON files into /home/user/tokenrevenueproject/data/.

Output files
------------
- defillama_overview.json   : aggregate fees/revenue overview across all chains
- defillama_protocols.json  : per-protocol fees, revenue, and TVL for the key
                              protocols listed below
- defillama_historical_fees.json : quarterly fee/revenue time-series per protocol

Usage
-----
    python3 scripts/fetch_defillama.py
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

BASE_URL = "https://api.llama.fi"

# Key protocols to collect data for (DefiLlama slug names)
KEY_PROTOCOLS = [
    "aave",
    "uniswap",
    "lido",
    "maker",
    "hyperliquid",
    "jupiter",
    "raydium",
    "tether",
    "circle",
]

# Chains to pull per-chain fee breakdowns for
CHAINS = ["Ethereum", "Solana"]

# Output directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# Rate limiting: seconds to wait between API requests
RATE_LIMIT_SECONDS = 1.0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def ensure_data_dir():
    """Create the data output directory if it does not exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"[INFO] Output directory: {DATA_DIR}")


def rate_limit():
    """Sleep to respect the rate limit between API calls."""
    time.sleep(RATE_LIMIT_SECONDS)


def api_get(path: str, params: dict | None = None) -> dict | list | None:
    """
    Make a GET request to the DefiLlama API.

    Returns the parsed JSON on success, or None if the request fails.
    Handles 404s and other HTTP errors gracefully.
    """
    url = f"{BASE_URL}{path}"
    print(f"  -> GET {url}")
    try:
        resp = requests.get(url, params=params, timeout=30)
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


def unix_to_quarter(ts: int | float) -> str:
    """
    Convert a UNIX timestamp (seconds) to a quarter string like '2023-Q1'.
    """
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    quarter = (dt.month - 1) // 3 + 1
    return f"{dt.year}-Q{quarter}"


def build_quarter_range() -> list[str]:
    """
    Return a sorted list of quarter strings from Q1-2020 to the current quarter.
    """
    now = datetime.now(tz=timezone.utc)
    current_year = now.year
    current_quarter = (now.month - 1) // 3 + 1
    quarters = []
    for year in range(2020, current_year + 1):
        for q in range(1, 5):
            label = f"{year}-Q{q}"
            if year == current_year and q > current_quarter:
                break
            quarters.append(label)
    return quarters


def aggregate_by_quarter(data_points: list[dict], value_key: str) -> dict[str, float]:
    """
    Given a list of dicts with 'date' (unix ts) and a numeric value key,
    aggregate (sum) values by quarter.
    """
    buckets: dict[str, float] = {}
    for point in data_points:
        ts = point.get("date")
        val = point.get(value_key)
        if ts is None or val is None:
            continue
        try:
            val = float(val)
        except (TypeError, ValueError):
            continue
        q = unix_to_quarter(ts)
        buckets[q] = buckets.get(q, 0.0) + val
    return buckets


def save_json(filename: str, data) -> None:
    """Write *data* as pretty-printed JSON to DATA_DIR/filename."""
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as fh:
        json.dump(data, fh, indent=2, default=str)
    print(f"[INFO] Saved {path}")


# ---------------------------------------------------------------------------
# Data collection functions
# ---------------------------------------------------------------------------


def fetch_overview() -> dict:
    """
    Fetch the aggregate fees/revenue overview and historical total TVL.

    Returns a dict with keys:
        - total_tvl_history : quarterly aggregated TVL
        - fees_overview     : raw overview response (top-level stats)
        - chain_fees        : per-chain fee summaries
    """
    print("\n=== Fetching overview data ===")
    result: dict = {}

    # 1. Historical total TVL -------------------------------------------------
    print("[1/3] Historical chain TVL ...")
    tvl_data = api_get("/v2/historicalChainTvl")
    rate_limit()

    if tvl_data and isinstance(tvl_data, list):
        result["total_tvl_history"] = aggregate_by_quarter(tvl_data, "tvl")
    else:
        result["total_tvl_history"] = {}

    # 2. Fees / revenue overview -----------------------------------------------
    print("[2/3] Fees & revenue overview ...")
    fees_overview = api_get("/overview/fees", params={"excludeTotalDataChart": "false"})
    rate_limit()

    if fees_overview and isinstance(fees_overview, dict):
        # Keep high-level totals and the chart data
        result["fees_overview"] = {
            "totalDataChart": fees_overview.get("totalDataChart", []),
            "total24h": fees_overview.get("total24h"),
            "total7d": fees_overview.get("total7d"),
            "total30d": fees_overview.get("total30d"),
            "totalAllTime": fees_overview.get("totalAllTime"),
        }
        # Aggregate chart data by quarter
        chart = fees_overview.get("totalDataChart", [])
        if chart:
            # chart entries are [unix_ts, value]
            chart_dicts = [{"date": entry[0], "fees": entry[1]} for entry in chart if len(entry) >= 2]
            result["fees_overview"]["quarterly_fees"] = aggregate_by_quarter(chart_dicts, "fees")
    else:
        result["fees_overview"] = {}

    # 3. Per-chain fees --------------------------------------------------------
    print("[3/3] Per-chain fees ...")
    chain_fees: dict = {}
    for chain in CHAINS:
        print(f"  Chain: {chain}")
        data = api_get(f"/overview/fees/{chain}")
        rate_limit()
        if data and isinstance(data, dict):
            chain_fees[chain] = {
                "total24h": data.get("total24h"),
                "total7d": data.get("total7d"),
                "total30d": data.get("total30d"),
                "totalAllTime": data.get("totalAllTime"),
            }
            # Quarterly breakdown from chart if available
            chart = data.get("totalDataChart", [])
            if chart:
                chart_dicts = [{"date": e[0], "fees": e[1]} for e in chart if len(e) >= 2]
                chain_fees[chain]["quarterly_fees"] = aggregate_by_quarter(chart_dicts, "fees")
        else:
            chain_fees[chain] = None
    result["chain_fees"] = chain_fees

    return result


def fetch_all_protocols() -> dict:
    """
    Fetch the full protocol list from /protocols and extract TVL info for
    the key protocols.  Also fetch per-protocol fee summaries from
    /summary/fees/{protocol}.

    Returns a dict keyed by protocol slug.
    """
    print("\n=== Fetching protocol data ===")

    # 1. Bulk protocol list (gives TVL, chain, category, etc.) -----------------
    print("[1/2] Fetching full protocol list ...")
    all_protocols = api_get("/protocols")
    rate_limit()

    # Index by slug for quick lookup
    proto_index: dict = {}
    if all_protocols and isinstance(all_protocols, list):
        for p in all_protocols:
            slug = p.get("slug", "").lower()
            if slug:
                proto_index[slug] = p
        print(f"       Indexed {len(proto_index)} protocols")

    # 2. Per-protocol fee/revenue summaries ------------------------------------
    print("[2/2] Fetching per-protocol fee summaries ...")
    results: dict = {}

    for slug in KEY_PROTOCOLS:
        print(f"  Protocol: {slug}")
        summary = api_get(f"/summary/fees/{slug}")
        rate_limit()

        entry: dict = {"slug": slug}

        # Pull TVL and metadata from the bulk list
        bulk = proto_index.get(slug, {})
        entry["name"] = bulk.get("name", slug)
        entry["category"] = bulk.get("category")
        entry["chains"] = bulk.get("chains", [])
        entry["tvl"] = bulk.get("tvl")

        if summary and isinstance(summary, dict):
            entry["total24h_fees"] = summary.get("total24h")
            entry["total7d_fees"] = summary.get("total7d")
            entry["total30d_fees"] = summary.get("total30d")
            entry["totalAllTime_fees"] = summary.get("totalAllTime")
            entry["total24h_revenue"] = summary.get("totalRevenue24h") or summary.get("revenue24h")
            entry["totalAllTime_revenue"] = summary.get("totalAllTimeRevenue")
            entry["methodology"] = summary.get("methodology")
        else:
            entry["fees_available"] = False

        results[slug] = entry

    return results


def fetch_historical_fees() -> dict:
    """
    Build a quarterly fee/revenue time-series for each key protocol using
    the data chart embedded in /summary/fees/{protocol}.

    Returns a dict keyed by protocol slug, each containing a dict of
    quarter -> {fees, revenue}.
    """
    print("\n=== Fetching historical fee time-series per protocol ===")
    all_quarters = build_quarter_range()
    results: dict = {}

    for slug in KEY_PROTOCOLS:
        print(f"  Protocol: {slug}")
        summary = api_get(f"/summary/fees/{slug}")
        rate_limit()

        quarterly: dict = {q: {"fees": 0.0, "revenue": 0.0} for q in all_quarters}

        if summary and isinstance(summary, dict):
            # totalDataChart contains daily fee data as [[timestamp, value], ...]
            chart = summary.get("totalDataChart", [])
            if chart and isinstance(chart, list):
                for entry in chart:
                    if isinstance(entry, list) and len(entry) >= 2:
                        ts, val = entry[0], entry[1]
                    elif isinstance(entry, dict):
                        ts = entry.get("date")
                        val = entry.get("fees") or entry.get("value") or entry.get("dailyFees")
                    else:
                        continue
                    if ts is None or val is None:
                        continue
                    try:
                        val = float(val)
                    except (TypeError, ValueError):
                        continue
                    q = unix_to_quarter(ts)
                    if q in quarterly:
                        quarterly[q]["fees"] += val

            # totalDataChartBreakdown or revenue chart (if present)
            rev_chart = summary.get("totalDataChartBreakdown", [])
            if rev_chart and isinstance(rev_chart, list):
                for entry in rev_chart:
                    if isinstance(entry, list) and len(entry) >= 2:
                        ts = entry[0]
                        # entry[1] is often a dict of chain -> value
                        val_part = entry[1]
                        if isinstance(val_part, dict):
                            val = sum(float(v) for v in val_part.values() if v is not None)
                        else:
                            try:
                                val = float(val_part)
                            except (TypeError, ValueError):
                                continue
                    elif isinstance(entry, dict):
                        ts = entry.get("date")
                        val = entry.get("revenue") or entry.get("value") or 0
                    else:
                        continue
                    if ts is None:
                        continue
                    try:
                        val = float(val)
                    except (TypeError, ValueError):
                        continue
                    q = unix_to_quarter(ts)
                    if q in quarterly:
                        quarterly[q]["revenue"] += val

        # Strip quarters with no data (both fees and revenue are 0)
        quarterly = {q: v for q, v in quarterly.items() if v["fees"] != 0 or v["revenue"] != 0}
        results[slug] = quarterly

    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    start = time.time()
    print("=" * 60)
    print("DefiLlama Data Collection Script")
    print(f"Started at {datetime.now(tz=timezone.utc).isoformat()}")
    print(f"Key protocols: {', '.join(KEY_PROTOCOLS)}")
    print("=" * 60)

    ensure_data_dir()

    # 1. Overview data (TVL + fees aggregate + per-chain)
    overview = fetch_overview()
    save_json("defillama_overview.json", overview)

    # 2. Per-protocol snapshot (TVL, fees, revenue, metadata)
    protocols = fetch_all_protocols()
    save_json("defillama_protocols.json", protocols)

    # 3. Historical quarterly fee/revenue series per protocol
    historical = fetch_historical_fees()
    save_json("defillama_historical_fees.json", historical)

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"Done! Completed in {elapsed:.1f} seconds.")
    print(f"Files written to {DATA_DIR}/")
    print("  - defillama_overview.json")
    print("  - defillama_protocols.json")
    print("  - defillama_historical_fees.json")
    print("=" * 60)


if __name__ == "__main__":
    main()
