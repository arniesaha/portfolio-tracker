#!/usr/bin/env python3
"""
Import Wealthsimple monthly statement CSV exports into portfolio tracker.

This script:
1. Parses all Wealthsimple CSV files from a directory
2. Extracts BUY and SELL transactions
3. Resets the database (clears holdings, transactions, snapshots)
4. Creates holdings and transactions from imported data
"""

import csv
import os
import re
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import Holding, Transaction, PortfolioSnapshot
from app.models.price import PriceHistory, ExchangeRate
from app.database import Base

# Database URL
DATABASE_URL = "sqlite:///./data/portfolio.db"

# Canadian ETFs that trade on TSX (in CAD)
CANADIAN_SYMBOLS = {
    "VDY": ("Vanguard FTSE Canadian High Dividend Yield Index ETF", "TSX"),
    "XEF": ("iShares Core MSCI EAFE IMI Index ETF", "TSX"),
    "HXQ": ("Global X Nasdaq-100 Index Corporate Class ETF", "TSX"),
    "XEQT": ("iShares Core Equity ETF Portfolio", "TSX"),
    "VBAL": ("Vanguard Balanced ETF Portfolio", "TSX"),
    "KILO": ("Purpose Gold Bullion Fund", "TSX"),
    "ZRE": ("BMO Equal Weight REITs Index ETF", "TSX"),
}

# US stocks/ETFs (in USD)
US_SYMBOLS = {
    "NVDA": ("NVIDIA Corp", "NASDAQ"),
    "LLY": ("Eli Lilly & Co", "NYSE"),
    "TSM": ("Taiwan Semiconductor Manufacturing", "NYSE"),
    "PLTR": ("Palantir Technologies Inc", "NYSE"),
    "VGT": ("Vanguard Information Technology ETF", "NYSE"),
    "FXI": ("iShares China Large-Cap ETF", "NYSE"),
    "KWEB": ("KraneShares CSI China Internet ETF", "NYSE"),
    "ANET": ("Arista Networks Inc", "NYSE"),
    "BOTZ": ("Global X Robotics & Artificial Intelligence ETF", "NASDAQ"),
    "META": ("Meta Platforms Inc", "NASDAQ"),
}


def parse_description(description: str) -> dict:
    """
    Parse Wealthsimple transaction description.

    Examples:
    - "NVDA - NVIDIA Corp.: Bought 5.0000 shares (executed at 2025-03-12), FX Rate: 1.4644"
    - "VDY - Vanguard FTSE Canadian High Dividend Yield Index ETF: Bought 50.0000 shares (executed at 2025-10-21)"
    """
    result = {
        "symbol": None,
        "company_name": None,
        "quantity": None,
        "action": None,
        "executed_date": None,
        "fx_rate": None,
    }

    # Extract symbol and company name
    match = re.match(r"^([A-Z]+)\s*-\s*(.+?):\s*(Bought|Sold)", description)
    if match:
        result["symbol"] = match.group(1)
        result["company_name"] = match.group(2).strip()
        result["action"] = "BUY" if match.group(3) == "Bought" else "SELL"

    # Extract quantity
    qty_match = re.search(r"(Bought|Sold)\s+([\d.]+)\s+shares", description)
    if qty_match:
        result["quantity"] = Decimal(qty_match.group(2))

    # Extract executed date
    date_match = re.search(r"executed at (\d{4}-\d{2}-\d{2})", description)
    if date_match:
        result["executed_date"] = datetime.strptime(date_match.group(1), "%Y-%m-%d").date()

    # Extract FX rate (only for USD stocks)
    fx_match = re.search(r"FX Rate:\s*([\d.]+)", description)
    if fx_match:
        result["fx_rate"] = Decimal(fx_match.group(1))

    return result


def calculate_price_per_share(amount_cad: Decimal, quantity: Decimal, fx_rate: Optional[Decimal], is_canadian: bool) -> tuple[Decimal, str]:
    """
    Calculate price per share and return currency.

    For Canadian stocks: price = |amount| / quantity in CAD
    For US stocks: price = |amount| / quantity / fx_rate in USD
    """
    amount_abs = abs(amount_cad)

    if is_canadian or fx_rate is None:
        price = amount_abs / quantity
        return price.quantize(Decimal("0.0001")), "CAD"
    else:
        price = amount_abs / quantity / fx_rate
        return price.quantize(Decimal("0.0001")), "USD"


