# LOAN DOCUMENT SCHEMA — STRICT FORMAT

This document defines the exact MongoDB JSON structure for a **Loan** document in the Vehicle Finance App. Any AI or service that produces or modifies loan data **MUST** follow this schema exactly. Any deviation will cause display, calculation, or sync problems.

---

## 1. Top-level Loan Document

```json
{
  "_id": "<Mongo ObjectId>",
  "customerId": "<Mongo ObjectId of Customer>",
  "customerName": "John Raj",
  "vehicleType": "Bike",
  "make": "Honda",
  "model": "2011",
  "regNo": "TN74 S 5010",
  "loanAccountNumber": "LA-12345",
  "loanAmount": 15000,
  "financeAmount": 13000,
  "rcDetails": {
    "status": "Yes",
    "paidThrough": "",
    "chequeNumber": "",
    "amount": 0
  },
  "noc": "Nil",
  "insurance": "No",
  "idProofType": "",
  "idProofNumber": "",
  "keyStatus": "No",
  "salesDoneBy": "Ref -> E514, E864",
  "address": "123 Main St, City",
  "monthlySalary": 0,
  "guarantor": {
    "name": "",
    "address": ""
  },
  "loanStartDate": "2025-03-17T00:00:00.000Z",
  "installmentPeriod": 10,
  "installmentPeriodUnit": "Months",
  "interestRate": 2,
  "interestAmount": 300,
  "emiAmount": 1800,
  "installments": [ /* see Section 2 */ ],
  "outstandingPrincipal": 0,
  "totalPaid": 20000,
  "status": "Completed",
  "completedAt": "2026-05-30T00:00:00.000Z",
  "closureInfo": {
    "reason": "",
    "remarks": "",
    "amountReceived": 0,
    "closureDate": null
  },
  "cellNumbers": ["9442026327"],
  "chequesReceived": [],
  "documents": [],
  "restructureLog": [],
  "createdAt": "2025-03-17T00:00:00.000Z",
  "updatedAt": "2026-05-30T00:00:00.000Z",
  "__v": 0
}
```

---

## 2. Installment Object (inside `installments` array)

```json
{
  "sNo": 1,
  "dueAmount": 1800,
  "dueDate": "2025-03-17T00:00:00.000Z",
  "amountReceived": 2000,
  "dateReceived": "2025-04-14T00:00:00.000Z",
  "sign": "",
  "paymentType": "Cash",
  "status": "Paid",
  "adjustment": 0,
  "pendingAmount": 0,
  "shortfallAmount": 0,
  "extraAmount": 200
}
```

---

## 3. STRICT RULES — DO NOT VIOLATE

### 3.1 `dueAmount` is FIXED and IMMUTABLE except by manual user edit
- `dueAmount` is set once when the loan is created.
- The system **NEVER** modifies `dueAmount` automatically (not on overpayment, not on installment completion, not on restructuring).
- The only ways `dueAmount` can change:
  1. **Manual user edit** through the installment edit UI (pencil icon → change value → save).
  2. **Full loan recreation** (deletion + new loan).
- Overpayments are recorded in `extraAmount`, **not** by reducing future `dueAmount` values.
- Future installments' `dueAmount` values **must not** be changed because of an earlier overpayment.

### 3.2 Installment `sNo` rules
- `sNo` starts at 1 and is sequential.
- `sNo` values must be unique within a loan.
- When inserting, the new installment gets the next available `sNo`.

### 3.3 Installment `status` values (one of)
- `"Paid"` — `amountReceived >= dueAmount` (or marked complete by user).
- `"Partial"` — `amountReceived > 0` but `< dueAmount`.
- `"Pending"` — `amountReceived === 0` and `dueDate >= now`.
- `"Overdue"` — `amountReceived === 0` and `dueDate < now`.
- `"Cancelled"` — set only when the loan is **Closed** and this installment was not paid. Cancelled installments are excluded from totals and ignored for outstanding calculation.

