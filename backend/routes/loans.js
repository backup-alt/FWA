const express = require('express');
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');
const {
  generateInstallmentSchedule,
  recalculateSchedule,
  getPendingDues,
} = require('../utils/loanCalculations');
const {
  uploadBase64ToPcloud,
  deleteFromPcloud,
  getProxyUrl,
} = require('../utils/pcloud');
const { getFileFromCacheOrPcloud, getMimeTypeFromExtension } = require('../middleware/fileProxy');
const pcloudConfig = require('../config/pcloud');

const router = express.Router();
const roundMoney = (v) => +Number(v || 0).toFixed(2);

async function buildLoanResponse(loan) {
  const obj = typeof loan.toObject === 'function' ? loan.toObject() : { ...loan };
  if (obj.documents && Array.isArray(obj.documents)) {
    obj.documents = await Promise.all(
      obj.documents.map(async (doc) => {
        if (doc.fileId) {
          try {
            return { ...doc, url: await getProxyUrl(doc.fileId) };
          } catch {
            return { ...doc, url: '' };
          }
        }
        return doc;
      })
    );
  }
  return obj;
}

router.use(authMiddleware);

// Create loan (requires customerId)
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      vehicleType,
      make,
      model,
      regNo,
      loanAccountNumber,
      loanAmount,
      financeAmount,
      rcDetails,
      noc,
      insurance,
      idProof,
      keyStatus,
      salesDoneBy,
      chequesReceived,
      loanStartDate,
      installmentPeriod,
      installmentPeriodUnit,
      interestRate,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    if (!vehicleType || !financeAmount || !installmentPeriod || interestRate === undefined || !loanStartDate) {
      return res.status(400).json({
        message: 'vehicleType, financeAmount, installmentPeriod, interestRate, and loanStartDate are required.',
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
      customerId,
      customerName: customer.name,
      vehicleType,
      make,
      model,
      regNo,
      loanAccountNumber,
      loanAmount,
      financeAmount,
      rcDetails,
      noc,
      insurance,
      idProof,
      keyStatus,
      salesDoneBy,
      chequesReceived: (chequesReceived || []).filter(c => c.chequeNumber),
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

// List loans (optionally filter by customerId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const loans = await Loan.find(filter).sort({ createdAt: -1 }).lean();
    // Recalculate schedule in-memory only (DO NOT SAVE on GET request to keep it fast)
    for (const loan of loans) {
      recalculateSchedule(loan);
    }
    const shapedLoans = await Promise.all(loans.map(buildLoanResponse));
    res.json(shapedLoans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loans.' });
  }
});

// Pending dues
router.get('/pending-dues', async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'Active' }).lean();
    const pending = getPendingDues(loans);
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching pending dues.' });
  }
});