def parse_csv_files(directory: str) -> list[dict]:
    """Parse all CSV files in directory and extract BUY/SELL transactions."""
    transactions = []

    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".csv"):
            continue

        filepath = os.path.join(directory, filename)

        # Detect account type from filename
        account_type = "RRSP" if "RRSP" in filename else "Non-registered"

        with open(filepath, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                trans_type = row.get("transaction", "")
                if trans_type not in ("BUY", "SELL"):
                    continue

                description = row.get("description", "")
                parsed = parse_description(description)

                if not parsed["symbol"] or not parsed["quantity"]:
                    print(f"Warning: Could not parse: {description}")
                    continue

                symbol = parsed["symbol"]
                is_canadian = symbol in CANADIAN_SYMBOLS

                amount_cad = Decimal(row.get("amount", "0"))
                price, currency = calculate_price_per_share(
                    amount_cad,
                    parsed["quantity"],
                    parsed["fx_rate"],
                    is_canadian
                )

                # Determine exchange and country
                if is_canadian:
                    company_name, exchange = CANADIAN_SYMBOLS[symbol]
                    country = "CA"
                elif symbol in US_SYMBOLS:
                    company_name, exchange = US_SYMBOLS[symbol]
                    country = "US"
                else:
                    # Unknown symbol, use parsed name and default to NYSE
                    company_name = parsed["company_name"] or symbol
                    exchange = "NYSE"
                    country = "US"
                    print(f"Warning: Unknown symbol {symbol}, defaulting to NYSE")

                transactions.append({
                    "date": row.get("date"),
                    "symbol": symbol,
                    "company_name": company_name,
                    "exchange": exchange,
                    "country": country,
                    "transaction_type": trans_type,
                    "quantity": parsed["quantity"],
                    "price_per_share": price,
                    "currency": currency,
                    "account_type": account_type,
                    "fx_rate": parsed["fx_rate"],
                    "amount_cad": amount_cad,
                })

    # Sort by date
    transactions.sort(key=lambda x: x["date"])
    return transactions


def reset_database(session):
    """Delete all existing data from relevant tables."""
    print("Resetting database...")
    session.execute(text("DELETE FROM transactions"))
    session.execute(text("DELETE FROM holdings"))
    session.execute(text("DELETE FROM portfolio_snapshots"))
    session.execute(text("DELETE FROM price_history"))
    session.commit()
    print("Database reset complete.")


def create_holdings_and_transactions(session, transactions: list[dict]):
    """
    Create holdings and transactions from parsed data.

    Holdings are aggregated by symbol. We calculate:
    - Total quantity (buys - sells)
    - Average purchase price (weighted by quantity)
    - First purchase date
    """
    # Group transactions by symbol
    holdings_data = {}

    for t in transactions:
        symbol = t["symbol"]
        if symbol not in holdings_data:
            holdings_data[symbol] = {
                "symbol": symbol,
                "company_name": t["company_name"],
                "exchange": t["exchange"],
                "country": t["country"],
                "currency": t["currency"],
                "transactions": [],
                "total_quantity": Decimal("0"),
                "total_cost": Decimal("0"),
                "first_purchase_date": None,
            }

        holdings_data[symbol]["transactions"].append(t)

        qty = t["quantity"]
        price = t["price_per_share"]

        if t["transaction_type"] == "BUY":
            holdings_data[symbol]["total_quantity"] += qty
            holdings_data[symbol]["total_cost"] += qty * price
            if holdings_data[symbol]["first_purchase_date"] is None:
                holdings_data[symbol]["first_purchase_date"] = datetime.strptime(t["date"], "%Y-%m-%d").date()
        else:  # SELL
            holdings_data[symbol]["total_quantity"] -= qty
            # Reduce cost basis proportionally
            if holdings_data[symbol]["total_quantity"] > 0:
                avg_cost = holdings_data[symbol]["total_cost"] / (holdings_data[symbol]["total_quantity"] + qty)
                holdings_data[symbol]["total_cost"] -= qty * avg_cost

    # Create holdings
    print(f"\nCreating {len(holdings_data)} holdings...")
    holdings_map = {}  # symbol -> holding_id

    for symbol, data in holdings_data.items():
        qty = data["total_quantity"]

        # Calculate average price
        if qty > 0:
            avg_price = data["total_cost"] / qty
        else:
            avg_price = Decimal("0")

        is_active = qty > Decimal("0.0001")

        holding = Holding(
            symbol=symbol,
            company_name=data["company_name"],
            exchange=data["exchange"],
            country=data["country"],
            quantity=max(qty, Decimal("0")),
            avg_purchase_price=avg_price.quantize(Decimal("0.0001")),
            currency=data["currency"],
            first_purchase_date=data["first_purchase_date"],
            is_active=is_active,
        )
        session.add(holding)
        session.flush()  # Get the ID
        holdings_map[symbol] = holding.id

        status = "active" if is_active else "closed"
        print(f"  {symbol}: {qty} shares @ {avg_price:.4f} {data['currency']} ({status})")

    # Create transactions
    print(f"\nCreating {len(transactions)} transactions...")
    for t in transactions:
        holding_id = holdings_map.get(t["symbol"])
        if not holding_id:
            continue

        transaction = Transaction(
            holding_id=holding_id,
            symbol=t["symbol"],
            transaction_type=t["transaction_type"],
            quantity=t["quantity"],
            price_per_share=t["price_per_share"],
            fees=Decimal("0"),  # Wealthsimple has no explicit fees in export
            transaction_date=datetime.strptime(t["date"], "%Y-%m-%d").date(),
            notes=f"Imported from Wealthsimple ({t['account_type']})",
        )
        session.add(transaction)

    session.commit()
    print("Holdings and transactions created.")


def main():
    import_dir = "/home/arnab/Downloads/monthly-statements-2025-01-to-2026-01"

    if not os.path.isdir(import_dir):
        print(f"Error: Directory not found: {import_dir}")
        sys.exit(1)

    # Setup database
    os.makedirs("./data", exist_ok=True)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Parse CSV files
        print(f"Parsing CSV files from: {import_dir}")
        transactions = parse_csv_files(import_dir)
        print(f"Found {len(transactions)} BUY/SELL transactions")

        # Reset database
        reset_database(session)

        # Create holdings and transactions
        create_holdings_and_transactions(session, transactions)

        # Summary
        print("\n" + "=" * 50)
        print("Import Summary")
        print("=" * 50)

        active_holdings = session.query(Holding).filter(Holding.is_active == True).count()
        closed_holdings = session.query(Holding).filter(Holding.is_active == False).count()
        total_transactions = session.query(Transaction).count()

        print(f"Active holdings: {active_holdings}")
        print(f"Closed holdings: {closed_holdings}")
        print(f"Total transactions: {total_transactions}")
        print("\nImport complete!")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
