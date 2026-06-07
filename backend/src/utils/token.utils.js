const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate Access Token
 * @param {Object} user 
 * @returns {string}
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, userid: user.userid, email: user.email, role: user.role, ocode: user.ocode, privilege: user.privilege || [] },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiration, algorithm: 'HS256' }
  );
};

/**
 * Generate Refresh Token
 * @param {Object} user 
 * @returns {string}
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration }
  );
};

/**
 * Verify Access Token
 * @param {string} token 
 * @returns {Object}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
};

/**
 * Verify Refresh Token
 * @param {string} token 
 * @returns {Object}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
