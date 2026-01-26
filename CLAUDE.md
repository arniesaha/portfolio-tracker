# Portfolio Tracker

Personal web application to track stock investments across Canadian (TSX, TSX-V), US (NASDAQ, NYSE), and Indian (NSE, BSE) markets with analytics and multi-currency support.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy, SQLite
- **Frontend:** React 18 + Vite, TailwindCSS, Recharts, TanStack Query
- **External APIs:** yfinance (prices), exchangerate-api.com (currency)

## Quick Start

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Or use: `./start-backend.sh`

### Frontend
```bash
cd frontend
npm run dev
```
Or use: `./start-frontend.sh`

### URLs
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1
- API Docs: http://localhost:8000/docs

## Project Structure

```
portfolio-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── models/           # ORM models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API routes
│   │   └── services/         # Business logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks (React Query)
│   │   ├── services/         # API client
│   │   └── utils/            # Formatters, constants
│   └── package.json
├── data/
│   └── portfolio.db          # SQLite database
└── docs/                     # Full documentation
```

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /holdings` | List all active holdings |
| `POST /holdings` | Create holding |
| `GET /transactions` | List all transactions |
| `POST /transactions` | Create transaction |
| `GET /prices/current` | Current prices for all holdings |
| `POST /prices/refresh` | Force refresh all prices |
| `GET /portfolio/summary` | Portfolio overview |
| `GET /analytics/allocation` | Geographic & exchange breakdown |

## Database Tables

- `holdings` - Stock positions (symbol, exchange, quantity, avg_price)
- `transactions` - Buy/sell history
- `price_history` - Historical price data
- `exchange_rates` - Currency conversion rates
- `portfolio_snapshots` - Daily portfolio value snapshots

## Development Guidelines

### Backend
- Use async/await for I/O operations
- Validate inputs with Pydantic
- Use Decimal for financial calculations (never float)
- Return appropriate HTTP status codes

### Frontend
- Use React Query (TanStack Query) for server state
- Use `formatters.js` for display formatting
- Handle loading and error states in components

### Symbol Formats
- TSX: `SHOP.TO`, `TD.TO`
- NSE: `RELIANCE.NS`, `TCS.NS`
- BSE: `RELIANCE.BO`
- US: `AAPL`, `MSFT` (no suffix)

## Current Status

**Complete:**
- Holdings CRUD with soft delete
- Transaction history with cost basis calculation
- Real-time prices via yfinance (15-min cache)
- Portfolio analytics (summary, allocation, performance)
- Multi-currency support (CAD, USD, INR)
- Responsive dashboard UI

**In Progress:**
- Portfolio value history chart
- Snapshot service integration

**Planned:**
- Import from brokers (TD Direct, Wealthsimple, Zerodha)
- AI features (news summarization, portfolio health check)
- Export to CSV/PDF

## Known Issues

1. Yahoo Finance rate limits - 15-min cache helps, wait if 429 errors occur
2. Transaction history may need investigation
3. Portfolio history chart component exists but data pipeline incomplete

## Documentation

See `/docs` folder for detailed documentation:
- `QUICKSTART.md` - Get running quickly
- `PROJECT.md` - Full specifications and task tracker
- `DEPLOYMENT.md` - Docker and NAS deployment
- `TROUBLESHOOTING.md` - Common issues and solutions
