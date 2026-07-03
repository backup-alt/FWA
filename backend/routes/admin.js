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

router.post('/import-customers', requireAdminSecret, async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const Customer = require('../models/Customer');

  const CUSTOMERS_DIR = path.join(__dirname, '..', '..', 'pdf_images', 'customers');

  function parseFile(filePath) {
    const buf = fs.readFileSync(filePath);
    let content = buf.toString('utf8');
    content = content.replace(/^\uFEFF/, '');
    const lines = content.split('\n');
    const data = {};
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*?)\s*$/);
      if (match) {
        data[match[1].trim()] = match[2].trim();
      }
    }
    const customerName = data['Customer Name'] || '';
    const call = data['Call'] || '';
    const guarantorRaw = data['guarantor Number'] || '';
    const guarantorPhone = guarantorRaw.split(',').map(p => p.trim()).filter(Boolean)[0] || '';

    return {
      name: customerName,
      cellNumbers: call ? [{ number: call }] : [],
      guarantor: { name: '', address: '', mobile: guarantorPhone },
      address: '',
      temporaryAddress: '',
      monthlySalary: 0,
      idProofType: '',
      idProofNumber: '',
      profileImageFileId: '',
      profileImageUrl: '',
    };
  }

  try {
    const files = fs.readdirSync(CUSTOMERS_DIR).filter(f => f.endsWith('.txt')).sort();
    const results = [];
    for (const file of files) {
      try {
        const data = parseFile(path.join(CUSTOMERS_DIR, file));
        const customer = await Customer.create(data);
        results.push({ file, _id: customer._id.toString(), name: data.name, phone: data.cellNumbers[0]?.number, guarantor: data.guarantor.mobile });
      } catch (err) {
        results.push({ file, error: err.message });
      }
    }
    const imported = results.filter(r => r._id).length;
    const failed = results.filter(r => r.error).length;
    res.json({ ok: true, total: files.length, imported, failed, results });
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
