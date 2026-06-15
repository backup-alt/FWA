const express = require('express');
const Loan = require('../models/Loan');
const authMiddleware = require('../middleware/auth');
const {
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
} = require('../utils/loanCalculations');

const router = express.Router();

function refreshLoanTotals(loan) {
  const installments = loan.installments || [];

  loan.totalPaid = +installments
    .reduce((sum, inst) => sum + (inst.amountReceived || 0), 0)
    .toFixed(2);

  loan.outstandingPrincipal = +installments
    .reduce((sum, inst) => sum + Math.max((inst.dueAmount || 0) - (inst.amountReceived || 0), 0), 0)
    .toFixed(2);

  const nextUnpaid = installments.find((inst) => inst.status !== 'Paid');
  loan.emiAmount = nextUnpaid ? nextUnpaid.dueAmount : 0;

  if (installments.length > 0 && installments.every((inst) => inst.status === 'Paid')) {
    loan.status = 'Completed';
    loan.completedAt = loan.completedAt || new Date();
  } else {
    loan.status = 'Active';
    loan.completedAt = null;
  }
}

// All routes below require authentication
router.use(authMiddleware);

/**
 * POST /api/loans
 * Create a new client/loan record (Page 116 fields).
 * Automatically generates the installment schedule (Page 117).
 */
router.post('/', async (req, res) => {
  try {
    const {
      vehicleType,
      make,
      model,
      regNo,
      loanAmount,
      financeAmount,
      rcDetails,
      noc,
      insurance,
      idProof,
      keyStatus,
      salesDoneBy,
      customerName,
      address,
      cellNumbers,
      guarantor,
      chequesReceived,
      loanStartDate,
      installmentPeriod,
      interestRate,
    } = req.body;

    if (!vehicleType || !financeAmount || !installmentPeriod || !interestRate || !customerName || !loanStartDate) {
      return res.status(400).json({
        message:
          'vehicleType, customerName, financeAmount, installmentPeriod, interestRate, and loanStartDate are required.',
      });
    }

    const { installments, emiAmount, interestAmount } = generateInstallmentSchedule({
      financeAmount,
      interestRate,
      installmentPeriod,
      loanStartDate,
    });

    const loan = new Loan({
      vehicleType,
      make,
      model,
      regNo,
      loanAmount,
      financeAmount,
      rcDetails,
      noc,
      insurance,
      idProof,
      keyStatus,
      salesDoneBy,
      customerName,
      address,
      cellNumbers,
      guarantor,
      chequesReceived,
      loanStartDate,
      installmentPeriod,
      interestRate,
      interestAmount,
      emiAmount,
      installments,
      outstandingPrincipal: financeAmount + interestAmount,
      totalPaid: 0,
      status: 'Active',
    });

    await loan.save();
    res.status(201).json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating loan.' });
  }
});

/**
 * GET /api/loans
 * List all loans. Optional query params: ?vehicleType=Bike|Car&status=Active|Completed
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
    if (req.query.status) filter.status = req.query.status;

    const loans = await Loan.find(filter).sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loans.' });
  }
});

/**
 * GET /api/loans/pending-dues
 * Owner dashboard: list all overdue/unpaid installments across all active loans.
 * NOTE: placed before /:id to avoid route collision.
 */
router.get('/pending-dues', async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'Active' });
    const pending = getPendingDues(loans);
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching pending dues.' });
  }
});

/**
 * GET /api/loans/:id
 * Get a single loan/client with full installment schedule.
 */
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loan.' });
  }
});

/**
 * PUT /api/loans/:id
 * Update top-level client/loan fields (Page 116 details).
 * Does NOT touch the installment schedule directly - use the
 * /:id/installments/:sNo endpoint for payments.
 *
 * If installmentPeriod or interestRate is changed on an Active loan,
 * the remaining schedule is regenerated based on the current
 * outstanding principal.
 */
router.put('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const updatableFields = [
      'make',
      'model',
      'regNo',
      'loanAmount',
      'rcDetails',
      'noc',
      'insurance',
      'idProof',
      'keyStatus',
      'salesDoneBy',
      'customerName',
      'address',
      'cellNumbers',
      'guarantor',
      'chequesReceived',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        loan[field] = req.body[field];
      }
    });

    // Handle installment period / interest rate change (re-amortize remaining balance)
    const periodChanged =
      req.body.installmentPeriod !== undefined &&
      req.body.installmentPeriod !== loan.installmentPeriod;
    const rateChanged =
      req.body.interestRate !== undefined && req.body.interestRate !== loan.interestRate;

    if ((periodChanged || rateChanged) && loan.status === 'Active') {
      const newPeriod = req.body.installmentPeriod || loan.installmentPeriod;
      const newRate = req.body.interestRate || loan.interestRate;

      // Find how many installments are already fully paid
      const paidInstallments = loan.installments.filter((i) => i.status === 'Paid');
      const remainingCount = newPeriod - paidInstallments.length;

      if (remainingCount <= 0) {
        return res.status(400).json({
          message: 'New installment period must be greater than the number of already-paid installments.',
        });
      }

      const principalRemaining = loan.outstandingPrincipal;
      const lastPaidDate =
        paidInstallments.length > 0
          ? new Date(paidInstallments[paidInstallments.length - 1].dueDate)
          : new Date(loan.loanStartDate);

      const { installments: newInstallments, emiAmount } = generateInstallmentSchedule({
        financeAmount: principalRemaining,
        interestRate: newRate,
        installmentPeriod: remainingCount,
        loanStartDate: lastPaidDate,
      });

      // Re-number sNo to continue from paid installments
      newInstallments.forEach((inst, idx) => {
        inst.sNo = paidInstallments.length + idx + 1;
      });

      loan.installments = [...paidInstallments, ...newInstallments];
      loan.installmentPeriod = newPeriod;
      loan.interestRate = newRate;
      loan.emiAmount = emiAmount;
    }

    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating loan.' });
  }
});

