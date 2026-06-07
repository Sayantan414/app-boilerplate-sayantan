const commondb = require('../utils/commondb.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { buildSearchCriteria } = require('../utils/request.utils');

const model = 'smslog';
const searchOptions = {
  dateRangeField: 'timestamp',
  skipUserNameSearch: true,
};

/**
 * Search SMS Logs
 */
const search = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, searchOptions);
    const result = await commondb.find(model, criteria, {});
    return successResponse(res, 'Search completed successfully', result, 200);
  } catch (err) {
    console.error('SMS Log Search Error:', err);
    return errorResponse(res, err.message || 'API error! Please try again.', 500);
  }
};

/**
 * Count SMS Logs
 */
const count = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, searchOptions);
    const result = await commondb.count(model, criteria);
    return successResponse(res, 'Count completed successfully', result, 200);
  } catch (err) {
    console.error('SMS Log Count Error:', err);
    return errorResponse(res, err.message || 'API error! Please try again.', 500);
  }
};

/**
 * Total SMS Usage Grouped by Ocode
 */
const totalUsage = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, searchOptions);
    const groupJson = { _id: '$ocode', total: { $sum: '$credit' } };
    const result = await commondb.groupOnly(model, criteria, groupJson);
    return successResponse(res, 'Total usage completed successfully', result, 200);
  } catch (err) {
    console.error('SMS Log TotalUsage Error:', err);
    return errorResponse(res, err.message || 'API error! Please try again.', 500);
  }
};

module.exports = {
  search,
  count,
  totalUsage,
};
