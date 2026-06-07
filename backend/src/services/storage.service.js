const logger = require('../config/logger');

const uploadFile = async (sourcePath, targetFolder, targetFileName) => {
  logger.warn('Storage service is disabled');
  throw new Error('Storage service is not configured');
};

const getFile = async (folder, fileName) => {
  logger.warn('Storage service is disabled');
  throw new Error('Storage service is not configured');
};

const deleteFile = async (folder, fileName) => {
  logger.warn('Storage service is disabled');
  throw new Error('Storage service is not configured');
};

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};