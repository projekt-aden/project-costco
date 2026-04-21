# Costco Tracker

A privacy-first receipt tracker for Costco members. All data stays on your device — no accounts, no servers, no tracking.

Import your Costco receipts (JSON or PDF), and get instant insights into your spending: product history, price trends, year-over-year comparisons, and more.

## Features

- **Dashboard** — spending summary, recent receipts at a glance
- **Receipts** — full timeline grouped by year/month/day, detailed receipt view with items and coupons
- **Analysis** — product grid with category icons, search and sort by purchases/spend/date/name
- **Trends** — year-over-year spending comparison, personal inflation rate, top price movers
- **Top 10** — leaderboards across 6 categories (most purchased, most spent, etc.)
- **Gas** — fuel-specific analytics: price per gallon trends, total gallons, fill-up history
- **Import** — drag-and-drop or file picker for JSON and PDF receipts
- **Profile** — export/import data backup (JSON), delete all data

## Privacy

Zero backend. Everything runs in the browser:

- Receipts stored in **IndexedDB** (via Dexie.js)
- No network requests after page load
- No analytics, cookies, or third-party services
- Your data never leaves your device

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| Database | IndexedDB (Dexie.js) |
| Icons | Lucide React |
| PDF parsing | pdfjs-dist |
| Routing | React Router DOM |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

## Importing Receipts

### Bulk export (recommended)

Export all receipts at once using a browser console script:

1. Sign in at [costco.com](https://www.costco.com/myaccount/) and open In-Warehouse Receipts
2. Copy the contents of [`public/costco-export.js`](public/costco-export.js)
3. Open DevTools (F12) → Console → paste the script → Enter
4. Wait for the JSON file to download, then drop it into the Import page

The script runs entirely in your browser on costco.com — no data is sent anywhere. It reads `idToken` from localStorage and fetches receipts via Costco's GraphQL API in 6-month chunks (up to 2 years by default).

> **Note:** The script must be pasted directly into the console (not loaded via `fetch`) because costco.com's Content Security Policy blocks external script loading.

### PDF format
Save/print any receipt from costco.com as PDF. The parser extracts items, prices, taxes, and warehouse info automatically.

### Manual JSON
You can also export individual receipts as JSON from the DevTools Network tab (find the `graphql` response when viewing a receipt).

## Project Structure

```
src/
  components/     UI components organized by feature
    analysis/     Product cards, price charts
    dashboard/    Summary cards
    layout/       Shell with responsive nav (desktop tabs + mobile bottom bar)
    receipt/      Import button, drop zone, timeline
    trends/       Monthly chart, price movers
    ui/           DatePicker, YearPicker, YearSelect
  db/             IndexedDB schema, JSON/PDF parsers
  hooks/          React hooks for receipts, products, trends, year filter
  lib/            Product category matching (19 categories)
  pages/          Route pages
  test/           Test suites
  types/          TypeScript interfaces
```

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

42 tests across 4 suites covering receipt parsing, category matching, trend calculations, and date utilities.

## Mobile Support

Responsive layout with:
- Desktop: tab navigation in header
- Mobile: bottom bar with 7 tabs, profile in header
- Safe area support for iOS devices

## License

MIT
