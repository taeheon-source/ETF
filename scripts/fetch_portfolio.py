import json
import os
import sys
from datetime import datetime, timedelta

try:
    from pykrx import stock
except ImportError:
    print("pykrx 설치 필요: pip install pykrx")
    sys.exit(1)

ETF_LIST = [
    {"name": "1Q 단기금융채액티브",      "key": "1q",         "ticker": "463290"},
    {"name": "TIGER 단기채권액티브",      "key": "tiger",      "ticker": "272580"},
    {"name": "KOSEF 단기자금",            "key": "kosef",      "ticker": "130730"},
    {"name": "RISE 단기국공채액티브",     "key": "rise",       "ticker": "272560"},
    {"name": "히어로즈 단기채권ESG액티브","key": "heroes",     "ticker": "419890"},
    {"name": "KODEX 단기채권PLUS",        "key": "kodex-plus", "ticker": "214980"},
    {"name": "KODEX 단기채권",            "key": "kodex",      "ticker": "153130"},
]

def latest_business_day():
    d = datetime.now()
    # KST 기준 오후 4시 이전이면 전전 영업일, 이후면 전 영업일
    if d.hour < 7:  # UTC 7시 = KST 16시
        d -= timedelta(days=1)
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d.strftime("%Y%m%d")

def safe_val(v):
    if hasattr(v, "item"):
        return v.item()
    return v

def main():
    os.makedirs("data/portfolio", exist_ok=True)
    date = latest_business_day()
    print(f"기준일: {date}")

    all_results = {}

    for etf in ETF_LIST:
        key = etf["key"]
        name = etf["name"]
        ticker = etf["ticker"]
        try:
            df = stock.get_etf_portfolio_deposit_file(ticker, date)
            if df is None or df.empty:
                print(f"  ✗ {name}: 데이터 없음 (ticker={ticker}, date={date})")
                continue

            df = df.reset_index()
            holdings = []
            for _, row in df.iterrows():
                record = {k: safe_val(v) for k, v in row.items()}
                holdings.append(record)

            payload = {
                "name": name,
                "ticker": ticker,
                "date": date,
                "columns": list(df.columns),
                "holdings": holdings,
            }
            all_results[key] = payload

            out_path = f"data/portfolio/{key}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2, default=str)
            print(f"  ✓ {name}: {len(holdings)}개 종목 → {out_path}")

        except Exception as e:
            print(f"  ✗ {name}: 오류 - {e}")

    summary = {
        "updatedAt": date,
        "etfs": {k: {"name": v["name"], "ticker": v["ticker"], "date": v["date"], "count": len(v["holdings"])} for k, v in all_results.items()},
    }
    with open("data/portfolio/index.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n완료: {len(all_results)}/{len(ETF_LIST)}개 ETF 저장")

if __name__ == "__main__":
    main()
