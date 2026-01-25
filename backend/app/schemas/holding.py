from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class HoldingBase(BaseModel):
    symbol: str = Field(..., max_length=20)
    company_name: Optional[str] = Field(None, max_length=200)
    exchange: str = Field(..., max_length=20)
    country: str = Field(..., max_length=2)
    quantity: Decimal = Field(..., gt=0, decimal_places=4)
    avg_purchase_price: Decimal = Field(..., gt=0, decimal_places=4)
    currency: str = Field(default="CAD", max_length=3)
    first_purchase_date: Optional[date] = None
    notes: Optional[str] = None


class HoldingCreate(HoldingBase):
    pass


class HoldingUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=200)
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    avg_purchase_price: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    first_purchase_date: Optional[date] = None
    notes: Optional[str] = None


class HoldingResponse(HoldingBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HoldingWithPrice(HoldingResponse):
    current_price: Optional[Decimal] = None
    market_value: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    unrealized_gain: Optional[Decimal] = None
    unrealized_gain_pct: Optional[Decimal] = None
