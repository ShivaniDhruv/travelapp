# Travel Price Finder — MVP (mock)

This is a minimal prototype that accepts an availability date range and a list of destinations and returns the best (cheapest) candidate trips using a mock provider.

What you'll find:
- `server.js` - Express server and /api/search endpoint
- `lib/flightProvider.js` - a mock price provider (replace with a real API)
- `public/` - static frontend (index.html + app.js)
- `test/testProvider.js` - a tiny test to exercise the mock provider

How to run

1. From the project root:

```powershell
cd c:\Users\user\Documents\travelapp
npm install
npm start
```

2. Open http://localhost:3000 in your browser

Notes and next steps
- The mock provider in `lib/flightProvider.js` is intentionally simple. For production use, replace it with:
  - a flights API (Amadeus, Skyscanner via RapidAPI, Kiwi, etc.), or
  - a headless-browser scraper (Puppeteer) if you must scrape public sites (be careful with terms-of-service and rate limits).
- Add persistence (user accounts, saved searches), rate limiting, and background jobs for continuous scraping.

Legal/TOS: scraping flight sites may violate their terms; prefer partner APIs.
