from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db, SessionLocal
from .routers import holdings, transactions, prices, analytics, snapshots, imports
from .services.snapshot_service import SnapshotService
from .models.holding import Holding
import logging
import asyncio
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# Global loading state
class AppState:
    is_loading: bool = True
    loading_message: str = "Starting up..."
    loading_started_at: Optional[datetime] = None
    loading_completed_at: Optional[datetime] = None
    holdings_count: int = 0
    prices_loaded: int = 0
    error: Optional[str] = None

app_state = AppState()

# Create FastAPI app
app = FastAPI(
    title="Portfolio Tracker API",
    description="API for tracking Canadian and Indian stock investments",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(holdings.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(prices.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(snapshots.router, prefix="/api/v1")
app.include_router(imports.router, prefix="/api/v1")


async def load_initial_data():
    """Background task to load initial price data"""
    global app_state

    db = SessionLocal()
    try:
        holdings_count = db.query(Holding).filter(Holding.is_active == True).count()
        app_state.holdings_count = holdings_count

        if holdings_count > 0:
            app_state.loading_message = f"Fetching prices for {holdings_count} holdings..."
            logger.info(f"Found {holdings_count} active holdings, creating initial snapshot...")

            try:
                # Run the snapshot creation in a thread pool to not block
                loop = asyncio.get_event_loop()
                snapshot = await loop.run_in_executor(
                    None,
                    SnapshotService.create_snapshot,
                    db
                )
                app_state.prices_loaded = holdings_count
                logger.info(f"Initial snapshot created for {snapshot.snapshot_date}")
            except Exception as e:
                logger.warning(f"Could not create initial snapshot: {e}")
                app_state.error = str(e)
        else:
            logger.info("No active holdings, skipping initial snapshot")

        app_state.is_loading = False
        app_state.loading_completed_at = datetime.now()
        app_state.loading_message = "Ready"
        logger.info("Initial data loading complete")

    except Exception as e:
        logger.error(f"Error during initial data load: {e}")
        app_state.is_loading = False
        app_state.error = str(e)
        app_state.loading_message = "Error during initialization"
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    global app_state

    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")

    # Set loading state and start background data loading
    app_state.is_loading = True
    app_state.loading_started_at = datetime.now()
    app_state.loading_message = "Initializing..."

    # Start background task to load initial data (non-blocking)
    asyncio.create_task(load_initial_data())


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Portfolio Tracker API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }


@app.get("/api/v1/status")
async def app_status():
    """Get application loading status"""
    global app_state

    return {
        "is_loading": app_state.is_loading,
        "loading_message": app_state.loading_message,
        "holdings_count": app_state.holdings_count,
        "prices_loaded": app_state.prices_loaded,
        "loading_started_at": app_state.loading_started_at.isoformat() if app_state.loading_started_at else None,
        "loading_completed_at": app_state.loading_completed_at.isoformat() if app_state.loading_completed_at else None,
        "error": app_state.error,
        "ready": not app_state.is_loading and app_state.error is None
    }
