const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pcloudConfig = require('../config/pcloud');

const API_BASE = pcloudConfig.baseUrl;
const TOKEN = pcloudConfig.token;

function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
  };
  return mimeToExt[mimeType] || 'bin';
}

function base64ToBuffer(base64Data) {
  const base64Regex = /^data:([^;]+);base64,(.+)$/;
  const matches = base64Data.match(base64Regex);
  if (!matches) {
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType: 'application/octet-stream' };
  }
  const mimeType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, 'base64');
  return { buffer, mimeType };
}

async function compressImage(buffer, maxSizeMB = 5) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (buffer.length <= maxSizeBytes) {
    return buffer;
  }

  let quality = 90;
  let resultBuffer = buffer;

  while (resultBuffer.length > maxSizeBytes && quality > 10) {
    resultBuffer = await sharp(buffer)
      .jpeg({ quality })
      .toBuffer();

    if (resultBuffer.length <= maxSizeBytes) {
      return resultBuffer;
    }
    quality -= 10;
  }

  if (resultBuffer.length > maxSizeBytes) {
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width;
    let height = metadata.height;

    while (resultBuffer.length > maxSizeBytes && width > 200 && height > 200) {
      width = Math.floor(width * 0.8);
      height = Math.floor(height * 0.8);
      resultBuffer = await sharp(buffer)
        .resize(width, height)
        .jpeg({ quality: 80 })
        .toBuffer();
    }
  }

  return resultBuffer;
}

async function uploadToPcloud(buffer, filename, folderId) {
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', buffer, { filename });
    if (folderId) formData.append('folderid', folderId);
    formData.append('renameifexists', 1);

    const uploadUrl = `${API_BASE}/uploadfile?access_token=${TOKEN}${folderId ? `&folderid=${folderId}` : ''}`;

    const response = await axios.post(
      uploadUrl,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      }
    );

    if (response.data.result === 0) {
      return response.data.fileids[0];
    } else {
      throw new Error(`pcloud upload failed: ${response.data.error}`);
    }
  } catch (err) {
    if (err.response) {
      throw new Error(`pcloud upload failed with status ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    }
    console.error('pcloud upload error:', err.message);
    throw err;
  }
}

async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE}/currentserver?access_token=${TOKEN}`, { timeout: 10000 });
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

async function getFileMetadata(fileId) {
  try {
    const response = await axios.get(
      `${API_BASE}/stat?fileid=${fileId}&access_token=${TOKEN}`
    );
    if (response.data.result === 0) {
      return response.data.metadata;
    } else {
      throw new Error(response.data.error);
    }
  } catch (err) {
    console.error('pcloud stat error:', err.message);
    throw err;
  }
}

async function getPublicLink(fileId, folderCode) {
  try {
    const code = folderCode || pcloudConfig.publinkCode?.profilePictures || pcloudConfig.publinkCode?.documents;
    if (!code) {
      throw new Error('No pcloud folder code configured');
    }
    const endpoint = `${API_BASE}/getpublinkdownload?code=${code}&fileid=${fileId}&access_token=${TOKEN}`;
    const response = await axios.get(endpoint);

    if (response.data.result === 0) {
      const host = response.data.hosts?.[0] || 'u.pcloud.link';
      const filePath = response.data.path || `/${fileId}`;
      return `https://${host}${filePath}`;
    } else {
      throw new Error(`pcloud link failed: ${response.data.error}`);
    }
  } catch (err) {
    console.error('pcloud getPublicLink error:', err.message);
    throw err;
  }
}

async function getPubLink(fileId) {
  try {
    const response = await axios.get(
      `${API_BASE}/getfilepublink?fileid=${fileId}&access_token=${TOKEN}`
    );

    if (response.data.result === 0) {
      return response.data.publink;
    } else {
      throw new Error(`pcloud getfilepublink failed: ${response.data.error}`);
    }
  } catch (err) {
    console.error('pcloud getfilepublink error:', err.message);
    throw err;
  }
}

async function deleteFromPcloud(fileId) {
  try {
    const response = await axios.get(
      `${API_BASE}/deletefile?fileid=${fileId}&access_token=${TOKEN}`
    );

    if (response.data.result === 0) {
      return true;
    } else {
      console.warn(`pcloud delete warning: ${response.data.result}: ${response.data.error}`);
      return false;
    }
  } catch (err) {
    console.error('pcloud delete error:', err.message);
    return false;
  }
}

async function downloadFromPcloud(fileId, localPath) {
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const response = await axios.get(
      `${API_BASE}/downloadfile?fileid=${fileId}&access_token=${TOKEN}`,
      {
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );

    const buffer = Buffer.from(response.data);
    if (buffer.length < 100) {
      throw new Error(`downloadfile returned too small a response (${buffer.length} bytes): ${buffer.toString('utf8').substring(0, 100)}`);
    }

    fs.writeFileSync(localPath, buffer);
    return localPath;
  } catch (err) {
    console.error('pcloud download error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data).substring(0, 200));
    }
    throw err;
  }
}

async function uploadBase64ToPcloud(base64Data, filename, folderId, compress = true) {
  const { buffer, mimeType } = base64ToBuffer(base64Data);

  let finalBuffer = buffer;
  if (compress && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
    if (mimeType.startsWith('image/')) {
      finalBuffer = await compressImage(buffer, 5);
    }
  }

  const ext = getExtensionFromMimeType(mimeType);
  const finalFilename = `${filename}.${ext}`;

  const fileId = await uploadToPcloud(finalBuffer, finalFilename, folderId);
  return fileId;
}

function generateFileId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  uploadToPcloud,
  getPublicLink,
  getPubLink,
  deleteFromPcloud,
  downloadFromPcloud,
  compressImage,
  uploadBase64ToPcloud,
  base64ToBuffer,
  generateFileId,
  getExtensionFromMimeType,
  pcloudConfig,
  checkServer,
  getFileMetadata,
};