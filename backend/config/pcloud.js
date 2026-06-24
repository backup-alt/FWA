module.exports = {
  token: process.env.PCLOUD_TOKEN || '',
  folders: {
    profilePictures: process.env.PCLOUD_FOLDER_PROFILE_PICTURES || '',
    documents: process.env.PCLOUD_FOLDER_DOCUMENTS || '',
  },
  baseUrl: 'https://api.pcloud.com',
  cacheDir: process.env.PCLOUD_CACHE_DIR || './cache/files',
  cacheTTL: parseInt(process.env.PCLOUD_CACHE_TTL || '3600000', 10), // 1 hour default
};