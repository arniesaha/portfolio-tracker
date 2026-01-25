from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Date, Text
from sqlalchemy.sql import func
from ..database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    company_name = Column(String(200))
    exchange = Column(String(20), nullable=False)
    country = Column(String(2), nullable=False)  # CA, IN, US
    quantity = Column(Numeric(15, 4), nullable=False)
    avg_purchase_price = Column(Numeric(15, 4), nullable=False)
    currency = Column(String(3), default="CAD")
    first_purchase_date = Column(Date)
    notes = Column(Text)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
