const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/config');
const logger = require('../config/logger');

// Local storage path for development mode
const LOCAL_IMAGE_PATH = path.resolve(__dirname, '../../public/images');

// Initialize S3 client only when NOT in development mode
let s3Client = null;
if (config.env !== 'development') {
  if (!config.s3.bucketName) {
    logger.error('S3 Storage service is not fully configured (missing bucket name)');
  } else {
    const s3Config = {
      region: config.s3.region || 'ap-south-1',
    };

    // Only add credentials if explicitly provided (local dev with access keys)
    // On EC2, IAM role provides credentials automatically — no keys needed
    if (config.s3.accessKeyId && config.s3.secretAccessKey) {
      s3Config.credentials = {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      };
    }

    s3Client = new S3Client(s3Config);
    logger.info('S3 Storage service initialized successfully');
  }
} else {
  logger.info('Storage service running in development mode (using local directory)');
}

/**
 * Helper to determine MIME type by file extension
 */
const getContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
};

/**
 * Helper to convert S3 readable stream to Buffer
 */
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

/**
 * Upload a file
 * @param {string} sourcePath - temp path of uploaded file
 * @param {string} targetFolder - folder name inside storage (e.g. 'users')
 * @param {string} targetFileName - final file name
 * @returns {{ fileName: string, url: string }}
 */
const uploadFile = async (sourcePath, targetFolder, targetFileName) => {
  try {
    if (config.env === 'development') {
      // Save to local public/images folder
      const targetDir = path.resolve(LOCAL_IMAGE_PATH, targetFolder);
      await fs.promises.mkdir(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, targetFileName);
      await fs.promises.copyFile(sourcePath, targetPath);
      logger.info(`Locally uploaded file: ${targetFolder}/${targetFileName}`);
      return {
        fileName: targetFileName,
        url: `/api/user/getProfilePic/${targetFileName}`
      };
    } else {
      // Upload to AWS S3
      if (!s3Client) {
        throw new Error('S3 Storage service is not configured');
      }
      const fileStream = fs.createReadStream(sourcePath);
      const key = `${targetFolder}/${targetFileName}`;
      const command = new PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: getContentType(targetFileName),
      });
      await s3Client.send(command);
      logger.info(`S3 uploaded file: ${key}`);
      return {
        fileName: targetFileName,
        url: `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`
      };
    }
  } finally {
    // Always clean up the temp file regardless of success or failure
    if (fs.existsSync(sourcePath)) {
      try {
        await fs.promises.unlink(sourcePath);
        logger.info(`Cleaned up temp upload file: ${sourcePath}`);
      } catch (err) {
        logger.error(`Failed to clean up temp upload file: ${sourcePath}`, err);
      }
    }
  }
};

/**
 * Get a file
 * @param {string} folder - folder name inside storage
 * @param {string} fileName - file name
 * @returns {{ Body: Buffer, ContentType: string }}
 */
const getFile = async (folder, fileName) => {
  if (config.env === 'development') {
    const filePath = path.resolve(LOCAL_IMAGE_PATH, folder, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${folder}/${fileName}`);
    }
    const fileBuffer = await fs.promises.readFile(filePath);
    return {
      Body: fileBuffer,
      ContentType: getContentType(fileName),
    };
  } else {
    if (!s3Client) {
      throw new Error('S3 Storage service is not configured');
    }
    const key = `${folder}/${fileName}`;
    const command = new GetObjectCommand({
      Bucket: config.s3.bucketName,
      Key: key,
    });
    const response = await s3Client.send(command);
    const fileBuffer = await streamToBuffer(response.Body);
    return {
      Body: fileBuffer,
      ContentType: response.ContentType || getContentType(fileName),
    };
  }
};

/**
 * Delete a file
 * @param {string} folder - folder name inside storage
 * @param {string} fileName - file name
 */
const deleteFile = async (folder, fileName) => {
  if (config.env === 'development') {
    const filePath = path.resolve(LOCAL_IMAGE_PATH, folder, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Locally deleted file: ${folder}/${fileName}`);
    } else {
      logger.warn(`Local file to delete not found: ${folder}/${fileName}`);
    }
  } else {
    if (!s3Client) {
      throw new Error('S3 Storage service is not configured');
    }
    const key = `${folder}/${fileName}`;
    const command = new DeleteObjectCommand({
      Bucket: config.s3.bucketName,
      Key: key,
    });
    await s3Client.send(command);
    logger.info(`S3 deleted file: ${key}`);
  }
};

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};