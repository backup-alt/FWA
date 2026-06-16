
















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




















function recalculateSchedule(loan, paidSNo) {
  const installments = loan.installments;
  const idx = installments.findIndex((i) => i.sNo === paidSNo);
  if (idx === -1) {
    throw new Error(`Installment with sNo ${paidSNo} not found`);
  }

  const current = installments[idx];
  const dueAmount = current.dueAmount;
  const received = current.amountReceived || 0;
  const diff = +(received - dueAmount).toFixed(2); 

  
  if (received <= 0) {
    current.status = 'Pending';
  } else if (received < dueAmount) {
    current.status = 'Partial';
  } else {
    current.status = 'Paid';
  }

  
  
  const remainingInstallments = installments.slice(idx + 1);

  
  const currentRemainingTotal = remainingInstallments.reduce(
    (sum, inst) => sum + inst.dueAmount,
    0
  );

  
  const newOutstanding = +(currentRemainingTotal - diff).toFixed(2);

  loan.outstandingPrincipal = Math.max(newOutstanding, 0);
  loan.totalPaid = +installments
    .reduce((sum, inst) => sum + (inst.amountReceived || 0), 0)
    .toFixed(2);

  
  if (newOutstanding <= 0 && remainingInstallments.length > 0) {
    remainingInstallments.forEach((inst) => {
      inst.dueAmount = 0;
      inst.adjustment = 0;
      inst.status = 'Paid';
    });
    loan.status = 'Completed';
    loan.completedAt = new Date();
    loan.emiAmount = 0;
    return loan;
  }

  
  if (remainingInstallments.length === 0) {
    if (newOutstanding > 0) {
      
      
      
      current.adjustment = +(diff).toFixed(2);
      current.status = 'Partial';
    } else {
      loan.status = 'Completed';
      loan.completedAt = new Date();
      loan.emiAmount = 0;
    }
    return loan;
  }

  
  const count = remainingInstallments.length;
  const baseShare = +(newOutstanding / count).toFixed(2);
  let runningTotal = 0;

  remainingInstallments.forEach((inst, i) => {
    let share = baseShare;
    
    if (i === count - 1) {
      share = +(newOutstanding - runningTotal).toFixed(2);
    }
    inst.adjustment = +(share - inst.dueAmount).toFixed(2);
    inst.dueAmount = share;
    runningTotal = +(runningTotal + share).toFixed(2);

    
    if (inst.status === 'Pending' && new Date(inst.dueDate) < new Date()) {
      inst.status = 'Overdue';
    }
  });

  
  const nextPending = installments.find(
    (i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial'
  );
  loan.emiAmount = nextPending ? nextPending.dueAmount : 0;

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
