import yfinance as yf
from typing import Dict, Optional, List
from datetime import datetime, timedelta, date as date_type
from decimal import Decimal
import logging
import time

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Exchange to yfinance suffix mapping
EXCHANGE_SUFFIX_MAP = {
    'TSX': '.TO',      # Toronto Stock Exchange
    'TSX-V': '.V',     # TSX Venture Exchange
    'NSE': '.NS',      # National Stock Exchange of India
    'BSE': '.BO',      # Bombay Stock Exchange
    'NASDAQ': '',      # US exchanges don't need suffix
    'NYSE': '',
}


class PriceService:
    """
    Service for fetching stock prices using yfinance.

    NOTE: yfinance v0.2.65+ uses curl_cffi internally which handles:
    - Cookie/crumb authentication automatically
    - Session management with Chrome impersonation
    - Rate limiting with built-in retry logic

    We should NOT pass custom sessions as they're incompatible with curl_cffi.
    """

    # Cache for prices (symbol: {price, timestamp})
    _price_cache: Dict[str, Dict] = {}
    _cache_duration = timedelta(minutes=15)  # Increased to 15 minutes to reduce API calls
    _last_request_time = None
    _min_request_interval = 2  # Seconds between requests

    @staticmethod
    def _get_yfinance_symbol(symbol: str, exchange: str) -> str:
        """
        Convert a symbol and exchange to the proper yfinance ticker format.

        Examples:
            ('ZRE', 'TSX') -> 'ZRE.TO'
            ('NVDA', 'NASDAQ') -> 'NVDA'
            ('RELIANCE', 'NSE') -> 'RELIANCE.NS'
        """
        suffix = EXCHANGE_SUFFIX_MAP.get(exchange, '')
        return f"{symbol}{suffix}"

    @classmethod
    def _rate_limit_delay(cls):
        """Add delay between requests to avoid rate limiting"""
        if cls._last_request_time:
            elapsed = time.time() - cls._last_request_time
            if elapsed < cls._min_request_interval:
                time.sleep(cls._min_request_interval - elapsed)
        cls._last_request_time = time.time()

    @classmethod
    def get_current_price(cls, symbol: str, exchange: str) -> Optional[Decimal]:
        """
        Get current price for a symbol.
        Returns None if price cannot be fetched.
        """
        # Check cache first
        cache_key = f"{symbol}:{exchange}"
        if cache_key in cls._price_cache:
            cached = cls._price_cache[cache_key]
            if datetime.now() - cached['timestamp'] < cls._cache_duration:
                logger.info(f"Using cached price for {symbol}")
                return cached['price']

        # Rate limit
        cls._rate_limit_delay()

        # Fetch from yfinance
        # yfinance v0.2.65+ uses curl_cffi internally which handles cookie/crumb auth
        try:
            yf_symbol = cls._get_yfinance_symbol(symbol, exchange)
            ticker = yf.Ticker(yf_symbol)

            # Try fast_info first (faster, less data)
            try:
                price = Decimal(str(ticker.fast_info['lastPrice']))
                if price and price > 0:
                    cls._price_cache[cache_key] = {
                        'price': price,
                        'timestamp': datetime.now()
                    }
                    logger.info(f"Fetched price for {symbol}: {price}")
                    return price
            except:
                pass  # Fall back to info

            # Fall back to info if fast_info doesn't work
            info = ticker.info
            price = None
            for field in ['currentPrice', 'regularMarketPrice', 'previousClose']:
                if field in info and info[field]:
                    price = Decimal(str(info[field]))
                    break

            if price:
                cls._price_cache[cache_key] = {
                    'price': price,
                    'timestamp': datetime.now()
                }
                logger.info(f"Fetched price for {symbol}: {price}")
                return price
            else:
                logger.warning(f"No price found for {symbol}")
                return None

        except Exception as e:
            # Check if it's a rate limit error
            if "429" in str(e) or "Too Many Requests" in str(e):
                logger.warning(f"Rate limited for {symbol}, will use cache or try later")
            else:
                logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return None

    @classmethod
    def get_prices_bulk(cls, symbols: List[tuple]) -> Dict[str, Optional[Decimal]]:
        """
        Get prices for multiple symbols.
        Args:
            symbols: List of (symbol, exchange) tuples
        Returns:
            Dictionary mapping symbol to price
        """
        results = {}
        for symbol, exchange in symbols:
            price = cls.get_current_price(symbol, exchange)
            results[symbol] = price

        return results

    @classmethod
    def get_historical_prices(cls, symbol: str, exchange: str, days: int = 30) -> List[Dict]:
        """
        Get historical prices for a symbol.
        Returns list of {date, open, high, low, close, volume}
        """
        try:
            yf_symbol = cls._get_yfinance_symbol(symbol, exchange)
            ticker = yf.Ticker(yf_symbol)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            hist = ticker.history(start=start_date, end=end_date)

            if hist.empty:
                logger.warning(f"No historical data for {symbol}")
                return []

            result = []
            for date, row in hist.iterrows():
                result.append({
                    'date': date.date(),
                    'open': Decimal(str(row['Open'])),
                    'high': Decimal(str(row['High'])),
                    'low': Decimal(str(row['Low'])),
                    'close': Decimal(str(row['Close'])),
                    'volume': int(row['Volume'])
                })

            logger.info(f"Fetched {len(result)} historical prices for {symbol}")
            return result

        except Exception as e:
            logger.error(f"Error fetching historical prices for {symbol}: {str(e)}")
            return []

    @classmethod
    def get_price_for_date(
        cls,
        symbol: str,
        exchange: str,
        target_date: date_type,
        db: Optional[Session] = None
    ) -> Optional[Decimal]:
        """
        Get closing price for a symbol on a specific date.
        If target_date is today, uses get_current_price for latest data.
        Otherwise, checks price_history table first, then fetches from yfinance.

        Args:
            symbol: Stock symbol
            exchange: Exchange identifier
            target_date: The date to get the price for
            db: Optional database session for checking cached prices

        Returns:
            Closing price as Decimal, or None if not available
        """
        # If requesting today's date, use current price (faster and more accurate)
        if target_date >= date_type.today():
            return cls.get_current_price(symbol, exchange)

        # Check price_history table first if db session is provided
        if db is not None:
            from ..models.price import PriceHistory
            cached = db.query(PriceHistory).filter(
                PriceHistory.symbol == symbol,
                PriceHistory.exchange == exchange,
                PriceHistory.date == target_date
            ).first()
            if cached:
                logger.debug(f"Using cached price for {symbol} on {target_date}: {cached.close}")
                return Decimal(str(cached.close))

            # Also try to find closest previous date in database (for weekends/holidays)
            closest_cached = db.query(PriceHistory).filter(
                PriceHistory.symbol == symbol,
                PriceHistory.exchange == exchange,
                PriceHistory.date <= target_date
            ).order_by(PriceHistory.date.desc()).first()

            if closest_cached and (target_date - closest_cached.date).days <= 5:
                logger.debug(f"Using closest cached price for {symbol} on {closest_cached.date} (requested {target_date}): {closest_cached.close}")
                return Decimal(str(closest_cached.close))

        # For historical dates, fetch historical data from yfinance
        try:
            # Rate limit
            cls._rate_limit_delay()

            yf_symbol = cls._get_yfinance_symbol(symbol, exchange)
            ticker = yf.Ticker(yf_symbol)

            # Request a small range around the target date (to handle weekends/holidays)
            start_date = target_date - timedelta(days=7)
            end_date = target_date + timedelta(days=1)

            hist = ticker.history(start=start_date, end=end_date)

            if hist.empty:
                logger.warning(f"No historical data for {symbol} around {target_date}")
                return None

            # Find the closest date (handles weekends/holidays)
            hist_dates = [d.date() for d in hist.index]

            # Try exact match first
            if target_date in hist_dates:
                price = Decimal(str(hist.loc[hist.index[hist_dates.index(target_date)]]['Close']))
                logger.info(f"Historical price for {symbol} on {target_date}: {price}")
                return price

            # If no exact match, find the closest previous date
            previous_dates = [d for d in hist_dates if d <= target_date]
            if previous_dates:
                closest_date = max(previous_dates)
                idx = hist_dates.index(closest_date)
                price = Decimal(str(hist.loc[hist.index[idx]]['Close']))
                logger.info(f"Using closest historical price for {symbol} on {closest_date} (requested {target_date}): {price}")
                return price

            logger.warning(f"No historical price found for {symbol} on or before {target_date}")
            return None

        except Exception as e:
            logger.error(f"Error fetching historical price for {symbol} on {target_date}: {str(e)}")
            return None

    @classmethod
    def backfill_historical_prices(
        cls,
        db: Session,
        start_date: date_type,
        end_date: date_type
    ) -> int:
        """
        Fetch and store historical prices for all active holdings.

        This method fetches historical prices from yfinance for all active holdings
        and persists them to the price_history table.

        Args:
            db: Database session
            start_date: Start date for backfill
            end_date: End date for backfill

        Returns:
            Count of price records created
        """
        from ..models.holding import Holding
        from ..models.price import PriceHistory

        holdings = db.query(Holding).filter(Holding.is_active == True).all()
        days_diff = (end_date - start_date).days + 30  # Extra buffer for edge cases

        logger.info(f"Backfilling prices for {len(holdings)} holdings from {start_date} to {end_date}")

        total_created = 0
        for holding in holdings:
            logger.info(f"Fetching historical prices for {holding.symbol} ({holding.exchange})...")

            try:
                prices = cls.get_historical_prices(holding.symbol, holding.exchange, days=days_diff)

                if not prices:
                    logger.warning(f"No historical prices returned for {holding.symbol}")
                    continue

                created_count = 0
                for price_data in prices:
                    price_date = price_data['date']

                    # Skip if outside date range
                    if price_date < start_date or price_date > end_date:
                        continue

                    # Check if already exists (using the unique constraint)
                    existing = db.query(PriceHistory).filter(
                        PriceHistory.symbol == holding.symbol,
                        PriceHistory.exchange == holding.exchange,
                        PriceHistory.date == price_date
                    ).first()

                    if not existing:
                        price_record = PriceHistory(
                            symbol=holding.symbol,
                            exchange=holding.exchange,
                            date=price_date,
                            open=price_data['open'],
                            high=price_data['high'],
                            low=price_data['low'],
                            close=price_data['close'],
                            volume=price_data['volume']
                        )
                        db.add(price_record)
                        created_count += 1

                db.commit()
                total_created += created_count
                logger.info(f"Created {created_count} price records for {holding.symbol}")

            except Exception as e:
                logger.error(f"Error backfilling prices for {holding.symbol}: {e}")
                db.rollback()
                continue

        logger.info(f"Price backfill complete: {total_created} records created")
        return total_created

    @classmethod
    def clear_cache(cls):
        """Clear the price cache"""
        cls._price_cache.clear()
        logger.info("Price cache cleared")

    @classmethod
    def get_company_info(cls, symbol: str, exchange: str = '') -> Optional[Dict]:
        """Get company information"""
        try:
            yf_symbol = cls._get_yfinance_symbol(symbol, exchange)
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info

            return {
                'name': info.get('longName') or info.get('shortName'),
                'sector': info.get('sector'),
                'industry': info.get('industry'),
                'market_cap': info.get('marketCap'),
                'currency': info.get('currency')
            }

        except Exception as e:
            logger.error(f"Error fetching company info for {symbol}: {str(e)}")
            return None