### 3.4 Field semantics per installment
| Field | Meaning | Mutable by user? |
|---|---|---|
| `sNo` | Serial number | Yes (in edit) |
| `dueAmount` | **FIXED** amount due for this installment | **Yes (manual only)** |
| `dueDate` | Date the installment is due | Yes (in edit) |
| `amountReceived` | Amount actually paid by the customer | Yes (in edit) |
| `dateReceived` | Date payment was received | Yes (in edit) |
| `sign` | Customer signature/initials (free text) | Yes (in edit) |
| `paymentType` | `Cash`, `UPI`, `Bank Transfer`, `Cheque`, `Other`, or `""` | Yes (in edit) |
| `status` | Computed by system (Paid/Partial/Pending/Overdue/Cancelled) | No (derived) |
| `adjustment` | **Always `0`**. Do not use. Legacy field. | No |
| `pendingAmount` | Carry-over from prior shortfall (display only) | No (computed) |
| `shortfallAmount` | `dueAmount - amountReceived` if Partial (display only) | No (computed) |
| `extraAmount` | `amountReceived - dueAmount` if overpaid (display only) | No (computed) |

### 3.5 DO NOT create phantom installments
- When a customer overpays, **do not** add an extra installment to record the surplus.
- The surplus is stored as `extraAmount` on the **same installment** that was overpaid.
- `dueAmount` of the next installment stays the same.

### 3.6 Loan-level `status` values (one of)
- `"Active"` — has pending installments.
- `"Completed"` — all installments paid (status of loan is set by system; cannot be set manually except via Close Loan flow).
- `"Closed"` — loan was closed by the user via Close Loan modal. `closureInfo` must be populated.

### 3.7 `closureInfo` (only when `status === "Closed"`)
```json
{
  "reason": "Full Prepayment",
  "remarks": "Optional notes",
  "amountReceived": 13000,
  "closureDate": "2026-05-30T00:00:00.000Z"
}
```
Valid `reason` values: `Full Prepayment`, `Foreclosure`, `Write-off`, `Settlement`, `Waiver`.

### 3.8 Totals (computed by backend on every GET)
- `totalPaid` = sum of all `installments[].amountReceived` (including cancelled).
- `outstandingPrincipal` = `sum(dueAmount of non-cancelled) - totalPaid` (clamped to `>= 0`).
- `interestAmount` = `sum(dueAmount) - financeAmount` (set at loan creation; recomputed when installments are provided).
- `emiAmount` = `dueAmount` of the first non-Paid, non-Cancelled installment. If all Paid, `emiAmount = 0`.

---

## 4. Old/legacy data to be cleaned

Any installment with the following characteristics is **legacy** and should be removed/cleaned:
- `sNo` > `installmentPeriod` (e.g. an 11th installment on a 10-installment loan) → **DELETE the installment**.
- `dueAmount: 0` with `extraAmount > 0` on a non-final installment → **DELETE the installment** (this is leftover from the old redistribution logic).
- Any installment where `adjustment !== 0` → set `dueAmount = dueAmount - adjustment` and `adjustment = 0` (consolidate adjustment into dueAmount so the field becomes clean).

**Note:** The "extra overpayment" should be moved to the previous installment's `extraAmount` field if the previous installment was overpaid. If no previous overpayment, the phantom installment can be safely deleted without re-allocating.

---

## 5. What the user CANNOT do (limits)

- Cannot edit `dueAmount` of a Closed/Completed loan (loan is locked when `status === "Closed"`).
- Cannot edit installments of a loan where `status === "Closed"`.
- The system never auto-closes a loan — closure is always user-initiated via the **Close Loan** button, which is visible for `Active` and `Completed` loans.

---

## 6. API endpoints (for reference)

