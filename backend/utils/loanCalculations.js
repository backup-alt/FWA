/**
 * loanCalculations.js
 * Core business logic for EMI generation and dynamic recalculation
 * based on over/underpayments.
 */

/**
 * Calculate EMI using flat-rate interest (common for vehicle finance in India).
 * Total Interest = Principal * Rate(%) * Time(years)
 * Total Payable = Principal + Total Interest
 * EMI = Total Payable / Number of Installments
 *
 * @param {number} principal - financeAmount
 * @param {number} annualRatePercent - e.g. 12 for 12%
 * @param {number} periodMonths - installmentPeriod
 * @returns {{ totalInterest: number, totalPayable: number, emi: number }}
 */
function calculateFlatEMI(principal, annualRatePercent, periodMonths) {
  const years = periodMonths / 12;
  const totalInterest = +(principal * (annualRatePercent / 100) * years).toFixed(2);
  const totalPayable = +(principal + totalInterest).toFixed(2);
  const emi = +(totalPayable / periodMonths).toFixed(2);
  return { totalInterest, totalPayable, emi };
}

/**
 * Generate the initial installment schedule for a new loan.
 *
 * @param {Object} params
 * @param {number} params.financeAmount
 * @param {number} params.interestRate - annual %
 * @param {number} params.installmentPeriod - months
 * @param {Date|string} params.loanStartDate
 * @returns {{ installments: Array, emiAmount: number, interestAmount: number, totalPayable: number }}
 */
function generateInstallmentSchedule({
  financeAmount,
  interestRate,
  installmentPeriod,
  loanStartDate,
}) {
  const { totalInterest, totalPayable, emi } = calculateFlatEMI(
    financeAmount,
    interestRate,
    installmentPeriod
  );

  const startDate = new Date(loanStartDate);
  const installments = [];

  let runningPayable = totalPayable;

  for (let i = 1; i <= installmentPeriod; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    // Last installment absorbs any rounding remainder
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

/**
 * Recalculate the remaining installment schedule after a payment is recorded.
 *
 * Logic:
 * 1. Mark the current installment as Paid/Partial based on amountReceived vs dueAmount.
 * 2. Compute the difference (amountReceived - dueAmount):
 *    - If positive (overpayment): reduce the remaining outstanding balance,
 *      then redistribute the new outstanding balance evenly across the
 *      remaining installments (lowering future EMIs).
 *    - If negative (underpayment): the shortfall is added to the outstanding
 *      balance, then redistributed across the remaining installments
 *      (raising future EMIs).
 * 3. If outstanding balance <= 0 after this payment, mark loan as Completed
 *    and zero out all remaining future installments.
 *
 * @param {Object} loan - Mongoose Loan document (will be mutated, not saved)
 * @param {number} paidSNo - the sNo of the installment that was just updated
 * @returns {Object} loan (mutated)
 */
function recalculateSchedule(loan, paidSNo) {
  const installments = loan.installments;
  const idx = installments.findIndex((i) => i.sNo === paidSNo);
  if (idx === -1) {
    throw new Error(`Installment with sNo ${paidSNo} not found`);
  }

  const current = installments[idx];
  const dueAmount = current.dueAmount;
  const received = current.amountReceived || 0;
  const diff = +(received - dueAmount).toFixed(2); // + = overpaid, - = underpaid

  // Update current installment status
  if (received <= 0) {
    current.status = 'Pending';
  } else if (received < dueAmount) {
    current.status = 'Partial';
  } else {
    current.status = 'Paid';
  }

  // --- Recompute total outstanding principal across the whole loan ---
  // Sum of all dueAmounts for installments after this one, BEFORE adjustment
  const remainingInstallments = installments.slice(idx + 1);

  // Current outstanding = sum of remaining scheduled dues - overpayment + underpayment shortfall
  const currentRemainingTotal = remainingInstallments.reduce(
    (sum, inst) => sum + inst.dueAmount,
    0
  );

  // New outstanding balance to be spread across remaining installments
  const newOutstanding = +(currentRemainingTotal - diff).toFixed(2);

  loan.outstandingPrincipal = Math.max(newOutstanding, 0);
  loan.totalPaid = +installments
    .reduce((sum, inst) => sum + (inst.amountReceived || 0), 0)
    .toFixed(2);

  // --- Loan fully settled ---
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

  // --- No remaining installments (this was the last one) but not fully paid ---
  if (remainingInstallments.length === 0) {
    if (newOutstanding > 0) {
      // Shortfall on the final installment - extend or flag for owner attention.
      // Here we simply record it as an adjustment on the last installment
      // for visibility; owner can add a new installment manually if needed.
      current.adjustment = +(diff).toFixed(2);
      current.status = 'Partial';
    } else {
      loan.status = 'Completed';
      loan.completedAt = new Date();
      loan.emiAmount = 0;
    }
    return loan;
  }

  // --- Redistribute newOutstanding evenly across remaining installments ---
  const count = remainingInstallments.length;
  const baseShare = +(newOutstanding / count).toFixed(2);
  let runningTotal = 0;

  remainingInstallments.forEach((inst, i) => {
    let share = baseShare;
    // Last remaining installment absorbs rounding remainder
    if (i === count - 1) {
      share = +(newOutstanding - runningTotal).toFixed(2);
    }
    inst.adjustment = +(share - inst.dueAmount).toFixed(2);
    inst.dueAmount = share;
    runningTotal = +(runningTotal + share).toFixed(2);

    // Mark overdue if due date passed and not paid
    if (inst.status === 'Pending' && new Date(inst.dueDate) < new Date()) {
      inst.status = 'Overdue';
    }
  });

  // Update the loan's "current" EMI to reflect the next pending installment's due amount
  const nextPending = installments.find(
    (i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial'
  );
  loan.emiAmount = nextPending ? nextPending.dueAmount : 0;

  return loan;
}

/**
 * Get all pending/overdue dues across a list of loans (for owner dashboard).
 *
 * @param {Array} loans - array of Loan documents
 * @returns {Array} flattened list of overdue installments with client context
 */
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

  // Sort by most overdue first
  pending.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return pending;
}

module.exports = {
  calculateFlatEMI,
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
};
