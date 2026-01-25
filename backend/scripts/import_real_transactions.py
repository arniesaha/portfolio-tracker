#!/usr/bin/env python3
"""
Import REAL transaction data from screenshots.
Format from screenshots: "Price x Quantity shares"
Expected total: $90,986 CAD
"""
import requests
from datetime import datetime
import time

API_BASE = "http://localhost:8000/api/v1"

# Transactions from screenshots (chronological order, oldest first)
TRANSACTIONS = [
    # April 9, 2024
    ("2024-04-09", "13:28", "NVDA", "Buy", 132.9006, 33),
    ("2024-04-09", "13:33", "VOO", "Buy", 550.996, 5),
    ("2024-04-09", "13:33", "AVGO", "Buy", 180.68, 12),
    ("2024-04-09", "13:33", "PLTR", "Buy", 42.5963, 8),
    ("2024-04-09", "13:34", "FHLC", "Buy", 73.3975, 4),
    ("2024-04-09", "13:34", "HXQ.TO", "Buy", 85.8198, 57),
    ("2024-04-09", "13:35", "VDY.TO", "Buy", 50.4, 25),
    ("2024-04-09", "13:35", "MDT", "Buy", 86.076, 15),
    ("2024-04-09", "13:36", "AVGO", "Buy", 228.03, 3),
    ("2024-04-09", "13:38", "LLY", "Buy", 776.16, 4),
    ("2024-04-09", "13:38", "NVDA", "Buy", 105.84, 23),
    ("2024-04-09", "13:39", "PLTR", "Buy", 75.04, 18),
    ("2024-04-09", "13:40", "TSM", "Buy", 146.2, 10),
    ("2024-04-09", "13:41", "VGT", "Buy", 536.85, 2),

    # May 29, 2024
    ("2024-05-29", "19:46", "NVDA", "Sell", 140.165, 23),

    # June 3, 2024
    ("2024-06-03", "13:02", "MDT", "Sell", 85.4, 15),
    ("2024-06-03", "13:04", "AVGO", "Sell", 254.965, 3),
    ("2024-06-03", "13:06", "VTI", "Buy", 293.5, 5),
    ("2024-06-03", "13:07", "VXUS", "Buy", 67.3, 8),
    ("2024-06-03", "13:07", "AVGO", "Sell", 254.67, 5),
    ("2024-06-03", "13:09", "PLTR", "Sell", 131.695, 8),
    ("2024-06-03", "13:10", "FHLC", "Sell", 63.025, 4),
    ("2024-06-03", "13:11", "VOO", "Buy", 548.41, 10.7),

    # June 10, 2024
    ("2024-06-10", "10:03", "VDY.TO", "Sell", 51.42, 25),
    ("2024-06-10", "10:04", "HXQ.TO", "Sell", 86.09, 20),
    ("2024-06-10", "10:05", "XEQT.TO", "Buy", 35.16, 86),

    # June 26, 2024
    ("2024-06-26", "09:10", "FXI", "Buy", 37.26, 11),
    ("2024-06-26", "09:11", "KWEB", "Buy", 34.61, 20),

    # June 27, 2024
    ("2024-06-27", "09:06", "PLTR", "Sell", 138.7, 11),
    ("2024-06-27", "09:08", "NVDA", "Sell", 158.18, 11),

    # July 2, 2024
    ("2024-07-02", "14:25", "TSM", "Buy", 232.86, 3),
    ("2024-07-02", "14:30", "FXI", "Buy", 36.66, 10),
    ("2024-07-02", "14:34", "ANET", "Buy", 100.94, 5),

    # July 22, 2024
    ("2024-07-22", "14:26", "TSM", "Buy", 234.4, 2),
    ("2024-07-22", "14:31", "FXI", "Buy", 38.78, 5),
    ("2024-07-22", "14:32", "KWEB", "Buy", 33.81, 18),
    ("2024-07-22", "14:33", "KWEB", "Buy", 36.49, 12),
    ("2024-07-22", "14:33", "BOTZ", "Buy", 33.02, 10),
    ("2024-07-22", "14:35", "ANET", "Buy", 110.77, 2),

    # July 23, 2024
    ("2024-07-23", "15:09", "XEQT.TO", "Buy", 36.3563, 275.33039),

    # July 30, 2024
    ("2024-07-30", "14:37", "HXQ.TO", "Buy", 92.2654, 35),

    # July 31, 2024
    ("2024-07-31", "19:51", "VDY.TO", "Buy", 53.2116, 55),

    # August 15, 2024
    ("2024-08-15", "14:45", "ANET", "Buy", 137.26, 10),
    ("2024-08-15", "14:46", "BOTZ", "Buy", 34.11, 23),

    # August 22, 2024
    ("2024-08-22", "16:44", "HXQ.TO", "Buy", 93.33, 32),

    # August 29, 2024
    ("2024-08-29", "14:19", "META", "Buy", 738.59, 6),
    ("2024-08-29", "14:21", "PLTR", "Buy", 156.91, 3),

    # September 30, 2024
    ("2024-09-30", "21:19", "XEQT.TO", "Buy", 38.83, 64),

    # October 7, 2024
    ("2024-10-07", "11:36", "PLTR", "Buy", 182.05, 9),

    # October 20, 2024
    ("2024-10-20", "15:41", "TSM", "Sell", 300.68, 7),
    ("2024-10-20", "23:00", "ANET", "Sell", 148.96, 7),

    # October 21, 2024
    ("2024-10-21", "11:25", "VDY.TO", "Buy", 57.54, 50),

    # October 24, 2024
    ("2024-10-24", "02:03", "VBAL.TO", "Buy", 37.07, 80),
    ("2024-10-24", "11:01", "NVDA", "Sell", 186.69, 4),
]

