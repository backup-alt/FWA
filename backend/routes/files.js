const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getFileFromCacheOrPcloud, getMimeTypeFromExtension } = require('../middleware/fileProxy');

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
    const mimeType = getMimeTypeFromExtension(ext);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(filePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error sending file.' });
        }
      }
    });
  } catch (err) {
    console.error('File proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to fetch file from storage.' });
    }
  }
});

module.exports = router;