// Payment report
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required.' });
    }

    // Use date strings directly for comparison to avoid timezone issues
    const startStr = startDate; // YYYY-MM-DD
    const endStr = endDate; // YYYY-MM-DD

    const loans = await Loan.find({}).lean();
    const customers = await Customer.find({}).lean();

    const customerMap = {};
    customers.forEach(c => {
      customerMap[c._id.toString()] = c;
    });

    const paidInstallments = [];
    const dueInstallments = [];
    let paidTotal = 0;
    let dueTotal = 0;

    for (const loan of loans) {
      const customer = customerMap[loan.customerId?.toString()] || {};
      const customerName = loan.customerName || customer.name || 'Unknown';
      const cellNumbers = loan.cellNumbers || customer.cellNumbers || [];
      const address = loan.address || customer.address || '';

      for (const installment of loan.installments || []) {
        // Convert dates to YYYY-MM-DD string for comparison
        const dueDateObj = new Date(installment.dueDate);
        const dueDateStr = dueDateObj.toISOString().split('T')[0];

        let receivedDateStr = null;
        if (installment.dateReceived) {
          const receivedDateObj = new Date(installment.dateReceived);
          receivedDateStr = receivedDateObj.toISOString().split('T')[0];
        }

        // Check if due date falls in the selected range
        const isDueInRange = dueDateStr >= startStr && dueDateStr <= endStr;

        // Check if payment was received in the selected range
        const isPaidInRange = receivedDateStr && receivedDateStr >= startStr && receivedDateStr <= endStr;

        const commonData = {
          loanId: loan._id,
          customerId: loan.customerId,
          customerName,
          cellNumbers: cellNumbers.map ? cellNumbers.map(c => c.number).filter(Boolean) : [],
          address,
          vehicleType: loan.vehicleType,
          make: loan.make,
          model: loan.model,
          regNo: loan.regNo,
          loanAmount: loan.loanAmount,
          emiAmount: loan.emiAmount,
          sNo: installment.sNo,
          dueDate: installment.dueDate,
          dueAmount: installment.dueAmount,
          amountReceived: installment.amountReceived || 0,
          dateReceived: installment.dateReceived,
          status: installment.status,
          pendingAmount: installment.pendingAmount || 0,
        };

        if (isPaidInRange) {
          paidTotal += installment.amountReceived || 0;
          paidInstallments.push(commonData);
        }

        // For due installments: show all unpaid installments due on or before endDate
        if (dueDateStr <= endStr && installment.status !== 'Paid') {
          const today = new Date();
          const daysOverdue = Math.floor((today - dueDateObj) / (1000 * 60 * 60 * 24));
          dueInstallments.push({
            ...commonData,
            daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
            carryingOutstanding: installment.pendingAmount || installment.dueAmount,
          });
          dueTotal += installment.pendingAmount || installment.dueAmount;
        }
      }
    }

    res.json({
      paid: {
        count: paidInstallments.length,
        total: paidTotal,
        data: paidInstallments,
      },
      due: {
        count: dueInstallments.length,
        total: dueTotal,
        data: dueInstallments,
      },
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ message: 'Server error generating report.' });
  }
});

// Get single loan
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).lean();
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    recalculateSchedule(loan);
    const shapedLoan = await buildLoanResponse(loan);
    res.json(shapedLoan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loan.' });
  }
});

// Update loan
router.put('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const updatableFields = [
      'make', 'model', 'regNo', 'loanAmount', 'loanAccountNumber',
      'rcDetails', 'noc', 'insurance', 'idProof', 'keyStatus', 'salesDoneBy',
      'customerName', 'address', 'cellNumbers', 'guarantor', 'chequesReceived',
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
          newInst.paymentType = oldInst.paymentType || '';
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

// Record payment on installment
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

    const { amountReceived, dateReceived, sign, completed, paymentType } = req.body;
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
    if (paymentType !== undefined) installment.paymentType = paymentType;
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
        installment.paymentType = '';
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

// Upload document to loan (uploads to pcloud, stores fileId)
router.post('/:id/documents', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const { name, type, data } = req.body;
    if (!name || !type || !data) {
      return res.status(400).json({ message: 'name, type, and data are required.' });
    }

    if (!data.startsWith('data:')) {
      return res.status(400).json({ message: 'Document data must be a Base64 data URI.' });
    }

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `doc_${loan._id}_${Date.now()}_${safeName.split('.')[0]}`;

    let fileId;
    try {
      fileId = await uploadBase64ToPcloud(
        data,
        filename,
        pcloudConfig.folders.documents,
        5
      );
    } catch (err) {
      console.error('pcloud document upload failed:', err.message);
      return res.status(500).json({ message: 'Failed to upload document to storage.' });
    }

    loan.documents.push({
      name,
      type,
      fileId,
      uploadedAt: new Date(),
    });
    await loan.save();

    const savedDoc = loan.documents[loan.documents.length - 1];
    let docUrl = '';
    try {
      docUrl = await getProxyUrl(fileId);
    } catch { /* ignore */ }
    res.status(201).json({
      _id: savedDoc._id,
      name: savedDoc.name,
      type: savedDoc.type,
      fileId: savedDoc.fileId,
      url: docUrl,
      uploadedAt: savedDoc.uploadedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error uploading document.' });
  }
});

// Stream a document file via proxy (downloads from pcloud, caches locally)
router.get('/:id/documents/:docId/file', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).lean();
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const doc = (loan.documents || []).find(d => d._id.toString() === req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    if (!doc.fileId) return res.status(404).json({ message: 'Document file is missing.' });

    const extFromName = doc.name && doc.name.includes('.')
      ? doc.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/gi, '')
      : '';
    const extFromMime = doc.type && doc.type.includes('/')
      ? doc.type.split('/')[1].toLowerCase().replace(/[^a-z0-9]/gi, '')
      : '';
    const ext = extFromName || extFromMime || 'bin';

    const filePath = await getFileFromCacheOrPcloud(doc.fileId, ext);
    const mimeType = getMimeTypeFromExtension(ext);

    res.setHeader('Content-Type', doc.type || mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: 'Error sending file.' });
      }
    });
  } catch (err) {
    console.error('Loan document proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to fetch document from storage.' });
    }
  }
});

