const request = require('superagent');
const config = require('../config/config');
const logger = require('../config/logger');
const logModel = require('../models/log.model');

/**
 * Send SMS via Mvayoo
 * @param {Object} options { mobile, message, ocode, userid }
 * @param {string} templatePrefix 
 */
const sendByMvayoo = async (options, templatePrefix = '') => {
  const { mobile, message, ocode, userid } = options;
  const fullMessage = templatePrefix + message;
  const { user, pass, sender } = config.sms.mvayoo;

  const url = `http://api.mVaayoo.com/mvaayooapi/MessageCompose?user=${user}:${pass}&senderID=${sender}&receipientno=${mobile}&msgtxt=${encodeURIComponent(fullMessage)}&state=4`;

  try {
    const res = await request.get(url);
    logger.info(`SMS sent to ${mobile} via Mvayoo`);
    
    // Optional: Log to DB
    await logModel.insertLog({
      collection: 'smslog',
      ocode,
      userid,
      mobile,
      message: fullMessage,
      gateway: 'Mvayoo',
      status: 'Sent'
    });

    return res.body;
  } catch (error) {
    logger.error(`Failed to send SMS to ${mobile} via Mvayoo`, error);
    throw error;
  }
};

/**
 * Send SMS via Bizztel
 */
const sendByBizztel = async (options, templatePrefix = '') => {
  const { mobile, message, ocode, userid } = options;
  const fullMessage = templatePrefix + message;
  const { user, pass, sender } = config.sms.bizztel;

  try {
    const res = await request
      .get('http://www.bizztel.com/composeapi')
      .query({ userid: user, pwd: pass, route: 2, senderid: sender, destination: mobile, message: fullMessage });

    logger.info(`SMS sent to ${mobile} via Bizztel`);
    return res.body;
  } catch (error) {
    logger.error(`Failed to send SMS to ${mobile} via Bizztel`, error);
    throw error;
  }
};

module.exports = {
  sendByMvayoo,
  sendByBizztel,
};
