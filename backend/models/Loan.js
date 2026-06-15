const mongoose = require('mongoose');

/**
 * Installment Record Schema (Page 117 fields)
 * Embedded inside Loan document as an array
 */
const installmentSchema = new mongoose.Schema(
  {
    sNo: { type: Number, required: true },
    dueAmount: { type: Number, required: true }, // EMI due for this period
    dueDate: { type: Date, required: true },
    amountReceived: { type: Number, default: 0 },
    dateReceived: { type: Date, default: null },
    sign: { type: String, default: '' }, // collector name/signature
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Partial', 'Overdue'],
      default: 'Pending',
    },
    // Tracks how much this installment's due was adjusted due to
    // previous over/underpayment (positive = extra owed, negative = credit)
    adjustment: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Cheque received sub-schema
 */
const chequeSchema = new mongoose.Schema(
  {
    chequeNumber: { type: String, required: true },
    bank: { type: String, default: '' },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Loan / Client Schema (Page 116 fields + auto-generated schedule)
 */
const loanSchema = new mongoose.Schema(
  {
    // --- Vehicle Info ---
    vehicleType: {
      type: String,
      enum: ['Bike', 'Car'],
      required: true,
    },
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    regNo: { type: String, default: '' },

    // --- Loan/Finance Info ---
    loanAmount: { type: Number, required: true }, // L. AMT
    financeAmount: { type: Number, required: true }, // F. AMT (principal financed)

    // RC details
    rcDetails: {
      status: { type: String, default: '' }, // e.g. "Paid through cheque"
      paidThrough: { type: String, default: '' }, // e.g. "RAM AUTO CONSULTING"
      chequeNumber: { type: String, default: '' },
      amount: { type: Number, default: 0 },
    },

    noc: { type: String, default: '' },
    insurance: { type: String, default: '' },
    idProof: { type: String, default: '' },
    keyStatus: { type: String, default: '' },
    salesDoneBy: { type: String, default: '' },

    // --- Customer Info ---
    customerName: { type: String, required: true },
    address: { type: String, default: '' },
    cellNumbers: [
      {
        number: { type: String, required: true },
        label: { type: String, default: '' }, // e.g. "Amma Shanthi"
      },
    ],
    guarantor: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    chequesReceived: [chequeSchema],

    // --- EMI / Schedule Info ---
    loanStartDate: { type: Date, required: true },
    installmentPeriod: { type: Number, required: true }, // in months, user-customizable
    interestRate: { type: Number, required: true }, // annual %, used for EMI calc
    interestAmount: { type: Number, default: 0 }, // total interest over the loan
    emiAmount: { type: Number, default: 0 }, // current EMI (recalculated dynamically)

    // --- Repayment tracking ---
    installments: [installmentSchema],
    outstandingPrincipal: { type: Number, default: 0 }, // recalculated on each payment
    totalPaid: { type: Number, default: 0 },

    // --- Status ---
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active',
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
