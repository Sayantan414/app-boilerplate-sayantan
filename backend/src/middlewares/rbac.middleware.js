const { errorResponse } = require('../utils/response.utils');

/**
 * Privilege-based access control middleware.
 * Checks req.user.privilege (embedded in JWT) for the required privilege string.
 * APPADMIN users carry the '*' sentinel and bypass all checks.
 * Usage: requirePrivilege('Add User')
 */
const requirePrivilege = (name) => (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.privilege)) {
    return errorResponse(res, 'Authentication required', 401);
  }
  if (req.user.privilege.includes('*')) return next();
  if (!req.user.privilege.includes(name)) {
    return errorResponse(res, `Forbidden: missing privilege "${name}"`, 403);
  }
  next();
};

/**
 * Tenant isolation middleware.
 * Ensures the caller can only act on records within their own organization.
 * APPADMIN ('*') is exempt.
 * @param {Function} getTargetOcode - async (req) => ocode string of the target record
 */
const requireSameOrg = (getTargetOcode) => async (req, res, next) => {
  try {
    if (req.user.privilege?.includes('*')) return next();
    const target = await getTargetOcode(req);
    if (!target) return errorResponse(res, 'Target not found', 404);
    if (req.user.ocode !== target) {
      return errorResponse(res, 'Forbidden: cross-organization access denied', 403);
    }
    next();
  } catch (err) {
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

module.exports = { requirePrivilege, requireSameOrg };
