from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.transaction import Transaction
from ..models.holding import Holding
from ..schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    holding_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get all transactions with optional filters"""
    query = db.query(Transaction)

    if holding_id:
        query = query.filter(Transaction.holding_id == holding_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.upper())
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    transactions = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    return transactions


@router.get("/holding/{holding_id}", response_model=List[TransactionResponse])
def get_transactions_by_holding(
    holding_id: int,
    db: Session = Depends(get_db)
):
    """Get all transactions for a specific holding"""
    # Verify holding exists
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with id {holding_id} not found"
        )

    transactions = db.query(Transaction).filter(
        Transaction.holding_id == holding_id
    ).order_by(Transaction.transaction_date.desc()).all()

    return transactions


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction"""
    # Verify holding exists
    holding = db.query(Holding).filter(
        Holding.id == transaction.holding_id,
        Holding.is_active == True
    ).first()

    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with id {transaction.holding_id} not found"
        )

    # Verify symbol matches
    if holding.symbol != transaction.symbol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Symbol mismatch: holding has {holding.symbol}, transaction has {transaction.symbol}"
        )

    # Create transaction
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)

    # Update holding's average cost and quantity
    if transaction.transaction_type == "BUY":
        total_cost = (holding.quantity * holding.avg_purchase_price) + \
                     (transaction.quantity * transaction.price_per_share) + \
                     transaction.fees
        holding.quantity += transaction.quantity
        holding.avg_purchase_price = total_cost / holding.quantity
    elif transaction.transaction_type == "SELL":
        if holding.quantity < transaction.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot sell {transaction.quantity} shares, only {holding.quantity} available"
            )
        holding.quantity -= transaction.quantity
        # Average cost stays the same on sell

    db.commit()
    db.refresh(db_transaction)

    return db_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction"""
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    db.delete(db_transaction)
    db.commit()

    return None