// Delete document from loan (also deletes file from pcloud)
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const docIndex = loan.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found.' });

    const doc = loan.documents[docIndex];
    const fileIdToDelete = doc.fileId;

    loan.documents.splice(docIndex, 1);
    await loan.save();

    if (fileIdToDelete) {
      try {
        await deleteFromPcloud(fileIdToDelete);
      } catch (err) {
        console.error(`Failed to delete pcloud file ${fileIdToDelete}:`, err.message);
      }
    }

    res.json({ message: 'Document deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting document.' });
  }
});

// Close loan
router.put('/:id/close', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    if (loan.status === 'Closed') {
      return res.status(400).json({ message: 'Loan is already closed.' });
    }

    const {
      closureReason,
      closureRemarks = '',
      amountReceived = 0,
      closureDate,
    } = req.body;

    if (!closureReason) {
      return res.status(400).json({ message: 'closureReason is required.' });
    }

    const VALID_REASONS = [
      'Full Prepayment',
      'Foreclosure',
      'Write-off',
      'Settlement',
      'Waiver',
    ];
    if (!VALID_REASONS.includes(closureReason)) {
      return res.status(400).json({
        message: `closureReason must be one of: ${VALID_REASONS.join(', ')}`,
      });
    }

    // Mark all non-paid installments as Cancelled
    loan.installments.forEach((inst) => {
      if (inst.status !== 'Paid') {
        inst.status = 'Cancelled';
      }
    });

    loan.status = 'Closed';
    loan.closureInfo = {
      reason: closureReason,
      remarks: closureRemarks,
      amountReceived: Number(amountReceived) || 0,
      closureDate: closureDate ? new Date(closureDate) : new Date(),
    };

    // Recalculate totals (skips cancelled installments)
    recalculateSchedule(loan);

    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error closing loan.' });
  }
});

