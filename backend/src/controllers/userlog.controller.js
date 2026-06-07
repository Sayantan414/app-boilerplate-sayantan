const commondb = require('../utils/commondb.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { buildSearchCriteria } = require('../utils/request.utils');

const model = 'userlog';
const searchOptions = {
  dateRangeField: 'timestamp',
  regxattrs: ['userid'],
  skipUserNameSearch: true,
};

/**
 * Search User Audit Logs
 */
const search = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, searchOptions);
    const result = await commondb.find(model, criteria, {}, { timestamp: -1 });
    
    const userids = [];
    result.forEach((logItem) => {
      if (logItem.userid && userids.indexOf(logItem.userid) === -1) {
        userids.push(logItem.userid);
      }
      
      const baseMsg = logItem.message || '';
      if (logItem.type === 'Delete') {
        logItem.message = baseMsg + ' from';
      } else {
        logItem.message = baseMsg + ' in';
      }
      
      logItem.message += ' collection ' + (logItem.collection || '');
      if (logItem.reference) {
        logItem.message += ' with reference ' + logItem.reference;
      }
    });

    // Populate user profile info
    if (userids.length > 0) {
      const userCriteria = {
        $or: [
          { userid: { $in: userids } },
          { mobile: { $in: userids } },
          { email: { $in: userids } }
        ]
      };
      
      const users = await commondb.find('user', userCriteria, {
        userid: 1,
        email: 1,
        mobile: 1,
        gender: 1,
        firstname: 1,
        lastname: 1,
        image: 1,
        _id: 0
      });

      result.forEach((logItem) => {
        let idx = users.findIndex(u => u.userid === logItem.userid);
        if (idx === -1) {
          idx = users.findIndex(u => u.email === logItem.userid);
        }
        if (idx === -1) {
          idx = users.findIndex(u => u.mobile === logItem.userid);
        }

        if (idx >= 0) {
          logItem.firstname = users[idx].firstname;
          logItem.lastname = users[idx].lastname;
          logItem.image = users[idx].image;
          logItem.gender = users[idx].gender;
        } else {
          logItem.firstname = 'No';
          logItem.lastname = 'Name';
        }
      });
    }

    return successResponse(res, 'Search completed successfully', result, 200);
  } catch (err) {
    console.error('User Log Search Error:', err);
    return errorResponse(res, err.message || 'API error! Please try again.', 500);
  }
};

/**
 * Count User Audit Logs
 */
const count = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, searchOptions);
    const result = await commondb.count(model, criteria);
    return successResponse(res, 'Count completed successfully', result, 200);
  } catch (err) {
    console.error('User Log Count Error:', err);
    return errorResponse(res, err.message || 'API error! Please try again.', 500);
  }
};

module.exports = {
  search,
  count,
};
