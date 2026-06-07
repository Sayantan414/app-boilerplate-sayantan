const Joi = require('joi');
const { errorResponse } = require('../utils/response.utils');

// Fields that are passed by the client for metadata/logging purposes
// but are not part of any Joi schema — pluck before validation, restore after.
const GLOBAL_PASSTHROUGH_FIELDS = ['apptype', 'ipaddress'];

/**
 * Joi Validation Middleware
 * @param {Object} schema Joi schema object containing body, query, and/or params
 */
const validate = (schema) => (req, res, next) => {
  if (!schema) {
    return next();
  }

  // Preserve metadata fields before Joi strips/rejects them
  const preserved = {};
  GLOBAL_PASSTHROUGH_FIELDS.forEach((field) => {
    if (req.body && req.body[field] !== undefined) {
      preserved[field] = req.body[field];
      delete req.body[field];
    }
  });

  const validSchema = ['body', 'query', 'params'].reduce((acc, key) => {
    if (schema[key]) {
      acc[key] = schema[key];
    }
    return acc;
  }, {});

  const object = ['body', 'query', 'params'].reduce((acc, key) => {
    if (validSchema[key]) {
      acc[key] = req[key];
    }
    return acc;
  }, {});

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errors = error.details.map((detail) => {
      const path = detail.path || [];
      const field = path[0] === 'body' || path[0] === 'query' || path[0] === 'params'
        ? path.slice(1).join('.')
        : path.join('.');

      return {
        field,
        message: detail.message.replace(/['"]/g, '').replace(/^(body|query|params)\./, ''),
        type: detail.type,
      };
    });
    const message = errors.map((detail) => detail.message).join(', ');
    return errorResponse(res, message, 400, errors);
  }

  Object.assign(req, value);

  // Restore metadata fields so controllers can read them
  if (req.body) {
    Object.assign(req.body, preserved);
  }

  return next();
};

module.exports = validate;
