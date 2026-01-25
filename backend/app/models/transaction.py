from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, Text, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    holding_id = Column(Integer, ForeignKey("holdings.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    transaction_type = Column(String(10), nullable=False)  # BUY, SELL
    quantity = Column(Numeric(15, 4), nullable=False)
    price_per_share = Column(Numeric(15, 4), nullable=False)
    fees = Column(Numeric(15, 4), default=0)
    transaction_date = Column(Date, nullable=False, index=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
