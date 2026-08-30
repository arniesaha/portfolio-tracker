#!/usr/bin/env python3
"""
Test contribution tracking: import CSVs and verify /analytics/contributions endpoint.
"""
import os
import sys
from pathlib import Path
from decimal import Decimal

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.transaction import Transaction
from app.models.holding import Holding
from app.services.import_service import ImportService
from app.schemas.import_schema import ImportPlatform

# Use in-memory SQLite for testing
DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)


def test_wealthsimple_contribution_parsing():
    """Test that Wealthsimple CONT transactions are parsed correctly."""
    csv_content = """date,transaction,description,amount,balance,currency
2025-06-02,CONT,Contribution,10000.00,10000.00,CAD
2025-06-10,BUY,"XEQT - iShares Core Equity ETF Portfolio: Bought 100.0000 shares (executed at 2025-06-10)",-3600.00,6400.00,CAD
2025-06-15,CONT,Contribution,5000.00,11400.00,CAD
"""
    transactions, warnings = ImportService.parse_wealthsimple_csv(csv_content, account_type="RRSP")

    contributions = [t for t in transactions if t.transaction_category == "CONTRIBUTION"]
    trades = [t for t in transactions if t.transaction_category == "TRADE"]

    assert len(contributions) == 2, f"Expected 2 contributions, got {len(contributions)}"
    assert len(trades) == 1, f"Expected 1 trade, got {len(trades)}"
    assert contributions[0].amount == Decimal("10000.00")
    assert contributions[1].amount == Decimal("5000.00")
    assert contributions[0].account_type == "RRSP"
    assert contributions[0].transaction_type == "CONT"
    print("  PASS: Wealthsimple CONT parsing")


def test_wealthsimple_account_type_from_filename():
    """Test account type detection from filename."""
    assert ImportService.detect_account_type_from_filename("RRSP-2025-06.csv") == "RRSP"
    assert ImportService.detect_account_type_from_filename("TFSA-2025-06.csv") == "TFSA"
    assert ImportService.detect_account_type_from_filename("FHSA-2025-01.csv") == "FHSA"
    assert ImportService.detect_account_type_from_filename("random.csv") is None
    print("  PASS: Account type detection from filename")


def test_td_contribution_parsing():
    """Test that TD CONT/TFR-IN/TFROUT transactions are parsed correctly."""
    csv_content = """As of Date,2025-09-30 21:59:31
Account,TD Direct Investing - 71XW74J

Trade Date,Settle Date,Description,Action,Quantity,Price,Commission,Net Amount,Currency
15 Jul 2025,17 Jul 2025,CONTRIBUTION,CONT,,,,"5000.00",CAD
20 Jul 2025,22 Jul 2025,ISHARES CORE EQUITY ETF,BUY,50,36.50,9.99,1834.99,CAD
01 Aug 2025,03 Aug 2025,TRANSFER IN,TFR-IN,,,,"3000.00",CAD
10 Sep 2025,10 Sep 2025,TRANSFER OUT,TFROUT,,,,"1500.00",CAD
"""
    transactions, warnings = ImportService.parse_td_direct_csv(csv_content, account_type="RRSP")

    contributions = [t for t in transactions if t.transaction_category == "CONTRIBUTION"]
    transfers = [t for t in transactions if t.transaction_category == "TRANSFER"]
    trades = [t for t in transactions if t.transaction_category == "TRADE"]

    assert len(contributions) == 1, f"Expected 1 contribution, got {len(contributions)}"
    assert len(transfers) == 2, f"Expected 2 transfers, got {len(transfers)}"
    assert len(trades) == 1, f"Expected 1 trade, got {len(trades)}"
    assert contributions[0].amount == Decimal("5000.00")
    assert transfers[0].transaction_type == "TFR_IN"
    assert transfers[0].amount == Decimal("3000.00")
    assert transfers[1].transaction_type == "TFR_OUT"
    assert transfers[1].amount == Decimal("1500.00")
    print("  PASS: TD CONT/TFR-IN/TFROUT parsing")


