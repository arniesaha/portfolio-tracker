# Troubleshooting Guide

## Common Issues and Solutions

### 1. Yahoo Finance Rate Limiting (429 Errors)

**Symptoms:**
```
ERROR:yfinance:429 Client Error: Too Many Requests
ERROR:app.services.price_service:Error fetching price for SHOP.TO
```

**Cause:**
Yahoo Finance API has rate limits. Making too many requests in a short time results in 429 errors.

**Solutions:**

1. **Wait and Retry** (Recommended)
   - The app has automatic rate limiting with 2-second delays between requests
   - Price cache extended to 15 minutes
   - Simply wait 15-30 minutes and prices will work again

2. **Use Cached Prices**
   - Portfolio continues to work with cached prices
   - Dashboard shows last fetched prices (up to 15 minutes old)
   - The cache will retry automatically after expiration

3. **Reduce Refresh Frequency**
   - Don't click "Refresh Prices" repeatedly
   - The dashboard auto-refreshes every 5 minutes
   - Price cache is 15 minutes to reduce API calls

**Prevention:**
- Avoid refreshing prices multiple times in quick succession
- Built-in rate limiting (2 seconds between requests)
- Longer cache duration (15 minutes)

### 2. Holdings Form Validation Errors (422 Unprocessable Content)

**Symptoms:**
```
INFO:     127.0.0.1:44950 - "POST /api/v1/holdings/ HTTP/1.1" 422 Unprocessable Content
```

**Cause:**
Form data doesn't match the expected schema (missing required fields, wrong data types, etc.)

**Common Causes:**

1. **Missing Required Fields**
   - `symbol`, `exchange`, `country`, `quantity`, `avg_purchase_price` are required
   - Make sure all fields are filled in the form

2. **Incorrect Data Types**
   - `quantity` must be a number (not text)
   - `avg_purchase_price` must be a decimal number
   - `symbol` must be text

3. **Invalid Symbol Format**
   - Use `.TO` suffix for TSX stocks (e.g., `SHOP.TO`)
   - Use `.NS` suffix for NSE stocks (e.g., `RELIANCE.NS`)
   - Use `.BO` suffix for BSE stocks (e.g., `RELIANCE.BO`)
   - No suffix for US stocks (e.g., `AAPL`)

**Solution:**
Check the browser console for detailed validation error messages and ensure all required fields are properly filled.

### 3. Backend Won't Start

**Symptoms:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Port Already in Use:**
```
ERROR: [Errno 98] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### 4. Frontend Won't Start

**Symptoms:**
```
Error: Cannot find module 'react'
```

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

**Port Already in Use:**
```
Port 5173 is in use
```

**Solution:**
Vite will automatically suggest the next available port. Accept it or:
```bash
npm run dev -- --port 5174
```

### 5. Can't Connect to API

**Symptoms:**
- Frontend shows "Failed to load" errors
- Network errors in browser console
- CORS errors

**Solution:**

1. **Check Backend is Running:**
```bash
curl http://localhost:8000/api/v1/health
```
Should return: `{"status":"healthy"}`

2. **Check Frontend .env:**
```bash
# frontend/.env should have:
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

3. **Check CORS Configuration:**
Backend automatically allows `http://localhost:5173`. If using a different port, update `backend/app/main.py`:
```python
origins = [
    "http://localhost:5173",
    "http://localhost:5174",  # Add your port
]
```

### 6. Prices Not Loading

**Symptoms:**
- Portfolio value shows $0
- Current prices show as "N/A"
- Price refresh button doesn't work

**Possible Causes:**

1. **Rate Limited by Yahoo Finance**
   - See solution #1 above
   - Wait 15-30 minutes
   - Check backend logs for "429" errors

2. **Invalid Symbol Format**
   - Verify symbol on finance.yahoo.com first
   - Use correct suffix (.TO, .NS, .BO)
   - Test with well-known stocks (AAPL, SHOP.TO)

3. **Delisted or Inactive Stock**
   - Yahoo Finance doesn't have data for all stocks
   - Try a different, actively traded symbol

4. **Network Issues**
   - Check internet connection
   - Try accessing finance.yahoo.com directly

