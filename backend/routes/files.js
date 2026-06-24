const express = require('express');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { getFileFromCacheOrPcloud, getMimeTypeFromExtension, cleanupExpiredCache, cacheDir } = require('../middleware/fileProxy');
const fs = require('fs');

const router = express.Router();
router.use(authMiddleware);

router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const ext = (req.query.ext || 'bin').toString().replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';

    if (!fileId) {
      return res.status(400).json({ message: 'fileId is required.' });
    }

    const filePath = await getFileFromCacheOrPcloud(fileId, ext);
    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.startsWith('{')) {
        fs.unlinkSync(filePath);
        return res.status(502).json({ message: 'Storage returned an error. Try again.', detail: content.substring(0, 200) });
      }
    }

    const mimeType = getMimeTypeFromExtension(ext);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: 'Error sending file.' });
      }
    });
  } catch (err) {
    console.error('File proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to fetch file from storage.' });
    }
  }
});

router.post('/clear-cache', authMiddleware, async (req, res) => {
  try {
    cleanupExpiredCache();
    const files = fs.readdirSync(cacheDir);
    let cleared = 0;
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(cacheDir, file));
        cleared++;
      } catch {}
    }
    res.json({ ok: true, cleared, cacheDir });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
