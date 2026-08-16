# Vehicle Finance App

Loan management system for bike/car/auto financing (RAM Finance). Track customers, loans, EMIs, pending dues, payments, and reports.

## Architecture

Two independent apps live in one repo (no shared workspace or root package.json):

| Directory | Tech | Deployed to |
|---|---|---|
| `frontend/` | React 18 + Vite SPA (React Query, react-hook-form, Tailwind, Headless UI) | GitHub Pages at `backup-alt.github.io/FWA/` |
| `backend/` | Express + Mongoose (MongoDB Atlas), JWT auth | Render |

The backend exposes only `/api/*`; it does not serve the frontend build. The frontend uses a **HashRouter** (URLs like `#/customers`) with a `/FWA/` base path.

## Features

- Customer management with profile photos, file IDs, and contact numbers
- Loan creation wizard (customer → guarantor → vehicle & finance → cheques) with automatic EMI/installment schedule generation
- Installment tracking (paid / partial / pending / overdue), overpayment handling, loan close & restructure
- Customers and pending-dues lists with infinite scroll, search, and filters
- Payment and pending-dues reports with Excel export
- Role-based auth (default seed user `owner/owner123`)

## Local development

Requirements: Node.js (18+), a local MongoDB or network access to the Atlas cluster.

**Backend** (port 5000):

```sh
cd backend
npm install
npm run dev        # nodemon, or: npm start
```

Set `MONGODB_URI` (a `.env` file is expected but optional — the code falls back to a hardcoded Atlas URI and seeds a default `owner/owner123` user when the database is empty).

**Frontend** (port 5173):

```sh
cd frontend
npm install
npm run dev        # proxies /api to http://localhost:5000
```

Open `http://127.0.0.1:5173`. On `localhost`/`127.0.0.1` the app talks to the local backend; on any other origin it uses `VITE_API_URL` (`frontend/.env.production`) — so local dev always requires the local backend running.

## Build & deploy

```sh
cd frontend
npm run lint       # only verification gate; must pass with 0 warnings
npm run build      # outputs to frontend/dist
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds `frontend/` and publishes `frontend/dist` to GitHub Pages (copying `index.html` to `404.html` for SPA fallback). The backend deploys separately to Render.

## Schema & loan rules

`docs/LOAN_TEMPLATE.md` is the authoritative reference for Customer/Loan documents and installment rules — read it before changing any loan or customer logic. Key invariants: `dueAmount` is immutable after creation (only manual edits change it), overpayments live in the paid installment's `extraAmount` (no phantom installments), and `cellNumbers` must be arrays of `{ number }` objects.
