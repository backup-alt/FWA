/**
 * Seed script: creates 8 demo customers with 1-2 loans each.
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
    name: 'Rajesh Kumar',
    address: '12, MG Road, Coimbatore, Tamil Nadu 641001',
    monthlySalary: 35000,
    cellNumbers: [{ number: '9876543210' }],
    guarantor: { name: 'Suresh Kumar', address: '14, MG Road, Coimbatore' },
    idProofType: 'Aadhaar',
    idProofNumber: '1234 5678 9012',
    loans: [
      { vehicleType: 'Car', make: 'Maruti', model: 'Swift', regNo: 'TN-38-AB-1234', loanAmount: 500000, financeAmount: 400000, interestRate: 12, installmentPeriod: 12, salesDoneBy: 'Arun' },
      { vehicleType: 'Bike', make: 'Honda', model: 'Activa 6G', regNo: 'TN-38-CD-5678', loanAmount: 85000, financeAmount: 70000, interestRate: 10, installmentPeriod: 10, salesDoneBy: 'Arun' },
    ],
  },
  {
    name: 'Priya Sharma',
    address: '45, Anna Nagar, Chennai, Tamil Nadu 600040',
    monthlySalary: 50000,
    cellNumbers: [{ number: '9988776655' }],
    guarantor: { name: 'Vikram Sharma', address: '47, Anna Nagar, Chennai' },
    idProofType: 'PAN',
    idProofNumber: 'ABCPS1234K',
    loans: [
      { vehicleType: 'Car', make: 'Hyundai', model: 'i20', regNo: 'TN-09-EF-9012', loanAmount: 800000, financeAmount: 650000, interestRate: 11, installmentPeriod: 24, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'Mohammed Irfan',
    address: '78, Kamarajar Salai, Madurai, Tamil Nadu 625001',
    monthlySalary: 28000,
    cellNumbers: [{ number: '9123456789' }, { number: '9234567890' }],
    guarantor: { name: 'Ali Khan', address: '80, Kamarajar Salai, Madurai' },
    idProofType: 'Aadhaar',
    idProofNumber: '9876 5432 1098',
    loans: [
      { vehicleType: 'Bike', make: 'TVS', model: 'Apache RTR 160', regNo: 'TN-58-GH-3456', loanAmount: 130000, financeAmount: 110000, interestRate: 10, installmentPeriod: 12, salesDoneBy: 'Arun' },
      { vehicleType: 'Bike', make: 'Royal Enfield', model: 'Classic 350', regNo: 'TN-58-IJ-7890', loanAmount: 210000, financeAmount: 180000, interestRate: 11, installmentPeriod: 18, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'Lakshmi Devi',
    address: '23, Gandhi Nagar, Trichy, Tamil Nadu 620018',
    monthlySalary: 22000,
    cellNumbers: [{ number: '9345678901' }],
    guarantor: { name: 'Murugan S', address: '25, Gandhi Nagar, Trichy' },
    idProofType: 'Voter ID',
    idProofNumber: 'XYZ1234567',
    loans: [
      { vehicleType: 'Bike', make: 'Hero', model: 'Splendor Plus', regNo: 'TN-45-KL-1122', loanAmount: 75000, financeAmount: 60000, interestRate: 10, installmentPeriod: 10, salesDoneBy: 'Arun' },
    ],
  },
  {
    name: 'Aravind Swamy',
    address: '56, Race Course Road, Salem, Tamil Nadu 636007',
    monthlySalary: 60000,
    cellNumbers: [{ number: '9456789012' }],
    guarantor: { name: 'Ganesh R', address: '58, Race Course Road, Salem' },
    idProofType: 'Driving License',
    idProofNumber: 'TN-3820160012345',
    loans: [
      { vehicleType: 'Car', make: 'Tata', model: 'Nexon', regNo: 'TN-30-MN-3344', loanAmount: 1000000, financeAmount: 800000, interestRate: 12, installmentPeriod: 36, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'Deepa Menon',
    address: '91, Sarojini Street, Erode, Tamil Nadu 638001',
    monthlySalary: 30000,
    cellNumbers: [{ number: '9567890123' }],
    guarantor: { name: 'Ramesh Menon', address: '93, Sarojini Street, Erode' },
    idProofType: 'Aadhaar',
    idProofNumber: '5555 6666 7777',
    loans: [
      { vehicleType: 'Bike', make: 'Yamaha', model: 'FZ-S V3', regNo: 'TN-33-OP-5566', loanAmount: 120000, financeAmount: 100000, interestRate: 10, installmentPeriod: 12, salesDoneBy: 'Arun' },
      { vehicleType: 'Car', make: 'Renault', model: 'Kwid', regNo: 'TN-33-QR-7788', loanAmount: 450000, financeAmount: 380000, interestRate: 12, installmentPeriod: 18, salesDoneBy: 'Karthik' },
    ],
  },
  {
    name: 'Karthikeyan P',
    address: '34, Nehru Street, Tirunelveli, Tamil Nadu 627001',
    monthlySalary: 40000,
    cellNumbers: [{ number: '9678901234' }],
    guarantor: { name: 'Prakash P', address: '36, Nehru Street, Tirunelveli' },
    idProofType: 'PAN',
    idProofNumber: 'DMNPK5678L',
    loans: [
      { vehicleType: 'Car', make: 'Mahindra', model: 'XUV300', regNo: 'TN-72-ST-9900', loanAmount: 950000, financeAmount: 750000, interestRate: 11.5, installmentPeriod: 24, salesDoneBy: 'Arun' },
    ],
  },
  {
    name: 'Sangeetha Bala',
    address: '67, Temple Road, Thanjavur, Tamil Nadu 613001',
    monthlySalary: 25000,
    cellNumbers: [{ number: '9789012345' }],
    guarantor: { name: 'Bala K', address: '69, Temple Road, Thanjavur' },
    idProofType: 'Aadhaar',
    idProofNumber: '3333 4444 5555',
    loans: [
      { vehicleType: 'Bike', make: 'Bajaj', model: 'Pulsar 150', regNo: 'TN-43-UV-1234', loanAmount: 100000, financeAmount: 80000, interestRate: 10, installmentPeriod: 10, salesDoneBy: 'Karthik' },
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
        loanStartDate.setMonth(loanStartDate.getMonth() - 2); // Started 2 months ago

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
