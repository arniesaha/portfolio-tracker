from pydantic import BaseModel
from typing import Dict
from datetime import datetime
from decimal import Decimal


class PortfolioSummary(BaseModel):
    total_value_cad: Decimal
    total_cost_cad: Decimal
    unrealized_gain_cad: Decimal
    unrealized_gain_pct: Decimal
    today_change_cad: Decimal
    today_change_pct: Decimal
    holdings_count: int
    countries: Dict[str, int]
    last_updated: datetime