// Restructure loan (lump sum → lower EMI or shorten period)
router.put('/:id/restructure', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    if (loan.status !== 'Active') {
      return res.status(400).json({ message: 'Only Active loans can be restructured.' });
    }

    const { mode, targetValue } = req.body;
    if (!mode || !['lower-emi', 'shorten-period'].includes(mode)) {
      return res.status(400).json({ message: 'mode must be lower-emi or shorten-period.' });
    }
    if (!targetValue || Number(targetValue) <= 0) {
      return res.status(400).json({ message: 'targetValue must be a positive number.' });
    }

    const targetNum = Number(targetValue);

    // Identify unacted (future) installments
    const actedInstallments = loan.installments.filter(
      (i) => i.status === 'Paid' || i.status === 'Partial' || Number(i.amountReceived || 0) > 0
    );
    const futureInstallments = loan.installments
      .filter(
        (i) =>
          i.status !== 'Paid' &&
          i.status !== 'Cancelled' &&
          Number(i.amountReceived || 0) === 0
      )
      .sort((a, b) => a.sNo - b.sNo);

    if (futureInstallments.length === 0) {
      return res.status(400).json({ message: 'No future installments to restructure.' });
    }

    // Current outstanding = sum of future installment dueAmounts
    const currentOutstanding = roundMoney(
      futureInstallments.reduce((sum, i) => sum + Number(i.dueAmount || 0), 0)
    );

    const rate = loan.interestRate || 0; // per-period flat rate %
    const prevEmi = roundMoney(futureInstallments[0].dueAmount || 0);
    const prevPeriod = futureInstallments.length;

    let newPeriod;
    let newEmi;
    let newOutstanding;
    let requiredLumpSum;

    if (mode === 'lower-emi') {
      if (targetNum >= prevEmi) {
        return res.status(400).json({
          message: `Target EMI must be lower than the current EMI (${prevEmi}).`,
        });
      }
      newOutstanding = targetNum / ((1 / prevPeriod) + (rate / 100));
      requiredLumpSum = currentOutstanding - newOutstanding;
      newPeriod = prevPeriod;
      newEmi = targetNum;
    } else {
      if (!Number.isInteger(targetNum)) {
        return res.status(400).json({
          message: 'Target period must be a whole number of months.',
        });
      }
      if (targetNum >= prevPeriod) {
        return res.status(400).json({
          message: `Target period must be fewer than the current remaining period (${prevPeriod} months).`,
        });
      }
      newOutstanding = prevEmi / ((1 / targetNum) + (rate / 100));
      requiredLumpSum = currentOutstanding - newOutstanding;
      newPeriod = targetNum;
      newEmi = prevEmi;
    }

    const lumpSumNum = roundMoney(requiredLumpSum);
    newOutstanding = roundMoney(newOutstanding);
    newEmi = roundMoney(newEmi);

    if (lumpSumNum <= 0 || lumpSumNum >= currentOutstanding) {
      return res.status(400).json({
        message: 'This target requires an invalid lump sum payment.',
      });
    }

    // Get due date of the first future installment as the start reference
    const firstFutureDueDate = new Date(futureInstallments[0].dueDate);
    const unit = loan.installmentPeriodUnit || 'Months';

    // Remove all future installments from the loan
    loan.installments = actedInstallments;

    // Regenerate future installments
    for (let i = 1; i <= newPeriod; i++) {
      const dueDate = new Date(firstFutureDueDate);
      if (unit === 'Weeks') dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
      else if (unit === 'Days') dueDate.setDate(dueDate.getDate() + (i - 1));
      else dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const nextSNo = (actedInstallments.length > 0
        ? Math.max(...actedInstallments.map((a) => a.sNo))
        : 0) + i;

      let dueAmount = newEmi;
      if (i === newPeriod) {
        const sumSoFar = roundMoney(newEmi * (newPeriod - 1));
        // Last installment = newOutstanding + interest*newPeriod - sumSoFar
        const totalPayable = roundMoney(
          newOutstanding + roundMoney(newOutstanding * (rate / 100)) * newPeriod
        );
        dueAmount = roundMoney(totalPayable - sumSoFar);
      }

      loan.installments.push({
        sNo: nextSNo,
        dueAmount,
        dueDate,
        amountReceived: 0,
        dateReceived: null,
        sign: '',
        status: dueDate < new Date() ? 'Overdue' : 'Pending',
        adjustment: 0,
        pendingAmount: 0,
        shortfallAmount: 0,
        extraAmount: 0,
      });
    }

    // Log the restructure
    if (!loan.restructureLog) loan.restructureLog = [];
    loan.restructureLog.push({
      date: new Date(),
      mode,
      targetValue: targetNum,
      lumpSumApplied: lumpSumNum,
      oldOutstanding: currentOutstanding,
      newOutstanding,
      oldPeriod: prevPeriod,
      newPeriod,
      oldEmi: prevEmi,
      newEmi,
    });
    loan.installmentPeriod =
      actedInstallments.length + newPeriod;

    recalculateSchedule(loan);
    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error restructuring loan.' });
  }
});

// Delete loan
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
