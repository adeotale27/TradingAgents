NIFTY_50 = [
    ("RELIANCE.NS", "Reliance Industries", "Energy"),
    ("HDFCBANK.NS", "HDFC Bank", "Banking"),
    ("BHARTIARTL.NS", "Bharti Airtel", "Telecom"),
    ("TCS.NS", "Tata Consultancy Services", "IT"),
    ("ICICIBANK.NS", "ICICI Bank", "Banking"),
    ("SBIN.NS", "State Bank of India", "Banking"),
    ("INFY.NS", "Infosys", "IT"),
    ("HINDUNILVR.NS", "Hindustan Unilever", "FMCG"),
    ("ITC.NS", "ITC", "FMCG"),
    ("LT.NS", "Larsen & Toubro", "Infrastructure"),
    ("BAJFINANCE.NS", "Bajaj Finance", "Financial Services"),
    ("HCLTECH.NS", "HCL Technologies", "IT"),
    ("MARUTI.NS", "Maruti Suzuki", "Auto"),
    ("SUNPHARMA.NS", "Sun Pharmaceutical", "Pharma"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"),
    ("AXISBANK.NS", "Axis Bank", "Banking"),
    ("NTPC.NS", "NTPC", "Power"),
    ("ULTRACEMCO.NS", "UltraTech Cement", "Cement"),
    ("TITAN.NS", "Titan Company", "Consumer"),
    ("ASIANPAINT.NS", "Asian Paints", "Consumer"),
    ("POWERGRID.NS", "Power Grid", "Power"),
    ("NESTLEIND.NS", "Nestle India", "FMCG"),
    ("TATASTEEL.NS", "Tata Steel", "Metals"),
    ("M&M.NS", "Mahindra & Mahindra", "Auto"),
    ("WIPRO.NS", "Wipro", "IT"),
    ("ADANIENT.NS", "Adani Enterprises", "Conglomerate"),
    ("ADANIPORTS.NS", "Adani Ports", "Infrastructure"),
    ("ONGC.NS", "ONGC", "Energy"),
    ("COALINDIA.NS", "Coal India", "Energy"),
    ("BAJAJFINSV.NS", "Bajaj Finserv", "Financial Services"),
    ("JSWSTEEL.NS", "JSW Steel", "Metals"),
    ("GRASIM.NS", "Grasim Industries", "Cement"),
    ("TECHM.NS", "Tech Mahindra", "IT"),
    ("HINDALCO.NS", "Hindalco", "Metals"),
    ("CIPLA.NS", "Cipla", "Pharma"),
    ("DRREDDY.NS", "Dr Reddy's Laboratories", "Pharma"),
    ("TATAMOTORS.NS", "Tata Motors", "Auto"),
    ("EICHERMOT.NS", "Eicher Motors", "Auto"),
    ("APOLLOHOSP.NS", "Apollo Hospitals", "Healthcare"),
    ("HEROMOTOCO.NS", "Hero MotoCorp", "Auto"),
    ("BPCL.NS", "Bharat Petroleum", "Energy"),
    ("INDUSINDBK.NS", "IndusInd Bank", "Banking"),
    ("DIVISLAB.NS", "Divi's Laboratories", "Pharma"),
    ("BAJAJ-AUTO.NS", "Bajaj Auto", "Auto"),
    ("TATACONSUM.NS", "Tata Consumer Products", "FMCG"),
    ("BRITANNIA.NS", "Britannia Industries", "FMCG"),
    ("SHRIRAMFIN.NS", "Shriram Finance", "Financial Services"),
    ("TRENT.NS", "Trent", "Retail"),
    ("BEL.NS", "Bharat Electronics", "Defence"),
    ("HDFCLIFE.NS", "HDFC Life", "Insurance"),
]

INDICES = [
    {"symbol": "^NSEI", "label": "NIFTY 50", "yahoo": "^NSEI"},
    {"symbol": "^NSEBANK", "label": "BANK NIFTY", "yahoo": "^NSEBANK"},
    {"symbol": "^BSESN", "label": "SENSEX", "yahoo": "^BSESN"},
    {"symbol": "^INDIAVIX", "label": "INDIA VIX", "yahoo": "^INDIAVIX"},
    {"symbol": "^CNXIT", "label": "NIFTY IT", "yahoo": "^CNXIT"},
    {"symbol": "NIFTY_FIN_SERVICE.NS", "label": "NIFTY FIN SERVICE", "yahoo": "NIFTY_FIN_SERVICE.NS"},
]

SECTOR_ETFS = [
    ("NIFTYBEES.NS", "Nifty 50 ETF"),
    ("BANKBEES.NS", "Bank Nifty ETF"),
    ("ITBEES.NS", "Nifty IT ETF"),
    ("PHARMABEES.NS", "Pharma ETF"),
]


def normalize_india_symbol(raw: str) -> tuple[str, str]:
    symbol = raw.strip().upper()
    if symbol.endswith(".BO"):
        return symbol, "BSE"
    if symbol.endswith(".NS"):
        return symbol, "NSE"
    if symbol.startswith("^"):
        return symbol, "INDEX"
    nse = {ticker for ticker, _, _ in NIFTY_50}
    if f"{symbol}.NS" in nse:
        return f"{symbol}.NS", "NSE"
    return f"{symbol}.NS", "NSE"


BANK_NIFTY = [
    ("HDFCBANK.NS", "HDFC Bank", "Banking"),
    ("ICICIBANK.NS", "ICICI Bank", "Banking"),
    ("SBIN.NS", "State Bank of India", "Banking"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"),
    ("AXISBANK.NS", "Axis Bank", "Banking"),
    ("INDUSINDBK.NS", "IndusInd Bank", "Banking"),
    ("BANKBARODA.NS", "Bank of Baroda", "Banking"),
    ("FEDERALBNK.NS", "Federal Bank", "Banking"),
    ("IDFCFIRSTB.NS", "IDFC First Bank", "Banking"),
    ("PNB.NS", "Punjab National Bank", "Banking"),
    ("AUBANK.NS", "AU Small Finance Bank", "Banking"),
    ("CANBK.NS", "Canara Bank", "Banking"),
]

SENSEX = [
    ("RELIANCE.NS", "Reliance Industries", "Energy"),
    ("HDFCBANK.NS", "HDFC Bank", "Banking"),
    ("BHARTIARTL.NS", "Bharti Airtel", "Telecom"),
    ("TCS.NS", "Tata Consultancy Services", "IT"),
    ("ICICIBANK.NS", "ICICI Bank", "Banking"),
    ("SBIN.NS", "State Bank of India", "Banking"),
    ("INFY.NS", "Infosys", "IT"),
    ("HINDUNILVR.NS", "Hindustan Unilever", "FMCG"),
    ("ITC.NS", "ITC", "FMCG"),
    ("LT.NS", "Larsen & Toubro", "Infrastructure"),
    ("BAJFINANCE.NS", "Bajaj Finance", "Financial Services"),
    ("HCLTECH.NS", "HCL Technologies", "IT"),
    ("MARUTI.NS", "Maruti Suzuki", "Auto"),
    ("SUNPHARMA.NS", "Sun Pharmaceutical", "Pharma"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"),
    ("AXISBANK.NS", "Axis Bank", "Banking"),
    ("NTPC.NS", "NTPC", "Power"),
    ("ULTRACEMCO.NS", "UltraTech Cement", "Cement"),
    ("TITAN.NS", "Titan Company", "Consumer"),
    ("ASIANPAINT.NS", "Asian Paints", "Consumer"),
    ("POWERGRID.NS", "Power Grid", "Power"),
    ("NESTLEIND.NS", "Nestle India", "FMCG"),
    ("TATASTEEL.NS", "Tata Steel", "Metals"),
    ("M&M.NS", "Mahindra & Mahindra", "Auto"),
    ("WIPRO.NS", "Wipro", "IT"),
    ("TECHM.NS", "Tech Mahindra", "IT"),
    ("INDUSINDBK.NS", "IndusInd Bank", "Banking"),
    ("BAJAJFINSV.NS", "Bajaj Finserv", "Financial Services"),
    ("TATAMOTORS.NS", "Tata Motors", "Auto"),
    ("ADANIPORTS.NS", "Adani Ports", "Infrastructure"),
]

UNIVERSES = {
    "NIFTY50": {"label": "NIFTY 50", "rows": NIFTY_50},
    "BANKNIFTY": {"label": "BANK NIFTY", "rows": BANK_NIFTY},
    "SENSEX": {"label": "SENSEX", "rows": SENSEX},
}


def universe_rows(universe: str | None) -> list[tuple[str, str, str]]:
    if not universe or universe.upper() == "ALL":
        seen = set()
        rows = []
        for key in ("NIFTY50", "BANKNIFTY", "SENSEX"):
            for row in UNIVERSES[key]["rows"]:
                if row[0] not in seen:
                    seen.add(row[0])
                    rows.append(row)
        return rows
    data = UNIVERSES.get(universe.upper())
    return list(data["rows"]) if data else list(NIFTY_50)


def search_catalog(query: str, limit: int = 40, universe: str | None = None) -> list[dict]:
    q = query.strip().upper()
    uni = (universe or "ALL").upper()
    rows = []
    for symbol, name, sector in universe_rows(uni):
        hay = f"{symbol} {name} {sector}".upper()
        if not q or q in hay:
            label = next((item["label"] for key, item in UNIVERSES.items() if (symbol, name, sector) in item["rows"]), "NSE")
            rows.append(
                {
                    "symbol": symbol,
                    "name": name,
                    "sector": sector,
                    "exchange": "NSE",
                    "label": f"{name} ({symbol})",
                    "universe": uni if uni != "ALL" else label,
                }
            )
        if len(rows) >= limit:
            break
    return rows


def list_universes() -> list[dict]:
    return [
        {
            "id": key,
            "label": item["label"],
            "stocks": [
                {"symbol": symbol, "name": name, "sector": sector, "label": f"{name} ({symbol})"}
                for symbol, name, sector in item["rows"]
            ],
        }
        for key, item in UNIVERSES.items()
    ]


def catalog_name(symbol: str) -> str:
    for ticker, name, _sector in universe_rows("ALL"):
        if ticker == symbol.upper():
            return name
    return symbol.upper()
