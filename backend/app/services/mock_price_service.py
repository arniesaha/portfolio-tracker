"""
Mock Price Service for testing and development.
Returns realistic sample prices without calling external APIs.
"""

from typing import Dict, Optional, List
from decimal import Decimal
import logging
import random

logger = logging.getLogger(__name__)


class MockPriceService:
    """Mock price service that returns sample prices for testing"""

    # Base prices for common stocks
    BASE_PRICES = {
        # Canadian stocks
        'SHOP.TO': Decimal('85.50'),
        'TD.TO': Decimal('77.25'),
        'RY.TO': Decimal('140.75'),
        'ENB.TO': Decimal('52.80'),
        'CNR.TO': Decimal('165.40'),
        'BMO.TO': Decimal('125.90'),
        'SU.TO': Decimal('42.15'),
        'CP.TO': Decimal('105.60'),

        # US stocks
        'AAPL': Decimal('178.50'),
        'MSFT': Decimal('385.25'),
        'GOOGL': Decimal('142.80'),
        'AMZN': Decimal('152.30'),
        'META': Decimal('475.60'),
        'TSLA': Decimal('242.80'),
        'NVDA': Decimal('485.90'),
        'JPM': Decimal('158.40'),

        # Indian stocks
        'RELIANCE.NS': Decimal('2485.50'),
        'TCS.NS': Decimal('3625.75'),
        'INFY.NS': Decimal('1545.20'),
        'HDFCBANK.NS': Decimal('1625.30'),
        'ICICIBANK.NS': Decimal('985.45'),
        'ITC.NS': Decimal('425.60'),
        'BHARTIARTL.NS': Decimal('1245.80'),
        'WIPRO.NS': Decimal('485.25'),
    }

    # Simulate some price movement
    _price_variation: Dict[str, Decimal] = {}

    @classmethod
    def get_current_price(cls, symbol: str, exchange: str) -> Optional[Decimal]:
        """
        Get mock price for a symbol.
        Adds small random variation to simulate market movement.
        """
        base_price = cls.BASE_PRICES.get(symbol)

        if not base_price:
            logger.warning(f"No mock price available for {symbol}")
            return None

        # Add small random variation (-2% to +2%)
        if symbol not in cls._price_variation:
            variation = random.uniform(-0.02, 0.02)
            cls._price_variation[symbol] = Decimal(str(1 + variation))

        price = base_price * cls._price_variation[symbol]
        logger.info(f"Mock price for {symbol}: {price}")
        return price

    @classmethod
    def get_prices_bulk(cls, symbols: List[tuple]) -> Dict[str, Optional[Decimal]]:
        """Get mock prices for multiple symbols"""
        results = {}
        for symbol, exchange in symbols:
            price = cls.get_current_price(symbol, exchange)
            results[symbol] = price
        return results

    @classmethod
    def get_historical_prices(cls, symbol: str, exchange: str, days: int = 30) -> List[Dict]:
        """
        Generate mock historical prices.
        Creates a simple trend with some volatility.
        """
        from datetime import datetime, timedelta

        base_price = cls.BASE_PRICES.get(symbol)
        if not base_price:
            return []

        result = []
        for i in range(days, 0, -1):
            date = datetime.now() - timedelta(days=i)

            # Simple trend with some randomness
            trend_factor = 1 + (random.uniform(-0.01, 0.01))
            day_variation = random.uniform(0.98, 1.02)

            close_price = base_price * Decimal(str(trend_factor * day_variation))
            high_price = close_price * Decimal('1.015')
            low_price = close_price * Decimal('0.985')
            open_price = close_price * Decimal(str(random.uniform(0.99, 1.01)))

            result.append({
                'date': date.date(),
                'open': open_price,
                'high': high_price,
                'low': low_price,
                'close': close_price,
                'volume': random.randint(1000000, 10000000)
            })

        logger.info(f"Generated {len(result)} mock historical prices for {symbol}")
        return result

    @classmethod
    def clear_cache(cls):
        """Clear price variations to reset prices"""
        cls._price_variation.clear()
        logger.info("Mock price variations cleared")

    @classmethod
    def add_mock_price(cls, symbol: str, price: Decimal):
        """Add a custom mock price"""
        cls.BASE_PRICES[symbol] = price
        logger.info(f"Added mock price for {symbol}: {price}")