def test_import_and_query_contributions():
    """Test full import flow and verify contribution data in DB."""
    session = Session()

    # Import Wealthsimple RRSP June
    csv_june = """date,transaction,description,amount,balance,currency
2025-06-02,CONT,Contribution,10000.00,10000.00,CAD
2025-06-10,BUY,"XEQT - iShares Core Equity ETF Portfolio: Bought 100.0000 shares (executed at 2025-06-10)",-3600.00,6400.00,CAD
2025-06-15,CONT,Contribution,5000.00,11400.00,CAD
"""
    result_june = ImportService.import_transactions(
        db=session, content=csv_june, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="RRSP"
    )
    assert result_june.success, f"June import failed: {result_june.errors}"

    # Import July
    csv_july = """date,transaction,description,amount,balance,currency
2025-07-01,CONT,Contribution,8000.00,16650.00,CAD
2025-07-20,CONT,Contribution,4452.00,17107.00,CAD
"""
    result_july = ImportService.import_transactions(
        db=session, content=csv_july, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="RRSP"
    )
    assert result_july.success, f"July import failed: {result_july.errors}"

    # Import August
    csv_aug = """date,transaction,description,amount,balance,currency
2025-08-01,CONT,Contribution,5000.00,22107.00,CAD
"""
    result_aug = ImportService.import_transactions(
        db=session, content=csv_aug, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="RRSP"
    )
    assert result_aug.success, f"August import failed: {result_aug.errors}"

    # Import TFSA
    csv_tfsa = """date,transaction,description,amount,balance,currency
2025-06-05,CONT,Contribution,7000.00,7000.00,CAD
"""
    result_tfsa = ImportService.import_transactions(
        db=session, content=csv_tfsa, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="TFSA"
    )
    assert result_tfsa.success, f"TFSA import failed: {result_tfsa.errors}"

    # Query RRSP contributions
    from sqlalchemy import extract
    rrsp_contributions = session.query(Transaction).filter(
        Transaction.transaction_category == "CONTRIBUTION",
        Transaction.account_type == "RRSP",
        extract("year", Transaction.transaction_date) == 2025
    ).all()

    rrsp_total = sum(c.amount for c in rrsp_contributions)
    assert rrsp_total == Decimal("32452.00"), f"Expected RRSP total $32,452, got ${rrsp_total}"
    print(f"  PASS: RRSP 2025 contributions = ${rrsp_total} (5 transactions)")

    # Query TFSA contributions
    tfsa_contributions = session.query(Transaction).filter(
        Transaction.transaction_category == "CONTRIBUTION",
        Transaction.account_type == "TFSA",
        extract("year", Transaction.transaction_date) == 2025
    ).all()

    tfsa_total = sum(c.amount for c in tfsa_contributions)
    assert tfsa_total == Decimal("7000.00"), f"Expected TFSA total $7,000, got ${tfsa_total}"
    print(f"  PASS: TFSA 2025 contributions = ${tfsa_total} (1 transaction)")

    # Verify trade transaction also imported
    trades = session.query(Transaction).filter(
        Transaction.transaction_category == "TRADE"
    ).all()
    assert len(trades) == 1, f"Expected 1 trade, got {len(trades)}"
    print(f"  PASS: Trade transactions = {len(trades)}")

    session.close()


def test_dedup_contributions():
    """Test that duplicate contributions are skipped."""
    session = Session()

    csv = """date,transaction,description,amount,balance,currency
2025-09-01,CONT,Contribution,3000.00,3000.00,CAD
"""
    # Import once
    result1 = ImportService.import_transactions(
        db=session, content=csv, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="FHSA"
    )
    assert result1.success
    assert result1.transactions_imported == 1

    # Import again - should be deduplicated
    result2 = ImportService.import_transactions(
        db=session, content=csv, platform=ImportPlatform.WEALTHSIMPLE,
        account_type="FHSA"
    )
    assert result2.success
    assert result2.duplicates_skipped == 1
    assert result2.transactions_imported == 0
    print("  PASS: Contribution deduplication")

    session.close()


