from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, date, timedelta
from decimal import Decimal
from collections import defaultdict
from ..database import get_db
from ..models.holding import Holding
from ..models.transaction import Transaction
from ..models.price import PriceHistory
from ..services.price_service import PriceService
from ..services.currency_service import CurrencyService
from ..services.snapshot_service import SnapshotService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/portfolio/summary")
async def get_portfolio_summary(db: Session = Depends(get_db)) -> Dict:
    """Get portfolio summary with total value, gains, and distribution"""
    holdings = db.query(Holding).filter(Holding.is_active == True).all()

    if not holdings:
        return {
            "total_value_cad": 0,
            "total_cost_cad": 0,
            "unrealized_gain_cad": 0,
            "unrealized_gain_pct": 0,
            "today_change_cad": 0,
            "today_change_pct": 0,
            "holdings_count": 0,
            "countries": {},
            "last_updated": datetime.now()
        }

    # Fetch current prices
    symbols = [(h.symbol, h.exchange) for h in holdings]
    current_prices = PriceService.get_prices_bulk(symbols)

    # Calculate totals in CAD
    total_value_cad = Decimal("0")
    total_cost_cad = Decimal("0")
    countries = defaultdict(int)

    for holding in holdings:
        countries[holding.country] += 1

        # Get current price
        current_price = current_prices.get(holding.symbol)
        if current_price is None:
            logger.warning(f"No price available for {holding.symbol}")
            continue

        # Calculate market value in holding's currency
        market_value = holding.quantity * current_price
        total_cost = holding.quantity * holding.avg_purchase_price

        # Convert to CAD
        if holding.currency != "CAD":
            rate = CurrencyService.get_exchange_rate_sync(holding.currency, "CAD", db)
            if rate:
                market_value = market_value * rate
                total_cost = total_cost * rate

        total_value_cad += market_value
        total_cost_cad += total_cost

    # Calculate gains
    unrealized_gain_cad = total_value_cad - total_cost_cad
    unrealized_gain_pct = (unrealized_gain_cad / total_cost_cad * 100) if total_cost_cad > 0 else Decimal("0")

    # Calculate today's change using previous snapshot
    today_change_cad, today_change_pct = SnapshotService.calculate_change_from_previous(
        db, total_value_cad
    )

    return {
        "total_value_cad": float(total_value_cad),
        "total_cost_cad": float(total_cost_cad),
        "unrealized_gain_cad": float(unrealized_gain_cad),
        "unrealized_gain_pct": float(unrealized_gain_pct),
        "today_change_cad": float(today_change_cad),
        "today_change_pct": float(today_change_pct),
        "holdings_count": len(holdings),
        "countries": dict(countries),
        "last_updated": datetime.now()
    }


