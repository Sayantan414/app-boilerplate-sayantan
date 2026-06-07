const moment = require('moment');

/**
 * Recursively strip MongoDB operator keys ($-prefixed) and dot-notation keys
 * from a request payload to prevent NoSQL operator injection.
 */
const sanitizeOperators = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeOperators);
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      cleaned[key] = sanitizeOperators(value[key]);
    }
    return cleaned;
  }
  return value;
};

/**
 * Get IP address from request
 */
const getIpAddress = (req) => {
  return (req.headers['x-forwarded-for'] || '').split(',').pop() ||
    req.remoteAddress ||
    req.socket.remoteAddress ||
    '0.0.0.0';
};

/**
 * Clean and convert object attributes
 */
const cleanAndConvert = (obj, options = {}) => {
  const { floatattrs = [], intattrs = [], dateattrs = [] } = options;
  const newObj = sanitizeOperators({ ...obj });

  // Remove apptype and ipaddress if present as they are metadata
  delete newObj.apptype;
  if (!options.keepIp) delete newObj.ipaddress;

  // Type conversions
  floatattrs.forEach(attr => {
    if (newObj[attr]) newObj[attr] = parseFloat(newObj[attr]);
  });

  intattrs.forEach(attr => {
    if (newObj[attr]) newObj[attr] = parseInt(newObj[attr]);
  });

  dateattrs.forEach(attr => {
    if (newObj[attr]) {
      newObj[attr] = new Date(newObj[attr]);
    }
  });

  // Trim strings and remove empty/null fields
  for (const key in newObj) {
    if (typeof newObj[key] === 'string') {
      newObj[key] = newObj[key].trim();
      if (newObj[key] === '' && key !== '_id') {
        delete newObj[key];
      }
    } else if (newObj[key] === null || newObj[key] === undefined) {
      delete newObj[key];
    }
  }

  return newObj;
};

/**
 * Build search criteria from request body
 */
const buildSearchCriteria = (obj, options = {}) => {
  obj = obj || {};
  const { regxattrs = [], dateRangeField } = options;
  const criteria = cleanAndConvert(obj, options);

  // Handle Regex
  regxattrs.forEach(attr => {
    if (criteria[attr]) {
      criteria[attr] = new RegExp('^' + criteria[attr], 'i');
    }
  });

  // Handle special 'name' search (firstname OR lastname)
  if (obj.name && !options.skipUserNameSearch) {
    criteria['$or'] = [
      { firstname: new RegExp('^' + obj.name, 'i') },
      { lastname: new RegExp('^' + obj.name, 'i') }
    ];
    delete criteria.name;
  }

  // Handle array of ocodes
  if (obj.ocodes) {
    criteria.ocode = { $in: obj.ocodes };
    delete criteria.ocodes;
  }

  // Handle date ranges
  if (obj.start && obj.end) {
    const start = moment(obj.start).startOf('day').toDate();
    const end = moment(obj.end).endOf('day').toDate();
    
    if (obj.date) {
      if (obj.date === 'Create') {
        criteria.addedon = { $gte: start, $lte: end };
      } else if (obj.date === 'Update') {
        criteria.lastupdatedon = { $gte: start, $lte: end };
      } else if (obj.date === 'Registration') {
        criteria.createdon = { $gte: start, $lte: end };
      } else if (obj.date === 'Expairy' || obj.date === 'Expiry') {
        criteria.expireon = { $gte: start, $lte: end };
      }
      delete criteria.date;
    } else if (dateRangeField) {
      criteria[dateRangeField] = { $gte: start, $lte: end };
    } else {
      criteria.addedon = { $gte: start, $lte: end };
    }
    
    delete criteria.start;
    delete criteria.end;
  }

  return criteria;
};

module.exports = {
  getIpAddress,
  cleanAndConvert,
  buildSearchCriteria,
};
