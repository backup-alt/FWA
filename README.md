# Vehicle Finance Loan Management System

A data-entry web app for managing bike/car finance loans, EMI schedules, and payment tracking.

## Stack
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Auth:** JWT (username/password, hashed with bcrypt)

## MongoDB Connection

This project is configured to connect to:

```
mongodb://localhost:27017/vehicleFinanceDB
```

This is set in `backend/.env` as `MONGODB_URI`. Make sure MongoDB is running locally on the default port (27017) before starting the server. If you're using MongoDB Atlas or a remote instance instead, just replace this value with your connection string.

## Setup

```bash
cd backend
npm install
npm run dev   # or: npm start
```

The server runs on `http://localhost:5000` by default (configurable via `PORT` in `.env`) and serves both the API and the frontend.

## First-Time Setup: Create an Owner Account

There's no signup UI by design (single-owner/staff system). Create the first user via the API directly:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "owner", "password": "yourpassword", "role": "owner"}'
```

Then log in at `http://localhost:5000/pages/login.html`.

## Folder Structure

```
vehicle-finance-app/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js            # Auth users
│   │   └── Loan.js            # Client + loan + installments (embedded)
│   ├── routes/
│   │   ├── auth.js             # /api/auth/* (register, login, logout)
│   │   └── loans.js            # /api/loans/* (CRUD + payments + pending dues)
│   ├── middleware/auth.js     # JWT verification middleware
│   ├── utils/loanCalculations.js  # EMI generation + recalculation engine
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── css/style.css
    ├── js/api.js               # Fetch wrapper + formatting helpers
    └── pages/
        ├── login.html
        ├── dashboard.html       # Client list, vehicle-type tabs, pending dues
        ├── add-client.html       # New loan form (Page 116 fields)
        └── client-detail.html    # Summary cards + installment table (Page 117)
```

## Core Features

### 1. Data Hierarchy
`Vehicle Type (Bike/Car) → Client → Loan → Installments` — all stored in a single `Loan` document per client/loan (installments embedded as an array).

### 2. Auto-Generated Installment Schedule
On loan creation, given `financeAmount`, `interestRate` (annual %, flat-rate), and `installmentPeriod` (months), the system auto-generates the full EMI schedule with due dates spaced monthly from `loanStartDate`.

### 3. Dynamic Recalculation (Over/Underpayment)
When a payment is recorded for any installment:
- **Underpayment:** shortfall is added to the outstanding balance and redistributed across remaining installments (future EMIs increase).
- **Overpayment:** excess reduces the outstanding balance and is redistributed (future EMIs decrease).
- **Full settlement:** if outstanding balance hits ₹0, the loan is marked `Completed` and stays that way permanently.

This logic lives in `backend/utils/loanCalculations.js` → `recalculateSchedule()`.

### 4. Customizable Installment Period
The installment period can be edited from the client detail page at any time (while the loan is `Active`). Already-paid installments are preserved; the remaining outstanding balance is re-amortized over the new period.

### 5. Pending Dues Dashboard
The "Pending Dues" tab aggregates all overdue/unpaid installments across all active loans, sorted by days overdue, so the owner can see outstanding amounts at a glance.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Invalidate token |
| GET | `/api/loans` | List loans (`?vehicleType=Bike\|Car&status=Active\|Completed`) |
| GET | `/api/loans/pending-dues` | All overdue installments across active loans |
| GET | `/api/loans/:id` | Get one loan with full schedule |
| POST | `/api/loans` | Create new client/loan (auto-generates schedule) |
| PUT | `/api/loans/:id` | Update client/loan fields (or installment period/rate) |
| PUT | `/api/loans/:id/installments/:sNo` | Record a payment for an installment (triggers recalculation) |
| DELETE | `/api/loans/:id` | Delete a loan record |

## Notes / Next Steps
- Interest is calculated using a **flat rate** method (`Principal × Rate% × Years`), the common approach for vehicle finance. Swap the formula in `calculateFlatEMI()` if you need reducing-balance interest instead.
- All routes under `/api/loans` require a valid JWT (`Authorization: Bearer <token>`).
- For production, set a strong `JWT_SECRET` in `.env` and consider restricting `/api/auth/register`.

# Field Reference — Loan Ledger Tables

This document lists every field captured from the original paper ledger, organized into **Table 1** (client/vehicle/loan record) and **Table 2** (EMI repayment tracker). Use this as the source of truth for form fields, schema fields, and table columns when building or extending the UI.

---

## Table 1 — Client / Vehicle / Loan Record

This is the primary data-entry record created when a new loan is opened. One record per client per loan.

