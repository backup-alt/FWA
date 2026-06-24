const fs = require('fs');
const path = require('path');
const { downloadFromPcloud, getPublicLink } = require('../utils/pcloud');
const pcloudConfig = require('../config/pcloud');

const cacheDir = path.resolve(__dirname, '..', 'cache', 'files');
const cacheTTL = pcloudConfig.cacheTTL || 60 * 60 * 1000;

if (!fs.existsSync(cacheDir)) {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`[fileProxy] Created cache directory: ${cacheDir}`);
  } catch (err) {
    console.error(`[fileProxy] Failed to create cache directory: ${err.message}`);
  }
}

function getCacheFilePath(fileId, extension) {
  return path.join(cacheDir, `${fileId}.${extension || 'bin'}`);
}

function isCacheValid(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stats = fs.statSync(filePath);
  const now = Date.now();
  return (now - stats.mtimeMs) < cacheTTL;
}

async function getFileFromCacheOrPcloud(fileId, extension) {
  const cachePath = getCacheFilePath(fileId, extension);

  if (isCacheValid(cachePath)) {
    return cachePath;
  }

  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }

  try {
    await downloadFromPcloud(fileId, cachePath);
    return cachePath;
  } catch (err) {
    console.error('Failed to download from pcloud:', err.message);
    throw err;
  }
}

function getMimeTypeFromExtension(ext) {
  const extToMime = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
  };
  return extToMime[ext?.toLowerCase()] || 'application/octet-stream';
}

function cleanupExpiredCache() {
  if (!fs.existsSync(cacheDir)) return;

  const files = fs.readdirSync(cacheDir);
  const now = Date.now();

  files.forEach(file => {
    const filePath = path.join(cacheDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > cacheTTL) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Error cleaning up cache file ${file}:`, err.message);
    }
  });
}

setInterval(cleanupExpiredCache, 10 * 60 * 1000);

module.exports = {
  getFileFromCacheOrPcloud,
  getCacheFilePath,
  getMimeTypeFromExtension,
  cleanupExpiredCache,
  cacheDir,
};