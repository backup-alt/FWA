/**
 * Seed script: creates 5 demo customers with 1-2 loans each.
 * Run: node backend/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Customer = require('./models/Customer');
const Loan = require('./models/Loan');
const { generateInstallmentSchedule, recalculateSchedule } = require('./utils/loanCalculations');

const customers = [
  {
    name: 'Arjun Kumar',
    address: '42, Cross Cut Road, Coimbatore',
    monthlySalary: 25000,
    cellNumbers: [{ number: '9876543210' }],
    guarantor: { name: 'Suresh Kumar', address: '44, Cross Cut Road, Coimbatore' },
    idProofType: 'Aadhaar',
    idProofNumber: '9999 8888 7777',
    loans: [
      { vehicleType: 'Bike', make: 'Honda', model: 'Activa 6G', regNo: 'TN-38-BZ-1001', loanAmount: 85000, financeAmount: 70000, interestRate: 10, installmentPeriod: 12, salesDoneBy: 'Ravi' },
    ],
  },
  {
    name: 'Meera Krishnan',
    address: '108, Race Course, Coimbatore',
    monthlySalary: 85000,
    cellNumbers: [{ number: '9123456789' }],
    guarantor: { name: 'Krishnan V', address: '108, Race Course, Coimbatore' },
    idProofType: 'PAN',
    idProofNumber: 'ABCDM1234K',
    loans: [
      { vehicleType: 'Car', make: 'Tata', model: 'Safari', regNo: 'TN-38-CQ-5555', loanAmount: 1800000, financeAmount: 1500000, interestRate: 11.5, installmentPeriod: 36, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'S. Karthik',
    address: '15, RS Puram, Coimbatore',
    monthlySalary: 45000,
    cellNumbers: [{ number: '9988776655' }],
    guarantor: { name: 'Srinivasan', address: '17, RS Puram, Coimbatore' },
    idProofType: 'Driving License',
    idProofNumber: 'TN-38202000123',
    loans: [
      { vehicleType: 'Car', make: 'Maruti', model: 'Swift', regNo: 'TN-38-DF-2022', loanAmount: 600000, financeAmount: 450000, interestRate: 12, installmentPeriod: 24, salesDoneBy: 'Ravi' },
      { vehicleType: 'Bike', make: 'Royal Enfield', model: 'Classic 350', regNo: 'TN-38-EF-9090', loanAmount: 220000, financeAmount: 180000, interestRate: 11, installmentPeriod: 18, salesDoneBy: 'Ravi' },
    ],
  },
  {
    name: 'Ramesh Transports',
    address: '55, Pollachi Main Road, Coimbatore',
    monthlySalary: 60000,
    cellNumbers: [{ number: '9444455555' }],
    guarantor: { name: 'Rajesh', address: '57, Pollachi Main Road, Coimbatore' },
    idProofType: 'Aadhaar',
    idProofNumber: '1111 2222 3333',
    loans: [
      { vehicleType: 'Car', make: 'Mahindra', model: 'Bolero', regNo: 'TN-41-AA-7777', loanAmount: 950000, financeAmount: 800000, interestRate: 12.5, installmentPeriod: 36, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'Divya S.',
    address: '7, Vadavalli, Coimbatore',
    monthlySalary: 18000,
    cellNumbers: [{ number: '9666677777' }],
    guarantor: { name: 'Selvam', address: '9, Vadavalli, Coimbatore' },
    idProofType: 'Voter ID',
    idProofNumber: 'XYZ9876543',
    loans: [
      { vehicleType: 'Bike', make: 'TVS', model: 'Jupiter', regNo: 'TN-38-GH-1234', loanAmount: 75000, financeAmount: 50000, interestRate: 10, installmentPeriod: 6, salesDoneBy: 'Ravi' },
    ],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clean existing data
    await Customer.deleteMany({});
    await Loan.deleteMany({});
    console.log('Cleared existing customers and loans');

    let customerCount = 0;
    let loanCount = 0;

    for (const cData of customers) {
      const { loans: loanDefs, ...customerFields } = cData;

      const customer = await Customer.create(customerFields);
      customerCount++;

      for (const lDef of loanDefs) {
        const loanStartDate = new Date();
        loanStartDate.setMonth(loanStartDate.getMonth() - 1); // Started 1 month ago

        const { installments, emiAmount, interestAmount } = generateInstallmentSchedule({
          financeAmount: lDef.financeAmount,
          interestRate: lDef.interestRate,
          installmentPeriod: lDef.installmentPeriod,
          installmentPeriodUnit: 'Months',
          loanStartDate,
        });

        // Simulate first installment paid
        if (installments.length > 0) {
          installments[0].amountReceived = installments[0].dueAmount;
          installments[0].dateReceived = new Date(loanStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          installments[0].status = 'Paid';
          installments[0].paymentType = 'Cash';
        }

        const loan = new Loan({
          customerId: customer._id,
          customerName: customer.name,
          vehicleType: lDef.vehicleType,
          make: lDef.make,
          model: lDef.model,
          regNo: lDef.regNo,
          loanAccountNumber: `LA-${Date.now().toString(36).toUpperCase()}-${loanCount + 1}`,
          loanAmount: lDef.loanAmount,
          financeAmount: lDef.financeAmount,
          rcDetails: { status: 'Received', paidThrough: 'Cash' },
          noc: 'Pending',
          insurance: 'Active',
          keyStatus: 'With Customer',
          salesDoneBy: lDef.salesDoneBy || '',
          loanStartDate,
          installmentPeriod: lDef.installmentPeriod,
          installmentPeriodUnit: 'Months',
          interestRate: lDef.interestRate,
          interestAmount,
          emiAmount,
          installments,
          outstandingPrincipal: lDef.financeAmount + interestAmount,
          totalPaid: 0,
          status: 'Active',
        });

        recalculateSchedule(loan);
        await loan.save();
        loanCount++;
      }
    }

    console.log(`\n✅ Seeded ${customerCount} customers with ${loanCount} loans.`);
    console.log('Demo data is ready!\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
