from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, date, timedelta
from decimal import Decimal
from collections import defaultdict
from ..database import get_db
from ..models.holding import Holding
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
