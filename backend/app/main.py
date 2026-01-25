from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db, SessionLocal
from .routers import holdings, transactions, prices, analytics, snapshots, imports
from .services.snapshot_service import SnapshotService
from .models.holding import Holding
import logging

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

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


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")

    # Create initial portfolio snapshot if holdings exist
    db = SessionLocal()
    try:
        holdings_count = db.query(Holding).filter(Holding.is_active == True).count()
        if holdings_count > 0:
            logger.info(f"Found {holdings_count} active holdings, creating initial snapshot...")
            try:
                snapshot = SnapshotService.create_snapshot(db)
                logger.info(f"Initial snapshot created for {snapshot.snapshot_date}")
            except Exception as e:
                logger.warning(f"Could not create initial snapshot: {e}")
        else:
            logger.info("No active holdings, skipping initial snapshot")
    finally:
        db.close()


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
