const express = require('express');
const authMiddleware = require('../middleware/auth');
const { migrateCustomerProfileImages, migrateLoanDocuments, cleanupOldFields } = require('../scripts/migrateImagesToPcloud');
const { uploadBase64ToPcloud, getPublicLink } = require('../utils/pcloud');
const pcloudConfig = require('../config/pcloud');

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
  try {
    const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testFileId = await uploadBase64ToPcloud(testData, `test_${Date.now()}`, pcloudConfig.folders.profilePictures);
    const testUrl = await getPublicLink(testFileId);
    res.json({ ok: true, fileId: testFileId, url: testUrl });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, config: { tokenSet: !!pcloudConfig.token, folder: pcloudConfig.folders.profilePictures } });
  }
});

module.exports = router;
