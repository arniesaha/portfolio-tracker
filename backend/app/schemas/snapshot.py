"""
Portfolio Snapshot Schemas

Pydantic models for portfolio snapshot data validation.
"""
from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict


class PortfolioSnapshotBase(BaseModel):
    """Base schema for portfolio snapshot"""
    snapshot_date: date
    total_value_cad: Decimal = Field(..., ge=0)
    total_cost_cad: Decimal = Field(..., ge=0)
    unrealized_gain_cad: Decimal
    unrealized_gain_pct: Decimal
    holdings_count: int = Field(..., ge=0)
    value_by_country: Optional[str] = None


class PortfolioSnapshotCreate(PortfolioSnapshotBase):
    """Schema for creating a portfolio snapshot"""
    pass


class PortfolioSnapshotResponse(PortfolioSnapshotBase):
    """Schema for portfolio snapshot response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PortfolioHistoryResponse(BaseModel):
    """Schema for portfolio history (multiple snapshots)"""
    snapshots: list[PortfolioSnapshotResponse]
    start_date: date
    end_date: date
    total_days: int
    current_value: Decimal
    value_change: Decimal
    value_change_pct: Decimal

    class Config:
        from_attributes = True
