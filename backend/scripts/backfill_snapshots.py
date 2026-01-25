#!/usr/bin/env python3
"""
Efficient backfill of portfolio snapshots.

This script:
1. Fetches all historical prices in bulk using yfinance
2. Calculates portfolio state at each historical date
3. Creates snapshots for each trading day
"""

import json
import os
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Dict, Optional, List

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import yfinance as yf
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import Holding, Transaction, PortfolioSnapshot
from app.database import Base

# Database URL
DATABASE_URL = "sqlite:///./data/portfolio.db"

# Approximate exchange rates (USD to CAD)
# Using a slightly higher rate to be conservative
USD_TO_CAD_RATE = Decimal("1.38")


# Canadian symbols that need .TO suffix for yfinance
CANADIAN_SYMBOLS_MAP = {
    "VDY": "VDY.TO",
    "XEF": "XEF.TO",
    "HXQ": "HXQ.TO",
    "XEQT": "XEQT.TO",
    "VBAL": "VBAL.TO",
    "KILO": "KILO.TO",
    "ZRE": "ZRE.TO",
}


def get_historical_prices_bulk(symbols: List[str], start_date: date, end_date: date) -> Dict[str, Dict[date, Decimal]]:
    """
    Fetch historical prices for multiple symbols using yfinance.

    Returns:
        Dictionary mapping symbol to {date: close_price}
    """
    print(f"Fetching historical prices for {len(symbols)} symbols from {start_date} to {end_date}...")

    prices = {}

    for symbol in symbols:
        # Map Canadian symbols to their .TO equivalents
        yf_symbol = CANADIAN_SYMBOLS_MAP.get(symbol, symbol)
        print(f"  Fetching {symbol} (as {yf_symbol})...", end=" ")
        try:
            ticker = yf.Ticker(yf_symbol)
            hist = ticker.history(start=start_date, end=end_date + timedelta(days=1))

            if hist.empty:
                print("No data")
                prices[symbol] = {}
                continue

            symbol_prices = {}
            for dt, row in hist.iterrows():
                price_date = dt.date()
                close_price = Decimal(str(row['Close']))
                symbol_prices[price_date] = close_price

            prices[symbol] = symbol_prices
            print(f"{len(symbol_prices)} days")

        except Exception as e:
            print(f"Error: {e}")
            prices[symbol] = {}

    return prices


def calculate_portfolio_state_at_date(
    transactions: List[Transaction],
    target_date: date
) -> Dict[str, Dict]:
    """
    Calculate the portfolio state (holdings) as of a specific date.

    Returns:
        Dictionary mapping symbol to {quantity, avg_price, currency, country}
    """
    holdings = {}

    for t in transactions:
        if t.transaction_date > target_date:
            continue

        symbol = t.symbol
        qty = Decimal(str(t.quantity))
        price = Decimal(str(t.price_per_share))

        if symbol not in holdings:
            holdings[symbol] = {
                "quantity": Decimal("0"),
                "total_cost": Decimal("0"),
                "currency": None,
                "country": None,
            }

        if t.transaction_type == "BUY":
            holdings[symbol]["quantity"] += qty
            holdings[symbol]["total_cost"] += qty * price
        else:  # SELL
            holdings[symbol]["quantity"] -= qty
            # Reduce cost proportionally
            if holdings[symbol]["quantity"] > 0:
                avg_cost = holdings[symbol]["total_cost"] / (holdings[symbol]["quantity"] + qty)
                holdings[symbol]["total_cost"] -= qty * avg_cost
            else:
                holdings[symbol]["total_cost"] = Decimal("0")

    # Remove holdings with zero quantity
    holdings = {k: v for k, v in holdings.items() if v["quantity"] > Decimal("0.0001")}

    return holdings


def get_holding_metadata(session) -> Dict[str, Dict]:
    """Get currency and country info for each holding."""
    holdings = session.query(Holding).all()
    metadata = {}
    for h in holdings:
        metadata[h.symbol] = {
            "currency": h.currency,
            "country": h.country,
        }
    return metadata


