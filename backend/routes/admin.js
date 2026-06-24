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

router.post('/migrate-images', requireAdminSecret, async (req, res) => {
  try {
    const { cleanup } = req.body || {};
    const customerStats = await migrateCustomerProfileImages();
    const loanStats = await migrateLoanDocuments();
    let cleanupStats = null;
    if (cleanup) {
      await cleanupOldFields();
      cleanupStats = { ran: true };
    }
    res.json({
      ok: true,
      customers: customerStats,
      loans: loanStats,
      cleanup: cleanupStats,
    });
  } catch (err) {
    console.error('Migration endpoint error:', err);
    res.status(500).json({ message: 'Migration failed.', error: err.message });
  }
});

module.exports = router;
