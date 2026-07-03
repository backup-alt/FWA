const express = require('express');
const authMiddleware = require('../middleware/auth');
const { migrateCustomerProfileImages, migrateLoanDocuments, cleanupOldFields } = require('../scripts/migrateImagesToPcloud');
const { uploadBase64ToPcloud, getDirectPubLink } = require('../utils/pcloud');
const pcloudConfig = require('../config/pcloud');
const https = require('https');
const dns = require('dns');

const router = express.Router();
router.use(authMiddleware);

function requireAdminSecret(req, res, next) {
  const provided = req.headers['x-admin-secret'] || req.query.secret;
  const expected = process.env.ADMIN_MIGRATION_SECRET;
  if (!expected) {
    return res.status(503).json({ message: 'Admin secret not configured on server.' });
  }
  if (!provided || provided !== expected) {
    return res.status(403).json({ message: 'Forbidden: invalid admin secret.' });
  }
  next();
}

router.post('/migrate-images', requireAdminSecret, async (req, res) => {
  const { cleanup } = req.body || {};

  const customerStats = await migrateCustomerProfileImages().catch(err => ({ error: err.message, migrated: 0, skipped: 0, errors: 1 }));
  const loanStats = await migrateLoanDocuments().catch(err => ({ error: err.message, migrated: 0, skipped: 0, errors: 1, total: 0 }));

  let cleanupStats = null;
  if (cleanup) {
    cleanupStats = await cleanupOldFields().catch(err => ({ error: err.message }));
  }

  res.json({
    ok: true,
    customers: customerStats,
    loans: loanStats,
    cleanup: cleanupStats,
    pcloudConfig: {
      tokenSet: !!pcloudConfig.token,
      profileFolder: pcloudConfig.folders.profilePictures,
      documentsFolder: pcloudConfig.folders.documents,
      baseUrl: pcloudConfig.baseUrl,
    },
  });
});

router.post('/test-pcloud', requireAdminSecret, async (req, res) => {
  const results = {};

  dns.resolve4('api.pcloud.com', (err, addrs) => {
    if (err) {
      results.dns = { error: err.message };
    } else {
      results.dns = { ok: true, addresses: addrs };
    }

    const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    uploadBase64ToPcloud(testData, `test_${Date.now()}`, pcloudConfig.folders.profilePictures)
      .then(fileId => {
        results.upload = { ok: true, fileId };
        return getDirectPubLink(fileId);
      })
      .then(url => {
        results.publicLink = { ok: true, url };
        res.json({ ok: true, pcloudConfig: { tokenSet: !!pcloudConfig.token, folder: pcloudConfig.folders.profilePictures }, results });
      })
      .catch(err => {
        results.error = err.message;
        res.status(500).json({ ok: false, pcloudConfig: { tokenSet: !!pcloudConfig.token, folder: pcloudConfig.folders.profilePictures }, results });
      });
  });
});