def create_snapshot_for_date(
    session,
    target_date: date,
    portfolio_state: Dict[str, Dict],
    prices: Dict[str, Dict[date, Decimal]],
    metadata: Dict[str, Dict],
) -> Optional[PortfolioSnapshot]:
    """
    Create a portfolio snapshot for a specific date.
    """
    total_value_cad = Decimal("0")
    total_cost_cad = Decimal("0")
    value_by_country = {}

    for symbol, state in portfolio_state.items():
        qty = state["quantity"]

        # Get price for this date
        symbol_prices = prices.get(symbol, {})
        if not symbol_prices:
            continue

        # Find closest available price (handles weekends/holidays)
        price = None
        check_date = target_date
        for _ in range(7):  # Look back up to 7 days
            if check_date in symbol_prices:
                price = symbol_prices[check_date]
                break
            check_date -= timedelta(days=1)

        if price is None:
            continue

        # Get metadata
        meta = metadata.get(symbol, {})
        currency = meta.get("currency", "USD")
        country = meta.get("country", "US")

        # Calculate market value
        market_value = qty * price

        # Convert to CAD
        if currency == "USD":
            market_value_cad = market_value * USD_TO_CAD_RATE
        else:
            market_value_cad = market_value

        # Calculate cost
        avg_price = state["total_cost"] / qty if qty > 0 else Decimal("0")
        cost = qty * avg_price

        if currency == "USD":
            cost_cad = cost * USD_TO_CAD_RATE
        else:
            cost_cad = cost

        total_value_cad += market_value_cad
        total_cost_cad += cost_cad

        # Track by country
        if country not in value_by_country:
            value_by_country[country] = Decimal("0")
        value_by_country[country] += market_value_cad

    if total_value_cad == 0:
        return None

    # Calculate gains
    unrealized_gain_cad = total_value_cad - total_cost_cad
    unrealized_gain_pct = Decimal("0")
    if total_cost_cad > 0:
        unrealized_gain_pct = (unrealized_gain_cad / total_cost_cad) * Decimal("100")

    # Check if snapshot exists
    existing = session.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.snapshot_date == target_date
    ).first()

    if existing:
        snapshot = existing
    else:
        snapshot = PortfolioSnapshot(snapshot_date=target_date)

    snapshot.total_value_cad = total_value_cad
    snapshot.total_cost_cad = total_cost_cad
    snapshot.unrealized_gain_cad = unrealized_gain_cad
    snapshot.unrealized_gain_pct = unrealized_gain_pct
    snapshot.holdings_count = len(portfolio_state)

    # Store country breakdown as JSON
    value_by_country_serializable = {k: float(v) for k, v in value_by_country.items()}
    snapshot.value_by_country = json.dumps(value_by_country_serializable)

    if not existing:
        session.add(snapshot)

    return snapshot


def main():
    # Setup database
    os.makedirs("./data", exist_ok=True)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Clear existing snapshots
        print("Clearing existing snapshots...")
        session.execute(text("DELETE FROM portfolio_snapshots"))
        session.commit()

        # Get all transactions sorted by date
        transactions = session.query(Transaction).order_by(Transaction.transaction_date).all()
        if not transactions:
            print("No transactions found!")
            return

        # Get holding metadata
        metadata = get_holding_metadata(session)

        # Determine date range
        start_date = transactions[0].transaction_date
        end_date = date.today()
        print(f"Date range: {start_date} to {end_date}")

        # Get unique symbols
        symbols = list(set(t.symbol for t in transactions))
        print(f"Symbols: {', '.join(symbols)}")

        # Fetch all historical prices
        prices = get_historical_prices_bulk(symbols, start_date, end_date)

        # Create snapshots for each trading day
        print("\nCreating snapshots...")
        current_date = start_date
        snapshots_created = 0

        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                continue

            # Calculate portfolio state at this date
            portfolio_state = calculate_portfolio_state_at_date(transactions, current_date)

            if not portfolio_state:
                current_date += timedelta(days=1)
                continue

            # Create snapshot
            snapshot = create_snapshot_for_date(
                session, current_date, portfolio_state, prices, metadata
            )

            if snapshot:
                snapshots_created += 1
                if snapshots_created % 20 == 0:
                    print(f"  Created {snapshots_created} snapshots (up to {current_date})...")
                    session.commit()

            current_date += timedelta(days=1)

        session.commit()
        print(f"\nBackfill complete: {snapshots_created} snapshots created")

        # Show recent snapshots
        print("\nRecent snapshots:")
        recent = session.query(PortfolioSnapshot).order_by(
            PortfolioSnapshot.snapshot_date.desc()
        ).limit(5).all()

        for s in reversed(recent):
            print(f"  {s.snapshot_date}: ${s.total_value_cad:,.2f} CAD "
                  f"(gain: ${s.unrealized_gain_cad:,.2f}, {s.unrealized_gain_pct:.2f}%)")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
