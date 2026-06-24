const express = require('express');
const authMiddleware = require('../middleware/auth');
const { migrateCustomerProfileImages, migrateLoanDocuments, cleanupOldFields } = require('../scripts/migrateImagesToPcloud');

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

function captureConsoleOutput(fn) {
  const logs = [];
  const origLog = console.log;
  const origError = console.error;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  console.error = (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  return fn().finally(() => {
    console.log = origLog;
    console.error = origError;
  }).then(result => ({ result, logs })).catch(err => ({ error: err.message, logs, stack: err.stack }));
}

router.post('/migrate-images', requireAdminSecret, async (req, res) => {
  const { cleanup } = req.body || {};

  const customerResult = await captureConsoleOutput(async () => {
    return migrateCustomerProfileImages();
  });

  const loanResult = await captureConsoleOutput(async () => {
    return migrateLoanDocuments();
  });

  let cleanupResult = null;
  if (cleanup) {
    cleanupResult = await captureConsoleOutput(async () => {
      return cleanupOldFields();
    });
  }

  res.json({
    ok: true,
    customers: customerResult.result || { error: customerResult.error },
    customerLogs: customerResult.logs,
    loans: loanResult.result || { error: loanResult.error },
    loanLogs: loanResult.logs,
    cleanup: cleanupResult ? (cleanupResult.result || { error: cleanupResult.error }) : null,
    cleanupLogs: cleanupResult?.logs,
  });
});

module.exports = router;
