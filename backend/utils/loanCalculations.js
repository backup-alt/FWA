function roundMoney(value) {
  return +Number(value || 0).toFixed(2);
}

function calculateFlatEMI(principal, annualRatePercent, period, unit = 'Months') {
  let years;
  if (unit === 'Weeks') years = period / 52;
  else if (unit === 'Days') years = period / 365;
  else years = period / 12;

  const totalInterest = roundMoney(principal * (annualRatePercent / 100) * years);
  const totalPayable = roundMoney(principal + totalInterest);
  const emi = roundMoney(totalPayable / period);
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
      const sumSoFar = roundMoney(emi * (installmentPeriod - 1));
      dueAmount = roundMoney(totalPayable - sumSoFar);
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
      pendingAmount: 0,
      shortfallAmount: 0,
      extraAmount: 0,
    });
  }

  return {
    installments,
    emiAmount: emi,
    interestAmount: totalInterest,
    totalPayable,
  };
}

function hasInstallmentActivity(inst) {
  return (
    Number(inst.amountReceived || 0) > 0 ||
    Boolean(inst.dateReceived) ||
    inst.status === 'Paid' ||
    inst.status === 'Partial'
  );
}

function markOpenStatus(inst, now = new Date()) {
  inst.status = new Date(inst.dueDate) < now ? 'Overdue' : 'Pending';
}

function recalculateSchedule(loan) {
  const installments = (loan.installments || []).sort((a, b) => a.sNo - b.sNo);
  const now = new Date();
  const period = installments.length;
  if (period === 0) return loan;

  installments.forEach((inst) => {
    inst.adjustment = 0;
    inst.pendingAmount = 0;
    inst.shortfallAmount = 0;
    inst.extraAmount = 0;
  });

  // ── Step 2: Running carry balance ──
  // carry > 0 → customer still owes from prior shortfalls
  // carry < 0 → customer has credit from prior overpayments
  let carry = 0;
  let pendingPlaced = false;

  installments.forEach((inst) => {
    const dueAmount = roundMoney(inst.dueAmount);
    const received = roundMoney(inst.amountReceived);
    const acted = hasInstallmentActivity(inst);
    const isPastDue = new Date(inst.dueDate) < now;

    if (acted) {
      if (received <= 0) {
        // Activity marker exists but nothing received
        markOpenStatus(inst, now);
        carry = roundMoney(carry + dueAmount);
      } else {
        // Update running balance: carry += whatTheyOwe − whatTheyPaid
        carry = roundMoney(carry + dueAmount - received);

        // Status is based on whether they paid at least the base EMI
        if (received >= dueAmount) {
          inst.status = 'Paid';
        } else {
          inst.status = 'Partial';
          inst.shortfallAmount = roundMoney(dueAmount - received);
        }

        // Show credit only when overall carry is negative
        if (carry < 0) {
          inst.extraAmount = Math.abs(carry);
        }
      }
      pendingPlaced = false;
    } else {
      // Not acted on — mark Overdue or Pending by date
      markOpenStatus(inst, now);

      // Show the accumulated carry on the first unacted row
      if (!pendingPlaced) {
        if (carry > 0) {
          inst.pendingAmount = carry;
        } else if (carry < 0) {
          inst.extraAmount = Math.abs(carry);
        }
        pendingPlaced = true;
      }

      // If past due, this row's due adds to carry and we re-show on next row
      if (isPastDue) {
        carry = roundMoney(carry + dueAmount);
        pendingPlaced = false;
      }
    }
  });

  // Fallback: ensure carry is always displayed somewhere
  if (!pendingPlaced && installments.length > 0) {
    const last = installments[installments.length - 1];
    if (carry > 0) last.pendingAmount = carry;
    else if (carry < 0) last.extraAmount = Math.abs(carry);
  }

  // ── Step 3: Loan-level aggregates ──
  loan.totalPaid = roundMoney(
    installments.reduce((sum, inst) => sum + Number(inst.amountReceived || 0), 0)
  );

  const scheduledTotal = roundMoney(
    installments.reduce((sum, inst) => sum + Number(inst.dueAmount || 0), 0)
  );

  loan.outstandingPrincipal = Math.max(roundMoney(scheduledTotal - loan.totalPaid), 0);

  const nextOpen = installments.find((inst) => inst.status !== 'Paid');
  loan.emiAmount = nextOpen ? roundMoney(nextOpen.dueAmount) : 0;

  // Loan cannot close while any carry remains
  if (loan.outstandingPrincipal <= 0 && carry <= 0) {
    loan.status = 'Completed';
    loan.completedAt = loan.completedAt || new Date();
  } else {
    loan.status = 'Active';
    loan.completedAt = null;
  }

  return loan;
}

function getPendingDues(loans) {
  const now = new Date();
  const pending = [];

  loans.forEach((loan) => {
    if (loan.status === 'Completed') return;

    recalculateSchedule(loan);

    loan.installments.forEach((inst) => {
      const isPastDue = new Date(inst.dueDate) < now;
      const dueShortfall = isPastDue && inst.status !== 'Paid' && Number(inst.shortfallAmount || 0) === 0
        ? Math.max(roundMoney((inst.dueAmount || 0) - (inst.amountReceived || 0)), 0)
        : 0;
      const carriedPending = Number(inst.pendingAmount || 0);
      const outstanding = roundMoney(dueShortfall + carriedPending);

      if (outstanding > 0) {
        const daysOverdue = Math.max(
          0,
          Math.floor((now - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24))
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
          pendingAmount: carriedPending,
          shortfallAmount: Number(inst.shortfallAmount || 0),
          outstandingForThisInstallment: outstanding,
          daysOverdue,
          status: inst.status,
        });
      }
    });
  });

  pending.sort((a, b) => b.daysOverdue - a.daysOverdue || a.sNo - b.sNo);
  return pending;
}

module.exports = {
  calculateFlatEMI,
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
};
