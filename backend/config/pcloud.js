module.exports = {
  token: process.env.PCLOUD_TOKEN || '',
  folders: {
    profilePictures: process.env.PCLOUD_FOLDER_PROFILE_PICTURES || '32047901260',
    documents: process.env.PCLOUD_FOLDER_DOCUMENTS || '32047901924',
  },
  baseUrl: 'https://api.pcloud.com',
  cacheDir: process.env.PCLOUD_CACHE_DIR || './cache/files',
  cacheTTL: parseInt(process.env.PCLOUD_CACHE_TTL || '3600000', 10),
  publinkCode: {
    profilePictures: process.env.PCLOUD_PUBLINK_CODE_PROFILE_PICTURES || 'kZ869N5ZRQsAHSzjpPzCLtIkEULbbhPHX3YV',
    documents: process.env.PCLOUD_PUBLINK_CODE_DOCUMENTS || 'kZY69N5Zv30UMGNRCYu4Ck7AwkKTkYh5sSsV',
  },
};