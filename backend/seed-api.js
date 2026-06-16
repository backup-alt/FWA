const fs = require('fs');

async function seedViaApi() {
  const API_URL = 'https://fwa-8gk1.onrender.com/api';
  
  // 1. Login
  console.log('Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner', password: 'owner123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const { token } = await loginRes.json();
  console.log('Login successful. Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. The 5 customers
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

  let loanAccountNumber = 1;

  for (const cData of customers) {
    const { loans: loanDefs, ...customerFields } = cData;

    console.log(`Creating customer: ${customerFields.name}...`);
    const cRes = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customerFields)
    });

    if (!cRes.ok) {
      console.error(`Failed to create customer ${customerFields.name}:`, await cRes.text());
      continue;
    }

    const customer = await cRes.json();
    console.log(`  -> Customer created: ${customer._id}`);

    for (const lDef of loanDefs) {
      console.log(`  Creating loan: ${lDef.vehicleType} ${lDef.make} ${lDef.model}...`);
      
      const loanStartDate = new Date();
      loanStartDate.setMonth(loanStartDate.getMonth() - 1); // 1 month ago
      
      const loanPayload = {
        customerId: customer._id,
        vehicleType: lDef.vehicleType,
        make: lDef.make,
        model: lDef.model,
        regNo: lDef.regNo,
        loanAccountNumber: `LA-${Date.now().toString(36).toUpperCase()}-${loanAccountNumber++}`,
        loanAmount: lDef.loanAmount,
        financeAmount: lDef.financeAmount,
        interestRate: lDef.interestRate,
        installmentPeriod: lDef.installmentPeriod,
        installmentPeriodUnit: 'Months',
        loanStartDate: loanStartDate.toISOString(),
        salesDoneBy: lDef.salesDoneBy
      };

      const lRes = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(loanPayload)
      });

      if (!lRes.ok) {
        console.error(`  -> Failed to create loan:`, await lRes.text());
        continue;
      }
      
      const loan = await lRes.json();
      console.log(`  -> Loan created: ${loan._id}`);

      // Record first payment
      if (loan.installments && loan.installments.length > 0) {
        console.log(`    Recording payment for first installment...`);
        const pRes = await fetch(`${API_URL}/loans/${loan._id}/installments/${loan.installments[0].sNo}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            amountReceived: loan.installments[0].dueAmount,
            completed: true,
            paymentType: 'Cash'
          })
        });
        if (pRes.ok) {
          console.log(`    -> Payment recorded successfully.`);
        }
      }
    }
  }

  console.log('✅ Seeding completed via API!');
}

seedViaApi().catch(console.error);