- `PUT /api/loans/:id/installments/:sNo` — body: `{ sNo, dueAmount, dueDate, amountReceived, dateReceived, paymentType, sign, completed }`. Updates one installment. If `dueAmount` is included, it overrides the stored value (manual edit). Backend re-runs `recalculateSchedule` and saves.
- `PUT /api/loans/:id/close` — body: `{ closureReason, closureRemarks, amountReceived, closureDate }`. Closes the loan; marks unpaid installments as Cancelled.

---

## 7. Example: clean John Raj loan (after cleanup)

```json
{
  "_id": "6a489591981e5c5dfd957486",
  "customerId": "6a4898ee39a115830c56f7e6",
  "customerName": "John Raj",
  "vehicleType": "Bike",
  "make": "Honda",
  "model": "2011",
  "regNo": "TN74 S 5010",
  "loanAccountNumber": "",
  "loanAmount": 15000,
  "financeAmount": 13000,
  "loanStartDate": "2025-03-17T00:00:00.000Z",
  "installmentPeriod": 10,
  "installmentPeriodUnit": "Months",
  "interestRate": 2,
  "interestAmount": 300,
  "emiAmount": 0,
  "status": "Completed",
  "completedAt": "2026-05-19T00:00:00.000Z",
  "installments": [
    {
      "sNo": 1, "dueAmount": 1800, "dueDate": "2025-03-17T00:00:00.000Z",
      "amountReceived": 2000, "dateReceived": "2025-04-14T00:00:00.000Z",
      "status": "Paid", "extraAmount": 200,
      "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0,
      "sign": "", "paymentType": ""
    },
    { "sNo": 2, "dueAmount": 1800, "dueDate": "2025-04-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2025-05-19T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 3, "dueAmount": 1800, "dueDate": "2025-05-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2025-06-09T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 4, "dueAmount": 1800, "dueDate": "2025-06-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2025-07-21T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 5, "dueAmount": 1800, "dueDate": "2025-07-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2025-09-08T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 6, "dueAmount": 1800, "dueDate": "2025-08-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2025-11-29T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 7, "dueAmount": 1800, "dueDate": "2025-09-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2026-01-27T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 8, "dueAmount": 1800, "dueDate": "2025-10-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2026-03-16T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 9, "dueAmount": 1800, "dueDate": "2025-11-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2026-04-25T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" },
    { "sNo": 10, "dueAmount": 1800, "dueDate": "2025-12-17T00:00:00.000Z", "amountReceived": 1800, "dateReceived": "2026-05-19T00:00:00.000Z", "status": "Paid", "extraAmount": 0, "adjustment": 0, "pendingAmount": 0, "shortfallAmount": 0, "sign": "", "paymentType": "" }
  ],
  "outstandingPrincipal": 0,
  "totalPaid": 20000,
  "closureInfo": { "reason": "", "remarks": "", "amountReceived": 0, "closureDate": null },
  "cellNumbers": ["9442026327"],
  "documents": [],
  "restructureLog": [],
  "createdAt": "2025-03-17T00:00:00.000Z",
  "updatedAt": "2026-05-30T00:00:00.000Z"
}
```

Note: the original installment #11 (`dueAmount: 0, extraAmount: 1800`) is **removed** in the cleaned version. The ₹1800 extra overpayment is informational only; the loan is treated as fully paid once the 10 regular installments are settled.

---

## 8. Summary of changes from old format

| Old behavior (legacy) | New behavior (current) |
|---|---|
| Overpayment reduces future `dueAmount` | Overpayment stored as `extraAmount` on the same installment; future `dueAmount` unchanged |
| Phantom installment created for overpayment | No phantom installment; surplus only on the installment that was overpaid |
| `dueAmount` displayed in UI = stored value - `adjustment` | `dueAmount` displayed = stored value (no adjustment) |
| `adjustment` field actively used | `adjustment` always `0`; legacy field, do not use |
| "Close Loan" button only for Active loans | "Close Loan" button visible for both Active and Completed loans |
| `dueAmount` not editable in UI | `dueAmount` editable in the installment edit row (pencil icon) |
