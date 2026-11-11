# 🧺 PantryWise

**A smart pantry & expiry tracker that helps you waste less food.**

Household food waste is a huge, everyday problem — people forget what's in the fridge, miss expiry dates, and end up throwing food (and money) away. PantryWise keeps a running inventory of your pantry, warns you *before* items expire, and builds your shopping list from what's running low.

It's a fully client-side single-page app — **no backend, no account, no database**. Everything lives in your browser via `localStorage`, so it works offline and your data never leaves your device.

---

## ✨ Features

- **Dashboard** — at-a-glance counts for total items, expiring soon, already expired, and low stock.
- **Pantry inventory** — add, edit, and remove items with category, quantity, unit, storage location, purchase and expiry dates.
- **Expiry awareness** — colour-coded status (fresh / expiring / expired) and relative labels like *"in 3 days"* or *"expired 2 days ago"*.
- **Filtering & sorting** — search by name, filter by category and location, sort by expiry, name, or date added.
- **Shopping list** — a quick manual list, plus one-click "Add low-stock" that auto-fills items running low (and skips ones already on the list).
- **Usage & waste stats** — tracks what gets used vs. what expires, computes a waste rate, and shows a 7-day expiry timeline, a category breakdown, and a recent-activity feed.
- **Charts** — built with Chart.js (use vs. waste, items by category, expiry timeline).
- **CSV import / export** — back up your pantry or move it to another device.
- **Dark / light theme** — remembered across sessions.
- **Responsive** — works on desktop and mobile.

---

## 🧱 Tech stack

- Vanilla **JavaScript** (no framework, no build step) organised into small modules via a shared `PW` namespace.
- Plain **HTML + CSS** with CSS custom properties for theming.
- **Chart.js 4** loaded from a CDN for the charts.
- **localStorage** for persistence.

No dependencies to install and nothing to compile — the whole app is just static files.

---

## 🚀 Getting started

You can either open the app directly or run a tiny local server (recommended, since browsers treat some features differently over `file://`).

### Option A — just open it
Double-click `index.html`. Everything works, including data in `localStorage`.

### Option B — run a local server (recommended)
Pick whichever you already have:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve

# Or use the "Live Server" extension in VS Code
```

Then visit `http://localhost:8000`.

> Tip: the very first time you open it, go to **Settings → Load sample data** to see the dashboard, charts, and lists populated.

---

## 📁 Project structure

```
pantry-wise/
├── index.html              # App shell + all views (SPA)
├── css/
│   └── styles.css          # Design tokens, theming, layout, components
├── js/
│   ├── utils.js            # Constants, date/number/CSV helpers, HTML escaping
│   ├── store.js            # localStorage-backed state + CRUD + pub/sub
│   ├── pantry.js           # Dashboard + filterable pantry grid
│   ├── shopping.js         # Shopping list + low-stock auto-fill
│   ├── stats.js            # Usage/waste figures + activity feed
│   ├── charts.js           # Chart.js rendering (theme-aware)
│   ├── ui.js               # Dropdowns, modal, toasts, CSV import/export, theme
│   └── main.js             # Bootstrap + all event wiring
├── README.md
└── LICENSE
```

---

## 💡 How it works (a quick tour)

- **State** lives in `js/store.js`. Every mutation (`addItem`, `removeItem`, …) persists to `localStorage` and notifies subscribers, which triggers a full re-render. That keeps the UI and storage always in sync.
- **Expiry logic** is in `utils.js`: `itemStatus()` classifies an item as `fresh`, `expiring`, or `expired` based on whole-day differences between its expiry date and today. The "expiring soon" window is configurable via settings (default 3 days).
- **"Use one"** decrements an item's quantity; when it reaches zero the item is removed and logged to history as `consumed`. Manually removing an item logs it as `expired` (if it's past its date) or `removed`.
- **Waste rate** = expired ÷ (used + expired). The shopping auto-fill pulls in any item at or below the low-stock threshold (default ≤ 1) that isn't already on the list.

---

## 🧰 CSV format

Exported (and expected on import) columns:

```
name,category,quantity,unit,location,purchaseDate,expiryDate
Milk,dairy,1,l,fridge,2026-11-10,2026-11-15
```

`category` must be one of: `produce, dairy, meat, grains, bakery, beverages, snacks, frozen, condiments, canned, other`.
`location` must be one of: `fridge, freezer, pantry, counter`.
Dates are `YYYY-MM-DD`. `expiryDate` may be empty for non-perishables.

---

## 🔒 Privacy

There is no server. All data is stored locally in your browser. Clearing your browser storage (or **Settings → Clear all data**) wipes everything. Nothing is ever transmitted anywhere.

---

## 🛠️ Possible next steps

- Editable low-stock threshold and "expiring soon" window in Settings
- Barcode / receipt scanning
- Recipe suggestions for items expiring soon
- Multi-household sync via a backend

---

## 📄 License

MIT — see [LICENSE](LICENSE). Use it, fork it, make it yours.
