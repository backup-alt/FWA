const mongoose = require('mongoose');


const installmentSchema = new mongoose.Schema(
  {
    sNo: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amountReceived: { type: Number, default: 0 },
    dateReceived: { type: Date, default: null },
    sign: { type: String, default: '' },
    paymentType: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other', ''],
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled'],
      default: 'Pending',
    },

    adjustment: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    shortfallAmount: { type: Number, default: 0 },
    extraAmount: { type: Number, default: 0 },
  },
  { _id: false }
);



const chequeSchema = new mongoose.Schema(
  {
    chequeNumber: { type: String, required: true },
    bank: { type: String, default: '' },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // mime type
    fileId: { type: String, default: '' }, // pcloud file id
    url: { type: String, default: '' }, // public URL for direct access
    uploadedAt: { type: Date, default: Date.now },
  }
);


const loanSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    // Keep customerName for backward compat & quick access
    customerName: { type: String, default: '' },

    vehicleType: {
      type: String,
      enum: ['Bike', 'Car', 'Auto'],
      required: true,
    },
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    regNo: { type: String, default: '' },

    loanAccountNumber: { type: String, default: '' },

    loanAmount: { type: Number, required: true },
    financeAmount: { type: Number, required: true },


    rcDetails: {
      status: { type: String, default: '' },
      paidThrough: { type: String, default: '' },
      chequeNumber: { type: String, default: '' },
      amount: { type: Number, default: 0 },
    },

    noc: { type: String, default: '' },
    insurance: { type: String, default: '' },
    idProofType: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
    keyStatus: { type: String, default: '' },
    salesDoneBy: { type: String, default: '' },

    // Legacy customer fields (kept for backward compat, new loans use Customer model)
    address: { type: String, default: '' },
    monthlySalary: { type: Number, default: 0 },
    cellNumbers: [
      {
        number: { type: String, required: true },
      },
    ],
    guarantor: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    chequesReceived: [chequeSchema],


    loanStartDate: { type: Date, required: true },
    installmentPeriod: { type: Number, required: true },
    installmentPeriodUnit: {
      type: String,
      enum: ['Months', 'Weeks', 'Days'],
      default: 'Months',
    },
    interestRate: { type: Number, required: true },
    interestAmount: { type: Number, default: 0 },
    emiAmount: { type: Number, default: 0 },


    installments: [installmentSchema],
    documents: [documentSchema],
    outstandingPrincipal: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },


    status: {
      type: String,
      enum: ['Active', 'Completed', 'Closed'],
      default: 'Active',
    },
    completedAt: { type: Date, default: null },

    // Loan Closure
    closureInfo: {
      reason: { type: String, default: '' }, // Full Prepayment | Foreclosure | Write-off | Settlement | Waiver
      remarks: { type: String, default: '' },
      amountReceived: { type: Number, default: 0 },
      closureDate: { type: Date, default: null },
    },

    // Restructure history log
    restructureLog: [
      {
        date: { type: Date, default: Date.now },
        mode: { type: String, enum: ['lower-emi', 'shorten-period'] },
        targetValue: { type: Number, default: 0 },
        lumpSumApplied: { type: Number, default: 0 },
        oldOutstanding: { type: Number, default: 0 },
        newOutstanding: { type: Number, default: 0 },
        oldPeriod: { type: Number, default: 0 },
        newPeriod: { type: Number, default: 0 },
        oldEmi: { type: Number, default: 0 },
        newEmi: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
