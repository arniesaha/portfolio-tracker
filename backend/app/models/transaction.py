from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, Text, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    holding_id = Column(Integer, ForeignKey("holdings.id"), nullable=True, index=True)
    symbol = Column(String(20), nullable=True)
    transaction_type = Column(String(10), nullable=False)  # BUY, SELL, SPLIT, CONT, TFR_IN, TFR_OUT
    transaction_category = Column(String(20), nullable=False, default="TRADE")  # TRADE, CORPORATE_ACTION, CONTRIBUTION, WITHDRAWAL, TRANSFER
    quantity = Column(Numeric(15, 4), nullable=True)
    price_per_share = Column(Numeric(15, 4), nullable=True)
    amount = Column(Numeric(15, 2), nullable=True)  # Dollar amount for contributions/withdrawals
    fees = Column(Numeric(15, 4), default=0)
    currency = Column(String(3), nullable=True)
    account_type = Column(String(20), nullable=True, index=True)  # RRSP, TFSA, FHSA, etc.
    account_id = Column(String(50), nullable=True, index=True)  # Brokerage/account identifier
    transaction_date = Column(Date, nullable=False, index=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
