function roundMoney(value) {
  return +Number(value || 0).toFixed(2);
}

/**
 * Flat monthly interest formula:
 *   monthly_interest = principal × (ratePercent / 100)   — fixed every installment
 *   monthly_principal = principal / period
 *   emi = monthly_principal + monthly_interest
 *
 * ratePercent is the per-installment-period rate (e.g. 2 means 2% per month).
 * It is flat — it does NOT reduce as principal is repaid.
 */
function calculateFlatEMI(principal, ratePercent, period) {
  const monthlyInterest = roundMoney(principal * (ratePercent / 100));
  const monthlyPrincipal = roundMoney(principal / period);
  // EMI before rounding adjustment
  const emi = roundMoney(monthlyPrincipal + monthlyInterest);
  const totalInterest = roundMoney(monthlyInterest * period);
  const totalPayable = roundMoney(principal + totalInterest);
  return { monthlyInterest, monthlyPrincipal, totalInterest, totalPayable, emi };
}

function generateInstallmentSchedule({
  principal,
  financeAmount,
  interestRate,
  installmentPeriod,
  installmentPeriodUnit = 'Months',
  loanStartDate,
}) {
  const effectivePrincipal = principal ?? financeAmount;
  const { totalInterest, totalPayable, emi } = calculateFlatEMI(
    effectivePrincipal,
    interestRate,
    installmentPeriod
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

    // Last installment absorbs any rounding remainder
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
    // Skip cancelled installments — they are frozen by loan closure
    if (inst.status === 'Cancelled') return;
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

  installments.forEach((inst, idx) => {
    // Skip cancelled installments from carry logic
    if (inst.status === 'Cancelled') return;

    const effectiveDue = roundMoney(Number(inst.dueAmount || 0) - Number(inst.adjustment || 0));
    const received = roundMoney(inst.amountReceived);
    const acted = hasInstallmentActivity(inst);
    const isPastDue = new Date(inst.dueDate) < now;

    if (acted) {
      if (received <= 0) {
        markOpenStatus(inst, now);
        carry = roundMoney(carry + effectiveDue);
      } else {
        carry = roundMoney(carry + effectiveDue - received);

        if (received >= effectiveDue) {
          inst.status = 'Paid';
        } else {
          inst.status = 'Partial';
          inst.shortfallAmount = roundMoney(effectiveDue - received);
        }

        // Handle overpayment logically by adjusting future unacted installments
        if (carry < 0) {
          inst.extraAmount = Math.abs(carry);
          carry = 0;
        }
      }
      pendingPlaced = false;
    } else {
      markOpenStatus(inst, now);

      if (!pendingPlaced) {
        if (carry > 0) inst.pendingAmount = carry;
        pendingPlaced = true;
      }

      if (isPastDue) {
        carry = roundMoney(carry + effectiveDue);
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
    installments
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, inst) => sum + Number(inst.dueAmount || 0), 0)
  );

  loan.outstandingPrincipal = Math.max(roundMoney(scheduledTotal - loan.totalPaid), 0);

  const nextOpen = installments.find((inst) => inst.status !== 'Paid' && inst.status !== 'Cancelled');
  loan.emiAmount = nextOpen ? roundMoney(nextOpen.dueAmount || 0) : 0;

  // Never auto-change status of a Closed loan
  if (loan.status !== 'Closed') {
    if (loan.outstandingPrincipal <= 0 && carry <= 0) {
      loan.status = 'Completed';
      loan.completedAt = loan.completedAt || new Date();
    } else {
      loan.status = 'Active';
      loan.completedAt = null;
    }
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
      const effectiveDue = roundMoney((inst.dueAmount || 0) - (inst.adjustment || 0));
      const isPastDue = new Date(inst.dueDate) < now;
      const dueShortfall = isPastDue && inst.status !== 'Paid' && Number(inst.shortfallAmount || 0) === 0
        ? Math.max(roundMoney(effectiveDue - (inst.amountReceived || 0)), 0)
        : 0;
      const carriedPending = Number(inst.pendingAmount || 0);
      const outstanding = roundMoney(dueShortfall + carriedPending);

      const daysOverdue = Math.max(
        0,
        Math.floor((now - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24))
      );

      if (outstanding > 0 && daysOverdue > 0) {
        pending.push({
          loanId: loan._id,
          customerName: loan.customerName,
          vehicleType: loan.vehicleType,
          make: loan.make,
          model: loan.model,
          regNo: loan.regNo,
          sNo: inst.sNo,
          dueAmount: effectiveDue,
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