/**
 * PUT /api/loans/:id/installments/:sNo
 * Record/update a payment for a specific installment.
 * Triggers the recalculation logic for over/underpayment.
 *
 * Body may include:
 * { sNo, dueAmount, dueDate, amountReceived, dateReceived, sign, completed }
 */
router.put('/:id/installments/:sNo', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    if (loan.status === 'Completed' && req.body.completed !== false) {
      return res.status(400).json({ message: 'This loan is already marked as Completed.' });
    }

    const sNo = parseInt(req.params.sNo, 10);
    const installment = loan.installments.find((i) => i.sNo === sNo);
    if (!installment) {
      return res.status(404).json({ message: `Installment #${sNo} not found.` });
    }

    const { amountReceived, dateReceived, sign, completed } = req.body;
    const nextSNo = req.body.sNo !== undefined ? parseInt(req.body.sNo, 10) : sNo;
    const nextDueAmount = req.body.dueAmount !== undefined ? Number(req.body.dueAmount) : undefined;

    if (!Number.isInteger(nextSNo) || nextSNo <= 0) {
      return res.status(400).json({ message: 'A valid S.No is required.' });
    }

    if (nextSNo !== sNo && loan.installments.some((i) => i.sNo === nextSNo)) {
      return res.status(400).json({ message: `Installment #${nextSNo} already exists.` });
    }

    if (nextDueAmount !== undefined && (Number.isNaN(nextDueAmount) || nextDueAmount < 0)) {
      return res.status(400).json({ message: 'A valid dueAmount is required.' });
    }

    if (amountReceived !== undefined && (Number.isNaN(Number(amountReceived)) || Number(amountReceived) < 0)) {
      return res.status(400).json({ message: 'A valid amountReceived is required.' });
    }

    if (req.body.dueDate !== undefined) {
      const parsedDueDate = new Date(req.body.dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'A valid dueDate is required.' });
      }
      installment.dueDate = parsedDueDate;
    }

    installment.sNo = nextSNo;
    if (nextDueAmount !== undefined) installment.dueAmount = nextDueAmount;
    if (amountReceived !== undefined) installment.amountReceived = Number(amountReceived);
    if (dateReceived !== undefined) {
      const parsedReceivedDate = dateReceived ? new Date(dateReceived) : null;
      if (dateReceived && Number.isNaN(parsedReceivedDate.getTime())) {
        return res.status(400).json({ message: 'A valid dateReceived is required.' });
      }
      installment.dateReceived = parsedReceivedDate;
    } else if (amountReceived !== undefined && Number(amountReceived) > 0 && !installment.dateReceived) {
      installment.dateReceived = new Date();
    }
    if (sign !== undefined) installment.sign = sign;

    loan.installments.sort((a, b) => a.sNo - b.sNo);

    if (completed !== undefined) {
      if (completed) {
        installment.amountReceived = installment.dueAmount;
        installment.dateReceived = installment.dateReceived || new Date();
        installment.status = 'Paid';
      } else {
        installment.amountReceived = 0;
        installment.dateReceived = null;
        installment.status = new Date(installment.dueDate) < new Date() ? 'Overdue' : 'Pending';
      }

      refreshLoanTotals(loan);
      await loan.save();
      return res.json(loan);
    }

    const financialFieldsChanged =
      nextSNo !== sNo ||
      nextDueAmount !== undefined ||
      amountReceived !== undefined;

    if (financialFieldsChanged) {
      // Run the recalculation engine
      recalculateSchedule(loan, nextSNo);
    } else if (installment.status !== 'Paid') {
      installment.status = new Date(installment.dueDate) < new Date() ? 'Overdue' : 'Pending';
    }

    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error recording payment.' });
  }
});

/**
 * DELETE /api/loans/:id
 * Delete a loan/client record entirely.
 */
router.delete('/:id', async (req, res) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json({ message: 'Loan deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting loan.' });
  }
});

module.exports = router;