**Solution:**
```bash
# Test price fetching directly via API
curl http://localhost:8000/api/v1/prices/AAPL

# Check backend logs for errors
tail -f backend/logs/app.log  # if logging to file
# or watch terminal where backend is running
```

### 7. Transaction Calculation Discrepancy

**Symptoms:**
- "Discrepancy Detected" warning on Transactions page
- Calculated shares don't match database

**Causes:**
1. **Transactions out of order** - Should be fixed automatically (transactions sorted chronologically)
2. **Manual database edits** - Direct database changes bypass transaction history
3. **Rounding errors** - Very rare, usually < 0.01 shares

**Solution:**
Use the import script to recalculate holdings from transactions:
```bash
cd backend
python3 import_real_transactions.py
```

This will:
- Read all transactions from the database
- Recalculate holdings based on chronological transaction history
- Update database with correct values

### 8. Database Issues

**Symptoms:**
- "No such table" errors
- Empty holdings/transactions
- Database locked errors

**Solution:**

1. **Database Not Created:**
```bash
# Check if database exists
ls -la data/portfolio.db

# If missing, restart backend (creates database automatically)
./start-backend.sh
```

2. **Database Locked:**
```bash
# Close any SQLite browser/tool
# Restart backend
./start-backend.sh
```

3. **Corrupted Database:**
```bash
# Backup first
cp data/portfolio.db data/portfolio.db.backup

# Delete and restart (creates fresh database)
rm data/portfolio.db
./start-backend.sh
```

### 9. Performance Issues

**Symptoms:**
- Slow page loads
- Dashboard takes long to render
- Price refresh is very slow

**Solutions:**

1. **Too Many Holdings:**
   - Price fetching takes 2-5 seconds per symbol
   - With rate limiting, 10 symbols = 20+ seconds
   - Solution: Be patient, use cache

2. **Clear Browser Cache:**
```bash
# In Chrome: Ctrl+Shift+Delete
# Or use Incognito mode
```

3. **Check Backend Logs:**
   - Look for slow queries
   - Check for repeated API calls
   - Monitor memory usage

### 10. Import Scripts Not Working

**Symptoms:**
```bash
python3 import_real_transactions.py
ModuleNotFoundError: No module named 'sqlalchemy'
```

**Solution:**
```bash
cd backend
source venv/bin/activate
python3 import_real_transactions.py
```

## Getting Help

If your issue isn't listed here:

1. **Check Backend Logs**
   - Watch terminal where `./start-backend.sh` is running
   - Look for ERROR or WARNING messages

2. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Check API Documentation**
   - Visit http://localhost:8000/docs
   - Test endpoints directly in Swagger UI

4. **Review Project Documentation**
   - [README.md](../README.md) - Main documentation
   - [CLAUDE.md](../CLAUDE.md) - Full PRD and specifications

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `429 Too Many Requests` | Yahoo Finance rate limit | Wait 15-30 minutes |
| `422 Unprocessable Content` | Invalid form data | Check required fields |
| `404 Not Found` | Wrong API endpoint | Check URL and docs |
| `500 Internal Server Error` | Backend error | Check backend logs |
| `CORS error` | Frontend can't reach backend | Check CORS config |
| `Module not found` | Missing dependencies | `pip install -r requirements.txt` |
| `Address already in use` | Port conflict | Change port or kill process |
| `Database locked` | Multiple connections | Close other DB tools |

## Performance Tips

- Don't refresh prices more than once per 15 minutes
- Use the dashboard's auto-refresh (every 5 minutes)
- Keep holdings under 20 for best performance
- Test with popular stocks first (AAPL, SHOP.TO, etc.)
- Monitor backend logs during development

## Best Practices

1. **Symbol Format:**
   - TSX: `SHOP.TO`, `TD.TO`
   - NSE: `RELIANCE.NS`, `TCS.NS`
   - BSE: `RELIANCE.BO`
   - US: `AAPL`, `MSFT` (no suffix)

2. **Testing:**
   - Start with well-known stocks
   - Verify on finance.yahoo.com first
   - Add one holding at a time

3. **Price Fetching:**
   - Use manual refresh sparingly
   - Let cache work (15 minutes)
   - Accept that some symbols may not work

4. **Transactions:**
   - Keep transactions chronological
   - Don't edit database directly
   - Use provided scripts for bulk imports

---

**Last Updated:** October 25, 2025
