
















function calculateFlatEMI(principal, annualRatePercent, period, unit = 'Months') {
  let years;
  if (unit === 'Weeks') years = period / 52;
  else if (unit === 'Days') years = period / 365;
  else years = period / 12;

  const totalInterest = +(principal * (annualRatePercent / 100) * years).toFixed(2);
  const totalPayable = +(principal + totalInterest).toFixed(2);
  const emi = +(totalPayable / period).toFixed(2);
  return { totalInterest, totalPayable, emi };
}











function generateInstallmentSchedule({
  financeAmount,
  interestRate,
  installmentPeriod,
  installmentPeriodUnit = 'Months',
  loanStartDate,
}) {
  const { totalInterest, totalPayable, emi } = calculateFlatEMI(
    financeAmount,
    interestRate,
    installmentPeriod,
    installmentPeriodUnit
  );

  const startDate = new Date(loanStartDate);
  const installments = [];

  let runningPayable = totalPayable;

  for (let i = 1; i <= installmentPeriod; i++) {
    const dueDate = new Date(startDate);
    if (installmentPeriodUnit === 'Weeks') {
      dueDate.setDate(dueDate.getDate() + i * 7);
    } else if (installmentPeriodUnit === 'Days') {
      dueDate.setDate(dueDate.getDate() + i);
    } else {
      dueDate.setMonth(dueDate.getMonth() + i);
    }

    
    let dueAmount = emi;
    if (i === installmentPeriod) {
      const sumSoFar = +(emi * (installmentPeriod - 1)).toFixed(2);
      dueAmount = +(totalPayable - sumSoFar).toFixed(2);
    }

    installments.push({
      sNo: i,
      dueAmount,
      dueDate,
      amountReceived: 0,
      dateReceived: null,
      sign: '',
      status: 'Pending',
      adjustment: 0,
    });
  }

  return {
    installments,
    emiAmount: emi,
    interestAmount: totalInterest,
    totalPayable,
  };
}




















function recalculateSchedule(loan) {
  const installments = loan.installments;

  // Sort by sNo to ensure order
  installments.sort((a, b) => a.sNo - b.sNo);

  let carry = 0;

  for (let i = 0; i < installments.length; i++) {
    const inst = installments[i];

    // Store the carry-forward FROM previous installments onto this one
    inst.carryForward = +(carry).toFixed(2);

    const received = inst.amountReceived || 0;
    const effectiveDue = +(inst.dueAmount + inst.carryForward).toFixed(2);

    if (received >= effectiveDue && received > 0) {
      inst.status = 'Paid';
      carry = 0;
    } else if (received > 0) {
      inst.status = 'Partial';
      carry = +(effectiveDue - received).toFixed(2);
    } else {
      // No payment — carry the full effective due forward
      carry = effectiveDue;
      inst.status = new Date(inst.dueDate) < new Date() ? 'Overdue' : 'Pending';
    }
  }

  // Update loan-level totals
  loan.totalPaid = +installments
    .reduce((sum, inst) => sum + (inst.amountReceived || 0), 0)
    .toFixed(2);

  loan.outstandingPrincipal = +installments
    .reduce((sum, inst) => {
      const received = inst.amountReceived || 0;
      return sum + Math.max((inst.dueAmount || 0) - received, 0);
    }, 0)
    .toFixed(2);

  // Check if all installments are paid and no carry remains
  const allPaid = installments.every(inst => inst.status === 'Paid');
  if (allPaid && carry <= 0) {
    loan.status = 'Completed';
    loan.completedAt = loan.completedAt || new Date();
    loan.emiAmount = 0;
  } else {
    loan.status = 'Active';
    loan.completedAt = null;
    const nextPending = installments.find(
      i => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial'
    );
    loan.emiAmount = nextPending ? nextPending.dueAmount : installments[installments.length - 1]?.dueAmount || 0;
  }

  return loan;
}







function getPendingDues(loans) {
  const now = new Date();
  const pending = [];

  loans.forEach((loan) => {
    if (loan.status === 'Completed') return;

    loan.installments.forEach((inst) => {
      const isUnpaid = inst.status !== 'Paid';
      const isPastDue = new Date(inst.dueDate) < now;

      if (isUnpaid && isPastDue) {
        const daysOverdue = Math.floor(
          (now - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24)
        );
        pending.push({
          loanId: loan._id,
          customerName: loan.customerName,
          vehicleType: loan.vehicleType,
          make: loan.make,
          model: loan.model,
          regNo: loan.regNo,
          sNo: inst.sNo,
          dueAmount: inst.dueAmount,
          dueDate: inst.dueDate,
          amountReceived: inst.amountReceived,
          outstandingForThisInstallment: +(inst.dueAmount - (inst.amountReceived || 0)).toFixed(2),
          daysOverdue,
          status: inst.status,
        });
      }
    });
  });

  
  pending.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return pending;
}

module.exports = {
  calculateFlatEMI,
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
};
