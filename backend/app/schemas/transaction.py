from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class TransactionBase(BaseModel):
    holding_id: Optional[int] = None
    symbol: Optional[str] = Field(None, max_length=50)
    transaction_type: str = Field(..., pattern="^(BUY|SELL|SPLIT|CONT|TFR_IN|TFR_OUT)$")
    transaction_category: str = Field(default="TRADE", pattern="^(TRADE|CORPORATE_ACTION|CONTRIBUTION|WITHDRAWAL|TRANSFER)$")
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    price_per_share: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    amount: Optional[Decimal] = Field(None, decimal_places=2)
    fees: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=4)
    currency: Optional[str] = None
    account_type: Optional[str] = None
    account_id: Optional[str] = None
    transaction_date: date
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
