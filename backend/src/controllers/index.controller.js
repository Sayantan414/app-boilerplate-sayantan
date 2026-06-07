const fs = require('fs');
const path = require('path');
const { getIpAddress } = require('../utils/request.utils');
const { errorResponse } = require('../utils/response.utils');
const logger = require('../config/logger');

const UPLOAD_PATH = path.join(__dirname, '../../public/json/');

/**
 * GET home page (Legacy /)
 */
const getHome = (req, res) => {
  const ip = getIpAddress(req);
  const PACKAGE_PATH = path.join(__dirname, '../../package.json');
  
  fs.readFile(PACKAGE_PATH, 'utf8', (err, result) => {
    if (err) {
      logger.error('Failed to read package.json', err);
      return errorResponse(res, 'Internal server error', 500);
    }
    try {
      const data = JSON.parse(result);
      return res.json({ title: data.description || 'API Boilerplate', version: data.version, from: ip });
    } catch (parseErr) {
      logger.error('Failed to parse package.json', parseErr);
      return res.json({ title: 'API Boilerplate', version: '1.0.0', from: ip });
    }
  });
};

/**
 * GET static App Data for display (Legacy /appmeta/:file)
 */
const getAppMeta = (req, res) => {
  const file = path.basename(req.params.file);
  let filePath = path.resolve(UPLOAD_PATH, file);

  if (!filePath.startsWith(path.resolve(UPLOAD_PATH))) {
    return errorResponse(res, 'Forbidden', 403);
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(UPLOAD_PATH, 'app-metadata.json');
  }

  if (!fs.existsSync(filePath)) {
    return errorResponse(res, 'App metadata file not found', 404);
  }

  fs.createReadStream(filePath).pipe(res);
};

module.exports = {
  getHome,
  getAppMeta,
};