@router.get("/allocation")
async def get_allocation(db: Session = Depends(get_db)) -> Dict:
    """Get portfolio allocation by country, exchange, and top holdings"""
    holdings = db.query(Holding).filter(Holding.is_active == True).all()

    if not holdings:
        return {
            "by_country": {},
            "by_exchange": {},
            "top_holdings": []
        }

    # Fetch current prices
    symbols = [(h.symbol, h.exchange) for h in holdings]
    current_prices = PriceService.get_prices_bulk(symbols)

    # Calculate allocations
    by_country = defaultdict(lambda: Decimal("0"))
    by_exchange = defaultdict(lambda: Decimal("0"))
    holdings_with_value = []

    total_portfolio_value = Decimal("0")

    for holding in holdings:
        current_price = current_prices.get(holding.symbol)
        if current_price is None:
            continue

        # Calculate market value in CAD
        market_value = holding.quantity * current_price

        # Convert to CAD
        if holding.currency != "CAD":
            rate = CurrencyService.get_exchange_rate_sync(holding.currency, "CAD", db)
            if rate:
                market_value = market_value * rate

        total_portfolio_value += market_value

        by_country[holding.country] += market_value
        by_exchange[holding.exchange] += market_value

        holdings_with_value.append({
            "symbol": holding.symbol,
            "company_name": holding.company_name,
            "market_value": float(market_value),
            "quantity": float(holding.quantity),
            "current_price": float(current_price),
            "currency": holding.currency
        })

    # Convert to percentages
    by_country_pct = {
        country: float(value / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
        for country, value in by_country.items()
    }

    by_exchange_pct = {
        exchange: float(value / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
        for exchange, value in by_exchange.items()
    }

    # Sort and get top 10 holdings
    holdings_with_value.sort(key=lambda x: x['market_value'], reverse=True)
    top_holdings = holdings_with_value[:10]

    # Add percentage to top holdings
    for holding in top_holdings:
        holding['percentage'] = float(
            Decimal(str(holding['market_value'])) / total_portfolio_value * 100
        ) if total_portfolio_value > 0 else 0

    return {
        "by_country": by_country_pct,
        "by_exchange": by_exchange_pct,
        "top_holdings": top_holdings,
        "total_value_cad": float(total_portfolio_value)
    }


@router.get("/performance")
async def get_performance(db: Session = Depends(get_db)) -> Dict:
    """Get performance metrics for the portfolio"""
    holdings = db.query(Holding).filter(Holding.is_active == True).all()

    if not holdings:
        return {
            "best_performers": [],
            "worst_performers": [],
            "overall_return_pct": 0
        }

    # Fetch current prices
    symbols = [(h.symbol, h.exchange) for h in holdings]
    current_prices = PriceService.get_prices_bulk(symbols)

    # Calculate performance for each holding
    holdings_performance = []

    for holding in holdings:
        current_price = current_prices.get(holding.symbol)
        if current_price is None:
            continue

        gain = current_price - holding.avg_purchase_price
        gain_pct = (gain / holding.avg_purchase_price * 100) if holding.avg_purchase_price > 0 else Decimal("0")

        holdings_performance.append({
            "symbol": holding.symbol,
            "company_name": holding.company_name,
            "current_price": float(current_price),
            "avg_cost": float(holding.avg_purchase_price),
            "gain": float(gain),
            "gain_pct": float(gain_pct),
            "currency": holding.currency
        })

    # Sort by performance
    holdings_performance.sort(key=lambda x: x['gain_pct'], reverse=True)

    best_performers = holdings_performance[:5]
    worst_performers = holdings_performance[-5:][::-1]  # Reverse to show worst first

    return {
        "best_performers": best_performers,
        "worst_performers": worst_performers,
        "total_holdings": len(holdings_performance)
    }


@router.get("/portfolio-value")
async def get_portfolio_value_history(days: int = 30, db: Session = Depends(get_db)) -> Dict:
    """Get portfolio value over time"""
    # This is a simplified version
    # In a real implementation, you'd calculate historical portfolio value
    # using historical prices and holdings at each point in time

    return {
        "message": "Portfolio value history coming soon",
        "note": "This requires storing historical portfolio snapshots"
    }


@router.get("/realized-gains")
async def get_realized_gains(db: Session = Depends(get_db)) -> Dict:
    """
    Calculate realized gains/losses from completed (SELL) transactions.

    Uses FIFO (First In, First Out) accounting method:
    - When selling, the oldest purchased shares are sold first
    - Cost basis is calculated from the actual purchase price of those specific lots

    Same-day sell/buy transactions at identical price and quantity are detected
    as account transfers and excluded from realized gains calculations.
    """
    # Get all holdings (including inactive ones for historical sells)
    holdings = db.query(Holding).all()

    if not holdings:
        return {
            "total_realized_gain_cad": 0,
            "total_proceeds_cad": 0,
            "total_cost_basis_cad": 0,
            "transactions_count": 0,
            "by_holding": [],
            "by_year": {},
            "method": "FIFO"
        }

    # First, identify true round-trips (account transfers) to exclude
    # These are same-day sell/buy pairs with identical quantity and price
    round_trips = set()
    for holding in holdings:
        transactions = db.query(Transaction).filter(
            Transaction.holding_id == holding.id
        ).order_by(Transaction.transaction_date.asc(), Transaction.id.asc()).all()

        # Group by date
        by_date = defaultdict(list)
        for txn in transactions:
            by_date[txn.transaction_date].append(txn)

        # Find matching sell/buy pairs on same day
        for date, day_txns in by_date.items():
            sells = [t for t in day_txns if t.transaction_type == "SELL"]
            buys = [t for t in day_txns if t.transaction_type == "BUY"]

            for sell in sells:
                for buy in buys:
                    # Check if same quantity and price (within small tolerance)
                    if (abs(float(sell.quantity) - float(buy.quantity)) < 0.0001 and
                        abs(float(sell.price_per_share) - float(buy.price_per_share)) < 0.01):
                        round_trips.add((holding.symbol, date, float(sell.quantity), float(sell.price_per_share)))

    total_realized_gain_cad = Decimal("0")
    total_proceeds_cad = Decimal("0")
    total_cost_basis_cad = Decimal("0")
    transactions_count = 0
    by_holding = []
    by_year = defaultdict(lambda: Decimal("0"))

    for holding in holdings:
        # Get all transactions for this holding, ordered by date and id
        transactions = db.query(Transaction).filter(
            Transaction.holding_id == holding.id
        ).order_by(Transaction.transaction_date.asc(), Transaction.id.asc()).all()

        if not transactions:
            continue

        # FIFO: Track lots as a list of (quantity, price_per_share, fees)
        fifo_lots = []
        holding_realized_gain = Decimal("0")
        holding_proceeds = Decimal("0")
        holding_cost_basis = Decimal("0")
        sell_transactions = []

        for txn in transactions:
            txn_quantity = Decimal(str(txn.quantity))
            txn_price = Decimal(str(txn.price_per_share))
            txn_fees = Decimal(str(txn.fees)) if txn.fees else Decimal("0")

            # Check if this is part of a round-trip (account transfer)
            is_round_trip = (holding.symbol, txn.transaction_date,
                           float(txn_quantity), float(txn_price)) in round_trips

            if txn.transaction_type == "BUY":
                # Add new lot to FIFO queue (skip if round-trip)
                if not is_round_trip:
                    fifo_lots.append({
                        "quantity": txn_quantity,
                        "price": txn_price,
                        "fees": txn_fees
                    })

            elif txn.transaction_type == "SELL":
                # Skip round-trip sells
                if is_round_trip:
                    continue

                # Calculate proceeds from this sale
                proceeds = txn_quantity * txn_price - txn_fees

                # FIFO: Use oldest lots first to determine cost basis
                remaining_to_sell = txn_quantity
                cost_basis = Decimal("0")
                lots_used = []

                while remaining_to_sell > 0 and fifo_lots:
                    lot = fifo_lots[0]

                    if lot["quantity"] <= remaining_to_sell:
                        # Use entire lot
                        cost_basis += lot["quantity"] * lot["price"] + lot["fees"]
                        lots_used.append(f"{lot['quantity']}@${lot['price']:.2f}")
                        remaining_to_sell -= lot["quantity"]
                        fifo_lots.pop(0)
                    else:
                        # Use partial lot
                        cost_basis += remaining_to_sell * lot["price"]
                        # Proportional fees
                        cost_basis += lot["fees"] * (remaining_to_sell / lot["quantity"])
                        lots_used.append(f"{remaining_to_sell}@${lot['price']:.2f}")
                        # Update remaining lot
                        lot["fees"] = lot["fees"] * ((lot["quantity"] - remaining_to_sell) / lot["quantity"])
                        lot["quantity"] -= remaining_to_sell
                        remaining_to_sell = Decimal("0")

                # Calculate realized gain
                realized_gain = proceeds - cost_basis

                # Accumulate for this holding
                holding_realized_gain += realized_gain
                holding_proceeds += proceeds
                holding_cost_basis += cost_basis

                # Track by year
                year = txn.transaction_date.year

                # Convert to CAD if needed
                if holding.currency != "CAD":
                    rate = CurrencyService.get_exchange_rate_sync(holding.currency, "CAD", db)
                    if rate:
                        realized_gain_cad = realized_gain * rate
                        proceeds_cad = proceeds * rate
                        cost_basis_cad_val = cost_basis * rate
                    else:
                        realized_gain_cad = realized_gain
                        proceeds_cad = proceeds
                        cost_basis_cad_val = cost_basis
                else:
                    realized_gain_cad = realized_gain
                    proceeds_cad = proceeds
                    cost_basis_cad_val = cost_basis

                by_year[year] += realized_gain_cad
                total_realized_gain_cad += realized_gain_cad
                total_proceeds_cad += proceeds_cad
                total_cost_basis_cad += cost_basis_cad_val
                transactions_count += 1

                # Calculate average cost for display (cost basis / quantity)
                avg_cost_display = cost_basis / txn_quantity if txn_quantity > 0 else Decimal("0")

                sell_transactions.append({
                    "date": txn.transaction_date.isoformat(),
                    "quantity": float(txn_quantity),
                    "sell_price": float(txn_price),
                    "cost_basis": float(avg_cost_display),  # Per-share cost basis
                    "realized_gain": float(realized_gain),
                    "realized_gain_cad": float(realized_gain_cad),
                    "lots_used": ", ".join(lots_used) if lots_used else "N/A"
                })

        # Only add holdings with sell transactions
        if sell_transactions:
            # Convert holding totals to CAD
            if holding.currency != "CAD":
                rate = CurrencyService.get_exchange_rate_sync(holding.currency, "CAD", db)
                if rate:
                    holding_realized_gain_cad = holding_realized_gain * rate
                else:
                    holding_realized_gain_cad = holding_realized_gain
            else:
                holding_realized_gain_cad = holding_realized_gain

            by_holding.append({
                "symbol": holding.symbol,
                "company_name": holding.company_name,
                "exchange": holding.exchange,
                "currency": holding.currency,
                "realized_gain": float(holding_realized_gain),
                "realized_gain_cad": float(holding_realized_gain_cad),
                "transactions_count": len(sell_transactions),
                "transactions": sell_transactions
            })

    # Sort by holding with largest realized gains
    by_holding.sort(key=lambda x: abs(x['realized_gain_cad']), reverse=True)

    return {
        "total_realized_gain_cad": float(total_realized_gain_cad),
        "total_proceeds_cad": float(total_proceeds_cad),
        "total_cost_basis_cad": float(total_cost_basis_cad),
        "transactions_count": transactions_count,
        "by_holding": by_holding,
        "by_year": {str(k): float(v) for k, v in sorted(by_year.items())},
        "method": "FIFO"
    }