| Field | Type | Description |
|---|---|---|
| **Vehicle Type** | Select (Bike / Car) | Top-level category the loan falls under. Determines which dashboard tab/section the record appears in. |
| **MAKE** | Text | Vehicle brand/manufacturer (e.g. Honda, Maruti). |
| **MODEL** | Text | Vehicle model name (e.g. Activa, Swift). |
| **REG. No** | Text | Vehicle registration number (license plate). |
| **L. AMT (Loan Amount)** | Number (currency) | The total loan amount sanctioned/quoted to the customer. |
| **F. AMT (Finance Amount)** | Number (currency) | The actual principal amount financed — used as the base for EMI/interest calculations. |
| **R.C (RC Status / Payment Note)** | Composite | RC Book handling status and payment details. Sub-fields: |
| &nbsp;&nbsp;↳ RC Status / Note | Text | Free-text status, e.g. "Amount paid through cheque." |
| &nbsp;&nbsp;↳ Paid Through (Payee Name) | Text | Name of the party the RC payment was made to (e.g. "RAM AUTO CONSULTING"). |
| &nbsp;&nbsp;↳ Cheque Number | Text | Cheque number used for the RC payment. |
| &nbsp;&nbsp;↳ Amount | Number (currency) | Amount paid via this cheque for RC processing. |
| **NOC** | Text | No Objection Certificate status/notes (e.g. obtained, pending, not required). |
| **INS (Insurance)** | Text | Insurance details/status (policy info, validity, or pending notes). |
| **ID** | Text | Customer ID proof reference/status (e.g. Aadhar submitted, copy on file). |
| **KEY** | Text | Vehicle key handover status (e.g. "Handed over," "Spare key pending"). |
| **SALES DONE BY** | Text | Name of the sales agent who closed this deal. |
| **NAME (Customer Name)** | Text | Full name of the customer/borrower. |
| **ADDRESS** | Text (multi-line) | Customer's residential address. |
| **CELL (Phone Numbers)** | Repeatable: Number + Label | One or more contact numbers. Each entry has: |
| &nbsp;&nbsp;↳ Number | Text/Phone | Phone number. |
| &nbsp;&nbsp;↳ Label | Text | Optional label identifying whose number it is (e.g. "Self," "Amma Shanthi"). |
| **Guarantor** | Composite | Details of the loan guarantor. Sub-fields: |
| &nbsp;&nbsp;↳ Guarantor Name | Text | Full name of the guarantor. |
| &nbsp;&nbsp;↳ Guarantor Address | Text (multi-line) | Guarantor's address. |
| **Cheques Received** | Repeatable: Number + Bank + Amount | One or more cheques received from the customer (e.g. for down payment, RC, advance). Each entry has: |
| &nbsp;&nbsp;↳ Cheque Number | Text | The cheque's number. |
| &nbsp;&nbsp;↳ Bank | Text | Issuing bank name (e.g. "AMB Bank"). |
| &nbsp;&nbsp;↳ Amount | Number (currency) | Amount on the cheque. |

### Auto-Generated / System Fields (not entered manually, but related to Table 1)

| Field | Type | Description |
|---|---|---|
| **Loan Start Date** | Date | The date the loan begins; used as the anchor for generating the installment schedule. |
| **Interest Rate** | Number (%) | Annual interest rate applied (flat-rate method) to compute total interest and EMI. |
| **Installment Period** | Number (months) | Total number of EMI installments. User-customizable; can be edited later, which re-amortizes the remaining balance. |
| **Interest Amount** | Number (currency, calculated) | Total interest payable over the loan term, derived from Finance Amount × Rate × Years. |
| **EMI Amount** | Number (currency, calculated) | The current monthly due amount. Recalculates dynamically as payments are made. |
| **Outstanding Principal** | Number (currency, calculated) | Remaining balance owed at any point in time. |
| **Total Paid** | Number (currency, calculated) | Cumulative sum of all amounts received across all installments. |
| **Status** | Select (Active / Completed) | Whether the loan is still being repaid or fully settled. Once "Completed," this is permanent. |

---

## Table 2 — EMI Repayment Tracker

This is the installment schedule attached to each Table 1 record. One row per scheduled payment, auto-generated when the loan is created, then updated as payments come in.

| Field | Type | Description |
|---|---|---|
| **S. No** | Number | Serial number of the installment (1, 2, 3, ... up to the Installment Period). Sequential and immutable once set. |
| **Due Amount** | Number (currency) | The EMI amount due for this installment. Initially set by the auto-generated schedule; can shift on later installments if earlier payments were over/under the due amount (redistribution). |
| **Due Date** | Date | The date this installment is due. Spaced monthly from the Loan Start Date. |
| **Amount Received** | Number (currency) | The actual amount paid by the customer for this installment. Defaults to 0 until a payment is recorded. |
| **Date of Received** | Date | The date the payment was actually received/collected. |
| **Sign (Collector)** | Text | Name or signature of the person who collected the payment (the field staff/agent). |
| **Status** | Select (Pending / Partial / Paid / Overdue, calculated) | Current state of this installment: |
| &nbsp;&nbsp;↳ Pending | — | Not yet due, or due date hasn't passed and nothing received yet. |
| &nbsp;&nbsp;↳ Overdue | — | Due date has passed and the installment is not fully paid. |
| &nbsp;&nbsp;↳ Partial | — | Some amount received, but less than the Due Amount. |
| &nbsp;&nbsp;↳ Paid | — | Amount Received ≥ Due Amount. |
| **Adjustment** | Number (currency, calculated, signed) | The amount by which this installment's Due Amount was shifted due to a previous over/underpayment redistribution. Positive = extra owed (previous shortfall pushed forward); negative = credit (previous overpayment reduced this due amount). Shown for transparency, not directly editable. |

---

## Notes for the Building Agent

- **Table 1** is created once per loan (via the "Add Client" form) and edited occasionally (e.g. updating RC status, KEY handover, or the Installment Period).
- **Table 2** is generated automatically when Table 1 is saved, based on Finance Amount, Interest Rate, Installment Period, and Loan Start Date. It is then updated row-by-row as payments come in.
- Editing **Amount Received** on any row in Table 2 triggers recalculation of all *subsequent* rows' **Due Amount** and **Adjustment** values, and updates the Table 1 **Outstanding Principal**, **Total Paid**, **EMI Amount**, and possibly **Status** (if the loan becomes fully paid).
- All currency fields should be displayed in ₹ (INR) with Indian-style thousands separators (e.g. ₹1,00,000).
- All date fields should accept and display in a consistent format (e.g. DD MMM YYYY for display, ISO `YYYY-MM-DD` for inputs/storage).