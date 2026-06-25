const express = require('express');
const authMiddleware = require('../middleware/auth');
const { migrateCustomerProfileImages, migrateLoanDocuments, cleanupOldFields } = require('../scripts/migrateImagesToPcloud');
const { uploadBase64ToPcloud, getPublicLink, getDirectPubLink } = require('../utils/pcloud');
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

module.exports = router;
