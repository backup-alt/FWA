const mongoose = require('mongoose');


const installmentSchema = new mongoose.Schema(
  {
    sNo: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amountReceived: { type: Number, default: 0 },
    dateReceived: { type: Date, default: null },
    sign: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Partial', 'Overdue'],
      default: 'Pending',
    },


    adjustment: { type: Number, default: 0 },
    carryForward: { type: Number, default: 0 },
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




const loanSchema = new mongoose.Schema(
  {

    vehicleType: {
      type: String,
      enum: ['Bike', 'Car'],
      required: true,
    },
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    regNo: { type: String, default: '' },


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


    customerName: { type: String, required: true },
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
    outstandingPrincipal: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },


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