SYMBOL_INFO = {
    "VBAL.TO": {"exchange": "TSX", "country": "CA", "currency": "CAD"},
    "VDY.TO": {"exchange": "TSX", "country": "CA", "currency": "CAD"},
    "XEQT.TO": {"exchange": "TSX", "country": "CA", "currency": "CAD"},
    "HXQ.TO": {"exchange": "TSX", "country": "CA", "currency": "CAD"},
    "NVDA": {"exchange": "NASDAQ", "country": "US", "currency": "USD"},
    "ANET": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "TSM": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "PLTR": {"exchange": "NASDAQ", "country": "US", "currency": "USD"},
    "META": {"exchange": "NASDAQ", "country": "US", "currency": "USD"},
    "BOTZ": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "KWEB": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "FXI": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "VOO": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "FHLC": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "AVGO": {"exchange": "NASDAQ", "country": "US", "currency": "USD"},
    "VXUS": {"exchange": "NASDAQ", "country": "US", "currency": "USD"},
    "VTI": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "MDT": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "VGT": {"exchange": "NYSE", "country": "US", "currency": "USD"},
    "LLY": {"exchange": "NYSE", "country": "US", "currency": "USD"},
}

def calculate_holdings():
    """Calculate current holdings from transactions"""
    holdings = {}

    for date, time, symbol, action, price, qty in TRANSACTIONS:
        if symbol not in holdings:
            holdings[symbol] = {
                'symbol': symbol,
                'quantity': 0,
                'total_cost': 0,
                'first_purchase_date': None,
                **SYMBOL_INFO.get(symbol, {"exchange": "NASDAQ", "country": "US", "currency": "USD"})
            }

        if action == 'Buy':
            holdings[symbol]['quantity'] += qty
            holdings[symbol]['total_cost'] += qty * price
            if holdings[symbol]['first_purchase_date'] is None:
                holdings[symbol]['first_purchase_date'] = date
        else:  # Sell
            if holdings[symbol]['quantity'] > 0:
                cost_per_share = holdings[symbol]['total_cost'] / holdings[symbol]['quantity']
                holdings[symbol]['quantity'] -= qty
                holdings[symbol]['total_cost'] -= qty * cost_per_share

    # Filter active holdings
    active = {}
    for symbol, data in holdings.items():
        if data['quantity'] > 0.001:
            data['avg_purchase_price'] = data['total_cost'] / data['quantity']
            active[symbol] = data

    return active

def main():
    print("=" * 80)
    print("📊 IMPORTING REAL TRANSACTIONS FROM SCREENSHOTS")
    print("=" * 80)

    # Calculate holdings
    holdings_data = calculate_holdings()
    print(f"\n✅ Calculated {len(holdings_data)} holdings from {len(TRANSACTIONS)} transactions\n")

    # Create holdings
    holding_id_map = {}
    for symbol, data in holdings_data.items():
        payload = {
            "symbol": symbol,
            "exchange": data['exchange'],
            "country": data['country'],
            "quantity": round(data['quantity'], 4),
            "avg_purchase_price": round(data['avg_purchase_price'], 4),
            "currency": data['currency'],
            "first_purchase_date": data['first_purchase_date'],
            "notes": "Imported from transaction screenshots"
        }

        try:
            resp = requests.post(f"{API_BASE}/holdings/", json=payload)
            if resp.status_code == 201:
                holding = resp.json()
                holding_id_map[symbol] = holding['id']
                print(f"✅ {symbol:<12} {data['quantity']:<10.2f} shares @ ${data['avg_purchase_price']:.2f}")
            else:
                print(f"❌ {symbol}: {resp.text}")
        except Exception as e:
            print(f"❌ {symbol}: {e}")
        time.sleep(0.05)

    # Create transactions
    print(f"\n📝 Creating {len(TRANSACTIONS)} transactions...")
    success = 0
    for date, time_str, symbol, action, price, qty in TRANSACTIONS:
        if symbol not in holding_id_map:
            continue

        payload = {
            "holding_id": holding_id_map[symbol],
            "symbol": symbol,
            "transaction_type": action.upper(),
            "quantity": round(qty, 4),
            "price_per_share": round(price, 4),
            "transaction_date": date,
            "notes": f"{action} from screenshot"
        }

        try:
            resp = requests.post(f"{API_BASE}/transactions/", json=payload)
            if resp.status_code == 201:
                success += 1
        except:
            pass
        time.sleep(0.03)

    print(f"✅ Created {success} transactions\n")

    # Get summary
    resp = requests.get(f"{API_BASE}/analytics/portfolio/summary")
    if resp.status_code == 200:
        summary = resp.json()
        print("=" * 80)
        print("📊 PORTFOLIO SUMMARY")
        print("=" * 80)
        print(f"Total Value:        ${summary['total_value_cad']:,.2f} CAD")
        print(f"Total Cost:         ${summary['total_cost_cad']:,.2f} CAD")
        print(f"Unrealized Gain:    ${summary['unrealized_gain_cad']:,.2f} CAD ({summary['unrealized_gain_pct']:.2f}%)")
        print(f"Holdings Count:     {summary['holdings_count']}")
        print("=" * 80)
        print(f"Expected Total:     $90,986.00 CAD")
        print("=" * 80)

if __name__ == "__main__":
    main()
