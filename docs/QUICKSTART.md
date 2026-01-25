# Quick Start Guide

This guide will help you get your Portfolio Tracker up and running in minutes.

## Prerequisites

- Python 3.11+ (tested with Python 3.13)
- Node.js 18+
- npm

## Starting the Application

### Option 1: Using the startup scripts (easiest)

1. **Start the backend:**
```bash
./start-backend.sh
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

2. **Start the frontend** (in a new terminal):
```bash
./start-frontend.sh
```

The application will be available at `http://localhost:5173`

### Option 2: Manual setup

**Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Using the Application

1. Open your browser to `http://localhost:5173`
2. Click on "Holdings" in the navigation
3. Click "Add New Holding" to add your first stock
4. Fill in the details:
   - Symbol: e.g., `SHOP.TO` for Canadian stocks, `RELIANCE.NS` for Indian stocks
   - Select the exchange (TSX, NSE, BSE, etc.)
   - Enter quantity and purchase price
   - Optionally add company name, purchase date, and notes
5. Click "Add Holding"

## Testing the API Directly

You can also test the API using curl or the interactive docs at `http://localhost:8000/docs`

**Create a holding:**
```bash
curl -X POST http://localhost:8000/api/v1/holdings/ \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SHOP.TO",
    "company_name": "Shopify Inc.",
    "exchange": "TSX",
    "country": "CA",
    "quantity": 50,
    "avg_purchase_price": 65.50,
    "currency": "CAD"
  }'
```

**Get all holdings:**
```bash
curl http://localhost:8000/api/v1/holdings/
```

## What's Working (Phase 1)

- ✅ Add new holdings
- ✅ View all holdings in a table
- ✅ Edit existing holdings
- ✅ Delete holdings (soft delete)
- ✅ Filter by country, exchange
- ✅ Responsive UI
- ✅ Local SQLite database

## What's Coming Next

**Phase 2** (Transactions & Prices):
- Transaction history
- Real-time price fetching
- Cost basis calculation

**Phase 3** (Analytics):
- Portfolio dashboard with charts
- Performance metrics
- Allocation visualizations

**Phase 4** (AI Features):
- News summarization
- Portfolio health check
- Rebalancing suggestions

## Database Location

The SQLite database is stored at `data/portfolio.db`

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop the backend and frontend servers.

## Troubleshooting

**Backend won't start:**
- Make sure the virtual environment is activated
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Check the port 8000 is not already in use

**Frontend won't start:**
- Make sure dependencies are installed: `npm install`
- Check the port 5173 is not already in use

**Can't connect to API:**
- Make sure the backend is running on port 8000
- Check the `.env` file in the frontend directory has the correct API URL

## Need Help?

See the full [README.md](README.md) for detailed setup instructions.
