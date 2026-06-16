const express = require('express');
const Loan = require('../models/Loan');
const authMiddleware = require('../middleware/auth');
const {
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
} = require('../utils/loanCalculations');

const router = express.Router();


router.use(authMiddleware);






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
      installmentPeriodUnit,
      interestRate,
    } = req.body;

    if (!vehicleType || !financeAmount || !installmentPeriod || interestRate === undefined || !customerName || !loanStartDate) {
      return res.status(400).json({
        message:
          'vehicleType, customerName, financeAmount, installmentPeriod, interestRate, and loanStartDate are required.',
      });
    }

    const { installments, emiAmount, interestAmount } = generateInstallmentSchedule({
      financeAmount,
      interestRate,
      installmentPeriod,
      installmentPeriodUnit,
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
      installmentPeriodUnit,
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





router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
    if (req.query.status) filter.status = req.query.status;

    const loans = await Loan.find(filter).sort({ createdAt: -1 });
    await Promise.all(loans.map((loan) => {
      recalculateSchedule(loan);
      return loan.save();
    }));
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loans.' });
  }
});






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





router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    recalculateSchedule(loan);
    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loan.' });
  }
});











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
      'installmentPeriodUnit',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        loan[field] = req.body[field];
      }
    });

    
    const periodChanged =
      req.body.installmentPeriod !== undefined &&
      req.body.installmentPeriod !== loan.installmentPeriod;
    const unitChanged =
      req.body.installmentPeriodUnit !== undefined &&
      req.body.installmentPeriodUnit !== loan.installmentPeriodUnit;
    const rateChanged =
      req.body.interestRate !== undefined && req.body.interestRate !== loan.interestRate;

    if ((periodChanged || unitChanged || rateChanged) && loan.status === 'Active') {
      const newPeriod = req.body.installmentPeriod || loan.installmentPeriod;
      const newUnit = req.body.installmentPeriodUnit || loan.installmentPeriodUnit || 'Months';
      const newRate = req.body.interestRate || loan.interestRate;

      const actedCount = loan.installments.filter(i => i.amountReceived > 0 || i.dateReceived || i.status === 'Paid' || i.status === 'Partial').length;
      if (newPeriod < actedCount) {
        return res.status(400).json({
          message: `New installment period must be at least the number of installments with payment activity (${actedCount}).`,
        });
      }

      const { installments: newInstallments, emiAmount, interestAmount } = generateInstallmentSchedule({
        financeAmount: loan.financeAmount,
        interestRate: newRate,
        installmentPeriod: newPeriod,
        installmentPeriodUnit: newUnit,
        loanStartDate: loan.loanStartDate,
      });

      newInstallments.forEach(newInst => {
        const oldInst = loan.installments.find(i => i.sNo === newInst.sNo);
        if (oldInst && (oldInst.amountReceived > 0 || oldInst.dateReceived || oldInst.status === 'Paid' || oldInst.status === 'Partial')) {
          newInst.amountReceived = oldInst.amountReceived;
          newInst.dateReceived = oldInst.dateReceived;
          newInst.sign = oldInst.sign;
          newInst.status = oldInst.status;
          newInst.adjustment = 0;
        }
      });

      loan.installments = newInstallments;
      loan.installmentPeriod = newPeriod;
      loan.installmentPeriodUnit = newUnit;
      loan.interestRate = newRate;
      loan.interestAmount = interestAmount;
      loan.emiAmount = emiAmount;
      recalculateSchedule(loan);
    }

    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating loan.' });
  }
});









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
        installment.amountReceived = Math.max(
          Number(installment.amountReceived || 0),
          Number(installment.dueAmount || 0) + Number(installment.pendingAmount || 0)
        );
        installment.dateReceived = installment.dateReceived || new Date();
        installment.status = 'Paid';
      } else {
        installment.amountReceived = 0;
        installment.dateReceived = null;
        installment.status = new Date(installment.dueDate) < new Date() ? 'Overdue' : 'Pending';
      }
    }

    const financialFieldsChanged =
      nextSNo !== sNo ||
      nextDueAmount !== undefined ||
      amountReceived !== undefined ||
      completed !== undefined;

    if (financialFieldsChanged) {
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