router.post('/cleanup-root-files', requireAdminSecret, async (req, res) => {
  const { deleteFromPcloud } = require('../utils/pcloud');
  const axios = require('axios');

  try {
    const rootResponse = await axios.get(
      `${pcloudConfig.baseUrl}/listfolder?folderid=0&access_token=${pcloudConfig.token}`
    );
    const contents = rootResponse.data.metadata?.contents || [];
    const toDelete = contents.filter(f => f.name && (f.name.startsWith('doc_') || f.name.startsWith('profile_') || f.name.startsWith('test_')));

    const results = [];
    for (const file of toDelete) {
      const deleted = await deleteFromPcloud(file.fileid);
      results.push({ name: file.name, fileid: file.fileid, deleted });
    }

    res.json({ ok: true, deleted: results.length, files: results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/backfill-doc-urls', requireAdminSecret, async (req, res) => {
  const Loan = require('../models/Loan');

  try {
    const loans = await Loan.find({ 'documents.0': { $exists: true } }).lean();
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const results = [];

    for (const loan of loans) {
      for (const doc of loan.documents) {
        if (doc.fileId && !doc.url) {
          try {
            const pubUrl = await getDirectPubLink(doc.fileId);
            await Loan.updateOne(
              { _id: loan._id, 'documents._id': doc._id.toString() },
              { $set: { 'documents.$.url': pubUrl } }
            );
            results.push({ docId: doc._id.toString(), name: doc.name, url: pubUrl });
            updated++;
          } catch (err) {
            errors++;
            results.push({ docId: doc._id.toString(), name: doc.name, error: err.message });
          }
        } else if (doc.url) {
          skipped++;
        }
      }
    }

    res.json({ ok: true, updated, skipped, errors, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

function parseAmount(value) {
  if (!value) return 0;
  return Number(String(value).replace(/[₹$,\s]/g, '')) || 0;
}

function parseDate(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!match) return null;
  let [, day, month, year] = match;
  if (year.length === 2) year = '20' + year;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function inferVehicleType(make, model) {
  const m = `${make || ''} ${model || ''}`.toLowerCase();
  const carBrands = ['tata', 'maruti', 'mahindra', 'hyundai', 'toyota', 'honda car', 'honda city', 'swift', 'safari', 'bolero', 'i20', 'i10', 'verna', 'creta', 'innova', 'fortuner', 'nexon', 'punch', 'tiago', 'altroz', 'dzire', 'baleno', 'brezza', 'ertiga', 'wagon', 'scorpio', 'xuv', 'thar', 'seltos', 'sonet', 'seltos', 'venue', 'kiger', 'triber', 'kwid', 'duster', 'kuv', 'amaze', 'city car', 'brio'];
  const autoBrands = ['auto', 'rickshaw', 'e-rickshaw', 'three-wheeler', 'piaggio', 'bajaj auto', 'bajaj re', 'chetak auto', 'mahindra treo', 'kinetic'];
  if (autoBrands.some(b => m.includes(b))) return 'Auto';
  if (carBrands.some(b => m.includes(b))) return 'Car';
  return 'Bike';
}

function parseFile(filePath) {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split('\n');

  const data = {};
  let inInstallments = false;
  const installmentLines = [];

  for (const line of lines) {
    if (/^\s*Installments\s*:?\s*$/i.test(line)) {
      inInstallments = true;
      continue;
    }
    if (inInstallments) {
      const trimmed = line.trim();
      if (trimmed) installmentLines.push(trimmed);
      continue;
    }
    const match = line.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*?)\s*$/);
    if (match) {
      data[match[1].trim()] = match[2].trim();
    }
  }

  const get = (key) => {
    for (const k of Object.keys(data)) {
      if (k.toLowerCase() === key.toLowerCase()) return data[k];
    }
    return '';
  };

  const name = get('Customer Name');
  const phoneRaw = get('Cell') || get('Call');
  const phone = phoneRaw.split(',').map(p => p.trim().replace(/[^\d+]/g, '')).filter(Boolean);
  const guarantorName = get('Guarantor Name') || get('Guarantor');
  const guarantorPhoneRaw = get('Guarantor Phone') || get('Guarantor Number') || get('guarantor Number');
  const guarantorPhone = guarantorPhoneRaw ? guarantorPhoneRaw.split(',').map(p => p.trim().replace(/[^\d+]/g, '')).filter(Boolean)[0] : '';
  const address = get('Address');

  const make = get('Make');
  const model = get('Model');
  const regNo = get('Reg No') || get('RegNo') || get('Registration No');
  const loanAmount = parseAmount(get('Loan Amount'));
  const financeAmount = parseAmount(get('Finance Amount'));

  const installmentField = get('Installment');
  let monthlyDue = 0;
  let installmentPeriod = 0;
  const installmentMatch = installmentField.match(/(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+)/i);
  if (installmentMatch) {
    monthlyDue = Number(installmentMatch[1]);
    installmentPeriod = Number(installmentMatch[2]);
  }

  const interestRateMatch = get('Interest Rate').match(/(\d+(?:\.\d+)?)/);
  const interestRate = interestRateMatch ? Number(interestRateMatch[1]) : 0;

  const statusRaw = get('Status');
  const isCompleted = /completed|closed|finished/i.test(statusRaw);
  const closureDateMatch = statusRaw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  const closureDate = closureDateMatch ? parseDate(closureDateMatch[0]) : null;

  const salesDoneBy = get('Sales Done By');
  const rc = get('RC');
  const noc = get('NOC');
  const insurance = get('Insurance');
  const id = get('ID');
  const key = get('Key');

  const installments = [];
  for (const instLine of installmentLines) {
    const instMatch = instLine.match(/^(\d+)\.\s*[₹]?([\d,]+)\s*\|\s*Due:\s*(\S+)\s*(?:\|\s*Paid:\s*(\S+)(?:\s*\(([^)]+)\))?)?/i);
    if (instMatch) {
      const [, sNo, dueAmt, dueDate, paidDate, paidNote] = instMatch;
      const dueAmount = parseAmount(dueAmt);
      const parsedDueDate = parseDate(dueDate);
      const parsedPaidDate = paidDate && paidDate.toLowerCase() !== 'pending' && paidDate.toLowerCase() !== 'unpaid' ? parseDate(paidDate) : null;
      let amountReceived = 0;
      let extraAmount = 0;
      let paymentType = '';
      if (parsedPaidDate) {
        if (paidNote) {
          const noteMatch = paidNote.match(/[₹]?([\d,]+)/);
          if (noteMatch) {
            amountReceived = parseAmount(noteMatch[1]);
            if (amountReceived > dueAmount) extraAmount = amountReceived - dueAmount;
          } else {
            amountReceived = dueAmount;
          }
        } else {
          amountReceived = dueAmount;
        }
      }
      installments.push({
        sNo: Number(sNo),
        dueAmount,
        dueDate: parsedDueDate,
        amountReceived,
        dateReceived: parsedPaidDate,
        status: parsedPaidDate ? 'Paid' : 'Pending',
        extraAmount,
        paymentType,
      });
    }
  }

  const loanStartDate = installments.length > 0 && installments[0].dueDate
    ? new Date(installments[0].dueDate.getTime())
    : new Date();

  return {
    customer: {
      name,
      cellNumbers: phone.map(p => ({ number: p })),
      guarantor: {
        name: guarantorName || '',
        address: '',
        mobile: guarantorPhone || '',
      },
      address: address || '',
      temporaryAddress: '',
      monthlySalary: 0,
      idProofType: id ? 'ID' : '',
      idProofNumber: '',
      profileImageFileId: '',
      profileImageUrl: '',
    },
    loan: installments.length > 0 ? {
      vehicleType: inferVehicleType(make, model),
      make: make || '',
      model: model || '',
      regNo: regNo || '',
      loanAccountNumber: '',
      loanAmount,
      financeAmount,
      interestRate,
      installmentPeriod,
      installmentPeriodUnit: 'Months',
      loanStartDate,
      rcDetails: rc ? { status: rc, paidThrough: '', chequeNumber: '', amount: 0 } : undefined,
      noc: noc || '',
      insurance: insurance || '',
      keyStatus: key || '',
      salesDoneBy: salesDoneBy || '',
      installments,
      isCompleted,
      closureDate,
    } : null,
  };
}

router.post('/import-customers', requireAdminSecret, async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const Customer = require('../models/Customer');
  const Loan = require('../models/Loan');

  const CUSTOMERS_DIR = path.join(__dirname, '..', '..', 'pdf_images', 'customers');
  const { startFile = 51, endFile = 999, mode = 'upsert', createLoans = true } = req.body || {};

  try {
    const deletedTamil = await Customer.deleteMany({ name: { $regex: /[^\x00-\x7F]/ } });

    const startNum = parseInt(startFile, 10);
    const endNum = parseInt(endFile, 10);
    const files = fs.readdirSync(CUSTOMERS_DIR)
      .filter(f => f.endsWith('.txt'))
      .map(f => parseInt(f.replace('.txt', ''), 10))
      .filter(n => !isNaN(n) && n >= startNum && n <= endNum)
      .sort((a, b) => a - b)
      .map(n => `${n}.txt`);

    const results = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let loansCreated = 0;

    for (const file of files) {
      try {
        const parsed = parseFile(path.join(CUSTOMERS_DIR, file));
        const customerData = parsed.customer;
        const loanData = parsed.loan;
        const phone = customerData.cellNumbers[0]?.number;

        if (!phone) {
          results.push({ file, skipped: true, reason: 'no phone in file', name: customerData.name });
          skipped++;
          continue;
        }

        let existing = await Customer.findOne({ 'cellNumbers.number': phone });

        if (existing && mode === 'skip') {
          results.push({ file, skipped: true, reason: 'duplicate phone', phone, name: customerData.name });
          skipped++;
          continue;
        }

        let customer;
        if (existing) {
          existing.name = customerData.name;
          existing.cellNumbers = customerData.cellNumbers;
          existing.guarantor = customerData.guarantor;
          if (customerData.address) existing.address = customerData.address;
          await existing.save();
          customer = existing;
          results.push({ file, _id: existing._id.toString(), action: 'updated', name: customerData.name, phone });
          updated++;
        } else {
          customer = await Customer.create(customerData);
          results.push({ file, _id: customer._id.toString(), action: 'created', name: customerData.name, phone });
          created++;
        }

        if (createLoans && loanData && loanData.loanAmount > 0 && loanData.installmentPeriod > 0 && loanData.installmentPeriodUnit) {
          const interestAmount = +(loanData.financeAmount * (loanData.interestRate / 100) * loanData.installmentPeriod).toFixed(2);
          const totalPayable = loanData.financeAmount + interestAmount;
          const allDueSum = loanData.installments.reduce((a, i) => a + (i.dueAmount || 0), 0);
          if (loanData.installments.length > 0) {
            const lastIdx = loanData.installments.length - 1;
            const lastAdjusted = +(totalPayable - allDueSum).toFixed(2);
            loanData.installments[lastIdx].dueAmount = +((loanData.installments[lastIdx].dueAmount || 0) + lastAdjusted).toFixed(2);
          }

          const loanPayload = {
            customerId: customer._id,
            customerName: customer.name,
            vehicleType: loanData.vehicleType,
            make: loanData.make,
            model: loanData.model,
            regNo: loanData.regNo,
            loanAccountNumber: loanData.loanAccountNumber,
            loanAmount: loanData.loanAmount,
            financeAmount: loanData.financeAmount,
            interestRate: loanData.interestRate,
            installmentPeriod: loanData.installmentPeriod,
            installmentPeriodUnit: loanData.installmentPeriodUnit,
            loanStartDate: loanData.loanStartDate,
            rcDetails: loanData.rcDetails,
            noc: loanData.noc,
            insurance: loanData.insurance,
            keyStatus: loanData.keyStatus,
            salesDoneBy: loanData.salesDoneBy,
            installments: loanData.installments,
            interestAmount,
            emiAmount: loanData.monthlyDue || (loanData.installments[0]?.dueAmount || 0),
            outstandingPrincipal: Math.max(loanData.loanAmount + interestAmount - loanData.installments.reduce((sum, i) => sum + (i.amountReceived || 0), 0), 0),
            totalPaid: loanData.installments.reduce((sum, i) => sum + (i.amountReceived || 0), 0),
            status: loanData.isCompleted ? 'Completed' : 'Active',
            completedAt: loanData.isCompleted ? (loanData.closureDate || new Date()) : null,
          };
          if (!loanPayload.closureInfo) {
            loanPayload.closureInfo = { reason: '', remarks: '', amountReceived: 0, closureDate: null };
          }
          if (loanData.isCompleted) {
            loanPayload.closureInfo.closureDate = loanData.closureDate || new Date();
            loanPayload.closureInfo.reason = 'Account Closed';
          }
          const loan = await Loan.create(loanPayload);
          loansCreated++;
          const r = results[results.length - 1];
          if (r) {
            r.loanId = loan._id.toString();
            r.loanStatus = loan.status;
            r.loanAmount = loan.loanAmount;
            r.financeAmount = loan.financeAmount;
            r.interestRate = loan.interestRate;
            r.installmentPeriod = loan.installmentPeriod;
            r.installmentsCount = loanData.installments.length;
          }
        }
      } catch (err) {
        results.push({ file, error: err.message });
        failed++;
      }
    }

    res.json({
      ok: true,
      mode,
      total: files.length,
      created,
      updated,
      skipped,
      failed,
      loansCreated,
      deletedTamil: deletedTamil.deletedCount,
      results,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/wipe-all', requireAdminSecret, async (req, res) => {
  const Customer = require('../models/Customer');
  const Loan = require('../models/Loan');

  try {
    const custCount = await Customer.countDocuments();
    const loanCount = await Loan.countDocuments();

    await Loan.deleteMany({});
    const deletedLoans = await Loan.countDocuments();

    await Customer.deleteMany({});
    const deletedCustomers = await Customer.countDocuments();

    res.json({
      ok: true,
      deleted: { customers: custCount - deletedCustomers, loans: loanCount - deletedLoans },
      remaining: { customers: deletedCustomers, loans: deletedLoans },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;