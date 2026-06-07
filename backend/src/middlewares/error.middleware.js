const logger = require('../config/logger');
const { errorResponse } = require('../utils/response.utils');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let { status, message } = err;

  if (!status) status = 500;
  if (!message) message = 'Internal Server Error';

  // Log error
  logger.error(`${status} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (status === 500) {
    logger.error(err.stack);
  }

  errorResponse(res, message, status, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;
