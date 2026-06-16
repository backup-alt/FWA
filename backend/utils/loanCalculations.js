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

function restoreBaseDue(inst) {
  if (Number(inst.adjustment || 0) !== 0) {
    inst.dueAmount = roundMoney((inst.dueAmount || 0) - (inst.adjustment || 0));
  }
  inst.adjustment = 0;
}

function markOpenStatus(inst, now = new Date()) {
  inst.status = new Date(inst.dueDate) < now ? 'Overdue' : 'Pending';
}

function recalculateSchedule(loan) {
  const installments = (loan.installments || []).sort((a, b) => a.sNo - b.sNo);
  const now = new Date();

  installments.forEach((inst) => {
    restoreBaseDue(inst);
    inst.pendingAmount = 0;
    inst.shortfallAmount = 0;
    inst.extraAmount = 0;
  });

  let carry = 0; // positive = pending amount, negative = credit
  let carriedDisplayPlaced = false;

  installments.forEach((inst) => {
    const dueAmount = roundMoney(inst.dueAmount);
    const received = roundMoney(inst.amountReceived);
    const acted = hasInstallmentActivity(inst);

    if (acted) {
      const requiredAmount = roundMoney(dueAmount + Math.max(carry, 0) - Math.max(-carry, 0));
      const nextCarry = roundMoney(Math.max(requiredAmount, 0) - received);
      const credit = roundMoney(received - Math.max(requiredAmount, 0));

      inst.shortfallAmount = received < dueAmount && nextCarry > 0 ? nextCarry : 0;
      inst.extraAmount = credit > 0 ? credit : 0;

      if (received <= 0) {
        markOpenStatus(inst, now);
      } else if (received >= requiredAmount) {
        inst.status = 'Paid';
      } else {
        inst.status = 'Partial';
      }

      carry = nextCarry > 0 ? nextCarry : credit > 0 ? -credit : 0;
      carriedDisplayPlaced = false;
      return;
    }

    if (carry > 0 && !carriedDisplayPlaced) {
      inst.pendingAmount = carry;
      carriedDisplayPlaced = true;
    } else if (carry < 0 && !carriedDisplayPlaced) {
      inst.extraAmount = Math.abs(carry);
      carriedDisplayPlaced = true;
    }

    markOpenStatus(inst, now);
  });

  if (carry > 0 && !carriedDisplayPlaced && installments.length > 0) {
    installments[installments.length - 1].pendingAmount = carry;
  } else if (carry < 0 && !carriedDisplayPlaced && installments.length > 0) {
    installments[installments.length - 1].extraAmount = Math.abs(carry);
  }

  loan.totalPaid = roundMoney(
    installments.reduce((sum, inst) => sum + Number(inst.amountReceived || 0), 0)
  );

  const scheduledTotal = roundMoney(
    installments.reduce((sum, inst) => sum + Number(inst.dueAmount || 0), 0)
  );

  loan.outstandingPrincipal = Math.max(roundMoney(scheduledTotal - loan.totalPaid), 0);

  const nextOpen = installments.find((inst) => inst.status !== 'Paid' || Number(inst.pendingAmount || 0) > 0);
  loan.emiAmount = nextOpen ? roundMoney(nextOpen.dueAmount) : 0;

  const hasPendingCarry = installments.some((inst) => Number(inst.pendingAmount || 0) > 0 || Number(inst.shortfallAmount || 0) > 0);
  if (loan.outstandingPrincipal <= 0 && !hasPendingCarry) {
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
