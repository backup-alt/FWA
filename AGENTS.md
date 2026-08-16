# AGENTS.md

Vehicle Finance App — loan management for bike/car/auto financing (RAM Finance). Two independent apps in one repo: **no root package.json, no shared workspace**. Deployed frontend lives on GitHub Pages (`/FWA/`), backend on Render.

## Layout & ownership
- `frontend/` — React 18 + Vite SPA. Owned repo entrypoints: `frontend/src/main.jsx`, `frontend/src/routes.jsx`.
- `backend/` — Express + Mongoose (MongoDB Atlas). Mounts only `/api/*` in `backend/server.js`; it does **not** serve the frontend build.
- `docs/LOAN_TEMPLATE.md` — authoritative Customer/Loan schema and installment rules. **Read before touching any loan/customer logic.**
- `backend/public/` — committed Vite build snapshot, not served by the backend. Never hand-edit; it is regenerated from `frontend/`.
- `Mobile app UI/` — standalone static HTML mockups (Tailwind CDN + Chart.js), **not** part of the React app; untracked in git and not deployed. Design reference only.
- `frontend/css/`, `frontend/js/`, `frontend/pages/` — legacy pre-React prototype (plain HTML/JS), tracked but dead; eslint ignores `js`/`pages`. The real app lives in `frontend/src/`.

## File structure
```
frontend/src/                    # React SPA (entry: main.jsx → App.jsx → routes.jsx; LazyRoutes.jsx wraps pages)
├── api/index.js                 # fetch wrappers (Auth, Customers, Loans, System) + API base logic
├── hooks/                       # React Query hooks: useCustomers(.js), useLoans.js, useDarkMode.js
├── context/                     # AuthContext.jsx, ToastContext.jsx
├── components/
│   ├── ui/                      # UI kit (Select, CustomerSelect, Input, Button, Modal, Card, Table, ...)
│   ├── forms/                   # Add-loan wizard steps (CustomerStep, GuarantorStep, VehicleDetailsStep, ChequesStep)
│   ├── loan/                    # Loan detail pieces (InstallmentTable, PaymentModal, CloseLoanModal, RestructureModal, ...)
│   ├── pending/                 # PendingDuesTable, PendingFilters
│   └── layout/ + charts/        # Header/Sidebar/Layout; dashboard & report charts
├── pages/                       # One file per route (Customers, AddClient, CustomerDetail, LoanDetail, PendingDues, Report, ...)
└── utils/ + styles/             # excelExport.js; globals.css

backend/                         # Express API (entry: server.js)
├── routes/                      # auth, customers, loans, files, admin, system
├── models/                      # Customer.js, Loan.js, User.js (Mongoose)
├── config/                      # db.js (Atlas fallback + auto-seed), pcloud.js
├── middleware/                  # auth.js, fileProxy.js
├── utils/                       # pagination.js, loanCalculations.js, pcloud.js
├── scripts/                     # one-off DB scripts (migrations, imports, cleanup)
└── public/                      # stale committed build snapshot (do not edit)

docs/LOAN_TEMPLATE.md            # authoritative schema + loan rules
.github/workflows/deploy.yml     # frontend build → GitHub Pages
```

## Commands
- Frontend: `npm run dev` (Vite on `127.0.0.1:5173`, proxies `/api` → `localhost:5000`), `npm run lint` (eslint with `--max-warnings 0`), `npm run build` (→ `frontend/dist`).
- Backend: `npm run dev` (nodemon) / `npm start`, port 5000.
- **No test framework/suite exists.** The only verification gate is a clean `npm run lint` in `frontend/`. Always run it after edits.
- Scratch scripts are one-off and not part of any gate: `frontend/test-prod.cjs` + `frontend/test-ui.cjs` (puppeteer smoke checks — `puppeteer` is **not** in `package.json`, they only run if installed manually), and `backend/seed.js`, `backend/seed-api.js`, `backend/check_customer_loans.js`, `backend/find_orphaned_loans.js`.

## Environment / wiring quirks
- `frontend/src/api/index.js getApiBase()`: when hostname is `localhost`/`127.0.0.1` it uses `/api` (Vite proxy → local backend); on any other origin it uses `VITE_API_URL` + `/api`. So local dev always requires a running local backend; `.env.production`'s Render URL only applies on the deployed origin.
- Router is **HashRouter** with Vite `base: '/FWA/'` (`frontend/vite.config.js`) — URLs look like `#/customers`. `apiRequest` wipes `localStorage.token` and redirects to `${BASE_URL}#/login` (i.e. `/FWA/#/login`) on 401.
- Backend CORS allows only `https://backup-alt.github.io`, `http://localhost:5173`, `http://127.0.0.1:5173`.
- `backend/config/db.js`: hardcodes public DNS servers (8.8.8.8/1.1.1.1) for Windows→Atlas SRV issues, falls back to a hardcoded Atlas URI when `MONGODB_URI` looks wrong, and auto-seeds `owner/owner123` if the users collection is empty.
- `frontend/src/main.jsx` fires a silent warm-up ping to `VITE_API_URL` on non-local production loads (Render free tier cold start).

## API conventions
- List endpoints (`/api/customers`, `/api/loans`) support `page` + `pageSize` (default 25, max 200) and return `{ data, page, pageSize, total, totalPages, hasMore }` (`backend/utils/pagination.js`).
- `/api/customers` GET: bare `?search=` matches name/fileId/phone; or `search`+`searchType` ∈ `name|fileId|phone|regNo`.
- A customer's file number field is `fileId` (often an empty string — handle gracefully). Loans list/report backfill `fileId` from the Customer doc when the loan's own `fileId` is empty (`backend/routes/loans.js`).
- `apiRequest` always sets `Content-Type: application/json` and JSON-stringifies the body — no FormData/multipart on the frontend. Profile photos and loan documents are sent as base64 JSON and proxied to pCloud server-side (`backend/utils/pcloud.js`); `express.json({ limit: '10mb' })` in `server.js` caps payloads.

## Frontend conventions
- `@/` alias → `frontend/src`. All server state goes through React Query (global defaults in `main.jsx`: 5-min staleTime, retry 2, no refetch on window focus).
- API calls live in `src/api/index.js`; data hooks in `src/hooks`; UI kit in `src/components/ui` (Tailwind + `clsx`, with `dark:` variants everywhere — match existing components rather than restyling).
- Infinite pagination pattern: `useInfiniteCustomers` (`src/hooks/useCustomers.js`) + `IntersectionObserver` sentinel + `pages.flatMap(p => p.data)` — see `src/pages/CustomersPage.jsx`.
- Mutations must invalidate both `['customers']` and `['customers-infinite']` query keys (see hooks in `useCustomers.js`).

## Domain rules (from docs/LOAN_TEMPLATE.md — do not violate)
- `dueAmount` is fixed after creation; only a manual edit changes it. Overpayments go on the paid installment's `extraAmount`. **Never** create "phantom" installments or rebalance future `dueAmount` to absorb overpayment.
- Customer `cellNumbers` must be `[{ number: "..." }]` objects — plain-string arrays cause validation errors.
- Installment `status` is derived (Paid/Partial/Pending/Overdue/Cancelled); loan `status` is Active/Completed/Closed; `closureInfo` is required when Closed. Installment `adjustment` is legacy, always 0.

## Deploy
- `.github/workflows/deploy.yml` builds `frontend/` (Node 20) and publishes `frontend/dist` to GitHub Pages on push to `main`; it copies `index.html` → `404.html` for SPA fallback.
- `frontend/.env.production` points `VITE_API_URL` at the Render backend — keep secrets out of the repo.
