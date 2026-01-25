"""
Portfolio Snapshot Model

Stores daily snapshots of portfolio value for historical tracking and performance analysis.
"""
from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime
from sqlalchemy.sql import func
from ..database import Base


class PortfolioSnapshot(Base):
    """Portfolio value snapshot for a specific date"""

    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, unique=True, index=True)

    # Portfolio values in CAD
    total_value_cad = Column(DECIMAL(15, 2), nullable=False)
    total_cost_cad = Column(DECIMAL(15, 2), nullable=False)
    unrealized_gain_cad = Column(DECIMAL(15, 2), nullable=False)
    unrealized_gain_pct = Column(DECIMAL(10, 4), nullable=False)

    # Holdings count at snapshot time
    holdings_count = Column(Integer, nullable=False)

    # Optional: Store breakdown by country
    value_by_country = Column(String(500), nullable=True)  # JSON string

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<PortfolioSnapshot(date={self.snapshot_date}, value={self.total_value_cad})>"
