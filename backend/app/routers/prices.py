from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime, date
from decimal import Decimal
from ..database import get_db
from ..models.holding import Holding
from ..models.price import PriceHistory
from ..services.price_service import PriceService
from ..services.mock_price_service import MockPriceService
from ..services.snapshot_service import SnapshotService
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prices", tags=["prices"])

# Select price service based on config
def get_price_service():
    if settings.use_mock_prices:
        logger.info("Using Mock Price Service")
        return MockPriceService
    return PriceService


@router.get("/current")
async def get_current_prices(db: Session = Depends(get_db)) -> Dict:
    """Get current prices for all active holdings"""
    holdings = db.query(Holding).filter(Holding.is_active == True).all()

    if not holdings:
        return {
            "prices": {},
            "last_updated": datetime.now(),
            "count": 0
        }

    # Fetch prices for all holdings
    symbols = [(h.symbol, h.exchange) for h in holdings]
    prices = PriceService.get_prices_bulk(symbols)

    # Format results
    result = {}
    for holding in holdings:
        price = prices.get(holding.symbol)
        result[holding.symbol] = {
            "symbol": holding.symbol,
            "exchange": holding.exchange,
            "current_price": float(price) if price else None,
            "currency": holding.currency
        }

    return {
        "prices": result,
        "last_updated": datetime.now(),
        "count": len(result)
    }


@router.get("/{symbol}")
async def get_price_by_symbol(
    symbol: str,
    exchange: str = "TSX",
    db: Session = Depends(get_db)
) -> Dict:
    """Get current price for a specific symbol"""
    price = PriceService.get_current_price(symbol, exchange)

    if price is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not fetch price for {symbol} on {exchange}"
        )

    return {
        "symbol": symbol,
        "exchange": exchange,
        "current_price": float(price),
        "last_updated": datetime.now()
    }


@router.post("/refresh")
async def refresh_prices(db: Session = Depends(get_db)) -> Dict:
    """Force refresh all prices (clear cache and fetch new)"""
    PriceService.clear_cache()

    holdings = db.query(Holding).filter(Holding.is_active == True).all()
    symbols = [(h.symbol, h.exchange) for h in holdings]
    prices = PriceService.get_prices_bulk(symbols)

    # Store in price history
    today = date.today()
    for holding in holdings:
        price = prices.get(holding.symbol)
        if price:
            # Check if we already have today's price
            existing = db.query(PriceHistory).filter(
                PriceHistory.symbol == holding.symbol,
                PriceHistory.exchange == holding.exchange,
                PriceHistory.date == today
            ).first()

            if not existing:
                price_history = PriceHistory(
                    symbol=holding.symbol,
                    exchange=holding.exchange,
                    date=today,
                    close=price
                )
                db.add(price_history)

    db.commit()

    # Create a portfolio snapshot after refreshing prices
    try:
        snapshot = SnapshotService.create_snapshot(db)
        logger.info(f"Created portfolio snapshot for {snapshot.snapshot_date}")
        snapshot_created = True
    except Exception as e:
        logger.error(f"Failed to create snapshot: {e}")
        snapshot_created = False

    return {
        "message": "Prices refreshed successfully",
        "count": len(prices),
        "last_updated": datetime.now(),
        "snapshot_created": snapshot_created
    }


@router.get("/history/{symbol}")
async def get_price_history(
    symbol: str,
    exchange: str = "TSX",
    days: int = 30,
    db: Session = Depends(get_db)
) -> Dict:
    """Get historical prices for a symbol"""
    # Try to fetch from yfinance
    historical_prices = PriceService.get_historical_prices(symbol, exchange, days)

    if not historical_prices:
        # Fall back to database
        historical_prices = db.query(PriceHistory).filter(
            PriceHistory.symbol == symbol,
            PriceHistory.exchange == exchange
        ).order_by(PriceHistory.date.desc()).limit(days).all()

        historical_prices = [
            {
                'date': str(p.date),
                'open': float(p.open) if p.open else None,
                'high': float(p.high) if p.high else None,
                'low': float(p.low) if p.low else None,
                'close': float(p.close),
                'volume': p.volume
            }
            for p in historical_prices
        ]

    # Convert dates to strings for JSON serialization
    for price in historical_prices:
        if isinstance(price['date'], date):
            price['date'] = str(price['date'])
        if isinstance(price['open'], Decimal):
            price['open'] = float(price['open'])
        if isinstance(price['high'], Decimal):
            price['high'] = float(price['high'])
        if isinstance(price['low'], Decimal):
            price['low'] = float(price['low'])
        if isinstance(price['close'], Decimal):
            price['close'] = float(price['close'])

    return {
        "symbol": symbol,
        "exchange": exchange,
        "prices": historical_prices,
        "count": len(historical_prices)
    }