def test_fhsa_tfr_in_import_and_dedup():
    """FHSA TD TFR-IN imports once; same-file re-import is deduplicated."""
    session = Session()

    csv_content = """As of Date,2026-01-24 21:59:31
Account,TD Direct Investing - FHSA

Trade Date,Settle Date,Description,Action,Quantity,Price,Commission,Net Amount,Currency
20 Jan 2026,22 Jan 2026,TRANSFER IN,TFR-IN,,,,"3000.00",CAD
"""

    result1 = ImportService.import_transactions(
        db=session, content=csv_content, platform=ImportPlatform.TD_DIRECT,
        account_type="FHSA"
    )
    assert result1.success, f"Initial import failed: {result1.errors}"
    assert result1.transactions_imported == 1, (
        f"Expected 1 imported, got {result1.transactions_imported}"
    )

    result2 = ImportService.import_transactions(
        db=session, content=csv_content, platform=ImportPlatform.TD_DIRECT,
        account_type="FHSA"
    )
    assert result2.success
    assert result2.transactions_imported == 0, (
        f"Expected 0 imports on re-import, got {result2.transactions_imported}"
    )
    assert result2.duplicates_skipped == 1, (
        f"Expected 1 duplicate, got {result2.duplicates_skipped}"
    )
    print("  PASS: FHSA TFR-IN import deduplication")

    session.close()


def test_td_fhsa_tfr_in_classified_as_contribution():
    """FHSA TFR-IN must be classified as CONTRIBUTION, not TRANSFER."""
    csv_content = """As of Date,2026-01-24 21:59:31
Account,TD Direct Investing - FHSA

Trade Date,Settle Date,Description,Action,Quantity,Price,Commission,Net Amount,Currency
15 Jan 2026,17 Jan 2026,CONTRIBUTION,CONT,,,,"2000.00",CAD
20 Jan 2026,22 Jan 2026,TRANSFER IN,TFR-IN,,,,"3000.00",CAD
"""
    transactions, warnings = ImportService.parse_td_direct_csv(csv_content, account_type="FHSA")

    contributions = [t for t in transactions if t.transaction_category == "CONTRIBUTION"]
    transfers = [t for t in transactions if t.transaction_category == "TRANSFER"]

    assert len(contributions) == 2, f"Expected 2 contributions, got {len(contributions)}"
    assert len(transfers) == 0, f"Expected 0 transfers, got {len(transfers)}"
    tfr_in = [t for t in contributions if t.transaction_type == "TFR_IN"]
    assert len(tfr_in) == 1
    assert tfr_in[0].transaction_category == "CONTRIBUTION"
    assert tfr_in[0].amount == Decimal("3000.00")
    assert tfr_in[0].account_type == "FHSA"
    assert tfr_in[0].currency == "CAD"
    assert tfr_in[0].raw_description == "TRANSFER IN"
    assert warnings == [], f"Expected no warnings, got {warnings}"
    print("  PASS: FHSA TFR-IN classified as CONTRIBUTION")


def test_td_non_fhsa_tfr_in_remains_transfer():
    """RRSP and TFSA TFR-IN must remain TRANSFER (control regression)."""
    csv_content = """As of Date,2026-01-24 21:59:31
Account,TD Direct Investing - 71XW74J

Trade Date,Settle Date,Description,Action,Quantity,Price,Commission,Net Amount,Currency
15 Jan 2026,17 Jan 2026,TRANSFER IN,TFR-IN,,,,"1500.00",CAD
"""
    for acct in ("RRSP", "TFSA", "NON_REG", None):
        transactions, warnings = ImportService.parse_td_direct_csv(csv_content, account_type=acct)
        contributions = [t for t in transactions if t.transaction_category == "CONTRIBUTION"]
        transfers = [t for t in transactions if t.transaction_category == "TRANSFER"]
        assert len(contributions) == 0, f"{acct}: expected 0 contributions, got {len(contributions)}"
        assert len(transfers) == 1, f"{acct}: expected 1 transfer, got {len(transfers)}"
        assert transfers[0].transaction_type == "TFR_IN"
        assert transfers[0].amount == Decimal("1500.00")
        assert warnings == [], f"{acct}: expected no warnings, got {warnings}"
    print("  PASS: Non-FHSA TFR-IN remains TRANSFER (RRSP + TFSA + NON_REG + None)")


if __name__ == "__main__":
    print("Testing contribution tracking...\n")

    test_wealthsimple_contribution_parsing()
    test_wealthsimple_account_type_from_filename()
    test_td_contribution_parsing()
    test_td_fhsa_tfr_in_classified_as_contribution()
    test_td_non_fhsa_tfr_in_remains_transfer()
    test_import_and_query_contributions()
    test_dedup_contributions()
    test_fhsa_tfr_in_import_and_dedup()

    print("\nAll tests passed!")
