/**
 * Standard API response formatter
 */
// const successResponse = (res, message, data = {}, status = 200) => {
//   return res.status(status).json(data);
// };
const successResponse = (res, message, data, status = 200) => {
  const response = { success: true, message };
  if (data !== undefined && data !== null) {
    response.data = data;
  }
  return res.status(status).json(response);
};

const errorResponse = (res, message, status = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(status).json(response);
};

const parseMongoValidationDetails = (details) => {
  const errors = [];

  const addError = (field, message, value) => {
    if (!field) return;
    errors.push({
      field,
      message: message || `Invalid value for ${field}`,
      ...(value !== undefined ? { value } : {}),
    });
  };

  const walk = (node, parentField = '') => {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, parentField));
      return;
    }

    if (Array.isArray(node.missingProperties)) {
      node.missingProperties.forEach((field) => {
        addError(field, `${field} is required`);
      });
    }

    const field = node.propertyName || parentField;
    if (field && node.reason) {
      addError(field, node.reason, node.consideredValue);
    }

    [
      'schemaRulesNotSatisfied',
      'propertiesNotSatisfied',
      'itemsNotSatisfied',
      'details',
    ].forEach((key) => {
      if (node[key]) walk(node[key], field);
    });
  };

  walk(details);
  return errors;
};

const parseDuplicateFieldsFromMessage = (message = '') => {
  const duplicateKeyMatch = message.match(/dup key:\s*\{\s*(.*?)\s*\}/i);
  if (!duplicateKeyMatch) return [];

  return duplicateKeyMatch[1]
    .split(',')
    .map((pair) => pair.split(':')[0].trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
};

const getDbErrorDetails = (err) => {
  if (!err) {
    return {
      status: 500,
      message: 'Database error! Please try again.',
      errors: null,
    };
  }

  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const fallbackFields = fields.length ? fields : parseDuplicateFieldsFromMessage(err.message);
    return {
      status: 400,
      message: 'Duplicate value found.',
      errors: fallbackFields.map((field) => ({
        field,
        message: `${field} already exists`,
        ...(err.keyValue && err.keyValue[field] !== undefined ? { value: err.keyValue[field] } : {}),
      })),
    };
  }

  if (err.code === 121 || err.codeName === 'DocumentValidationFailure') {
    const errors = parseMongoValidationDetails(err.errInfo && err.errInfo.details);
    return {
      status: 400,
      message: 'Database validation failed.',
      errors: errors.length ? errors : null,
    };
  }

  return {
    status: 500,
    message: 'Database error! Please try again.',
    errors: null,
  };
};

const dbErrorResponse = (res, err) => {
  const { status, message, errors } = getDbErrorDetails(err);
  return errorResponse(res, message, status, errors);
};

module.exports = {
  successResponse,
  errorResponse,
  dbErrorResponse,
  getDbErrorDetails,
};
