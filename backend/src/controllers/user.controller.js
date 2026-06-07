const path = require('path');
const fs = require('fs');
const moment = require('moment');

const commondb = require('../utils/commondb.utils');
const logModel = require('../models/log.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { getIpAddress, cleanAndConvert, buildSearchCriteria } = require('../utils/request.utils');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const passwordUtils = require('../utils/password.utils');
const storageService = require('../services/storage.service');
const logger = require('../config/logger');

const defaultRoles = require('../config/defaultroles.json');

const IMAGE_PATH = path.resolve(__dirname, '../../public/images');
const IMAGE_FOLDER = 'users';
const DUMMY_FILE_NAME = 'nouser.png';

const modelName = 'user';
const validationOptions = {
  regxattrs: ['firstname', 'lastname', 'userid', 'mobile', 'empno', 'dept_name'],
  dateattrs: ['addedon', 'lastupdatedon'],
};

const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_TOKEN_LIMIT = isProduction ? -3 : -50;

// COOKIE_SECURE is independent of NODE_ENV.
// Set COOKIE_SECURE=true whenever the API is served over HTTPS and accessed cross-origin
// (e.g. a dev API deployed behind a reverse proxy with HTTPS).
// Without this, SameSite=Lax cookies will be blocked on cross-origin POST requests.
const isCookieSecure = process.env.COOKIE_SECURE === 'true' || isProduction;

// Standard cookie options for refresh token
const cookieOptions = {
  httpOnly: true,
  secure: isCookieSecure,
  sameSite: isCookieSecure ? 'None' : 'Lax', // 'None' required for cross-origin (must pair with secure:true)
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// clearCookie needs matching options (no maxAge)
const clearCookieOptions = {
  httpOnly: true,
  secure: isCookieSecure,
  sameSite: isCookieSecure ? 'None' : 'Lax',
  path: '/',
};

/**
 * Attach privileges to user from custom role (DB) or default role (JSON).
 * APPADMIN gets the '*' superuser sentinel.
 */
const attachPrivileges = async (user) => {
  // 1. Search in defaultroles.json
  const defaultRole = defaultRoles.find(r => r.name === user.role);
  if (defaultRole) {
    user.privilege = defaultRole.privilege || [];
    return user;
  }

  // 2. If not found in defaultroles, search in custom roles in DB
  if (user.ocode) {
    const customRole = await commondb.findOne('role', { ocode: user.ocode, name: user.role });
    if (customRole && Array.isArray(customRole.privilege)) {
      user.privilege = customRole.privilege;
      return user;
    }
  }

  // Fallback
  user.privilege = [];
  return user;
};

/**
 * Register/Create a new user
 */
const create = async (req, res) => {
  try {
    const apptype = req.body.apptype;
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);

    // Generate userid based on firstname and lastname
    let uid = '';
    if (obj.lastname) {
      if (obj.lastname.indexOf(' ') !== -1) {
        const splitted = obj.lastname.split(' ');
        uid = obj.firstname.trim().charAt(0).toLowerCase();
        for (let i = 0; i < splitted.length; i++) {
          uid += splitted[i].toLowerCase();
        }
      } else {
        uid = obj.firstname.trim().charAt(0).toLowerCase() + obj.lastname.trim().toLowerCase();
      }
    } else {
      uid = obj.firstname.trim().toLowerCase();
    }

    const criteria = { userid: new RegExp('^' + uid) };
    const lastUsers = await commondb.find(modelName, criteria, { userid: 1, _id: 0 });

    if (lastUsers && lastUsers.length > 0) {
      let max = 0;
      for (let i = 0; i < lastUsers.length; i++) {
        const suffix = lastUsers[i].userid.substring(uid.length);
        const count = parseInt(suffix);
        if (!isNaN(count) && count > max) {
          max = count;
        }
      }
      max++;
      obj.userid = uid + max.toString();
    } else {
      obj.userid = uid;
    }

    // Check duplicate mobile
    if (obj.mobile) {
      const existingUserByMobile = await commondb.findOne(modelName, { mobile: obj.mobile });
      if (existingUserByMobile) {
        return errorResponse(res, 'User already exists with this mobile number', 400);
      }
    }

    // Set default status
    if (!obj.status) obj.status = 'Active';

    // Default role assignment
    if (!obj.role) {
      obj.role = obj.ocode ? 'USER' : 'APPADMIN';
    }

    // Validate role exists — either as a custom role in DB or a default in JSON
    if (obj.ocode) {
      const customRole = await commondb.findOne('role', { ocode: obj.ocode, name: obj.role });
      const isDefault = defaultRoles.some(r =>
        r.name === obj.role && r.name !== 'APPADMIN' && r.name !== 'APPUSER'
      );
      if (!customRole && !isDefault) {
        return errorResponse(res, `Role "${obj.role}" does not exist for this organization`, 400);
      }
    } else {
      const isGlobal = defaultRoles.some(r =>
        r.name === obj.role && (r.name === 'APPADMIN' || r.name === 'APPUSER')
      );
      if (!isGlobal) {
        return errorResponse(res, `Role "${obj.role}" is not a valid app-level role`, 400);
      }
    }

    // Tenant isolation: non-APPADMIN can only create users in their own org
    if (req.user && req.user.ocode && req.user.ocode !== obj.ocode) {
      return errorResponse(res, 'Forbidden: cannot create users in other organizations', 403);
    }

    // Hash password
    const hashedPassword = await passwordUtils.hashPassword(obj.password);

    const user = await commondb.insertOne(modelName, {
      ...obj,
      password: hashedPassword,
      notificationid: [],
      addedon: new Date(),
      addedby: req.user ? req.user.userid : 'Guest',
    });

    // Log action
    await logModel.insertLog({
      collection: modelName,
      ocode: obj.ocode,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Add',
      reference: obj.userid,
      message: 'user has been added',
      apptype,
      ipaddress,
    });

    delete user.password;
    return successResponse(res, 'User created successfully', user, 201);
  } catch (error) {
    logger.error('Create User Error:', error);
    return errorResponse(res, error.message || 'Error creating user', 500);
  }
};

/**
 * Update user
 */
const update = async (req, res) => {
  try {
    const apptype = req.body.apptype;
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);
    const { _id, ...updateData } = obj;

    if (!_id) return errorResponse(res, '_id is required', 400);

    const result = await commondb.updateOne(modelName, { _id }, {
      $set: {
        ...updateData,
        lastupdatedon: new Date(),
        lastupdatedby: req.user ? req.user.userid : 'Guest',
      }
    });

    await logModel.insertLog({
      collection: modelName,
      ocode: obj.ocode,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Update',
      reference: obj.userid,
      message: 'user has been updated',
      apptype,
      ipaddress,
    });

    const updatedUser = await commondb.findOne(modelName, { _id }, { password: 0 });
    return successResponse(res, 'User updated successfully', updatedUser);
  } catch (error) {
    logger.error('Update User Error:', error);
    return errorResponse(res, error.message || 'Error updating user', 500);
  }
};

/**
 * Delete user
 */
const remove = async (req, res) => {
  try {
    const { _id, ocode, userid, apptype } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) return errorResponse(res, 'User ID is required', 400);

    const result = await commondb.deleteOne(modelName, { _id });

    await logModel.insertLog({
      collection: modelName,
      ocode: ocode,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Delete',
      reference: userid,
      message: 'user has been removed',
      apptype,
      ipaddress,
    });

    return successResponse(res, 'User deleted successfully', result);
  } catch (error) {
    logger.error('Delete User Error:', error);
    return errorResponse(res, error.message || 'Error deleting user', 500);
  }
};

/**
 * Search users
 */
const search = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, validationOptions);
    const result = await commondb.find(modelName, criteria, { refreshTokens: 0, password: 0 });
    return successResponse(res, 'Users fetched successfully', result);
  } catch (error) {
    logger.error('Search User Error:', error);
    return errorResponse(res, 'Error searching users', 500);
  }
};

/**
 * Count users
 */
const count = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, validationOptions);
    const result = await commondb.count(modelName, criteria);
    return successResponse(res, 'Count fetched successfully', result);
  } catch (error) {
    logger.error('Count User Error:', error);
    return errorResponse(res, 'Error counting users', 500);
  }
};

/**
 * Get current user profile (Me)
 */
const getMe = async (req, res) => {
  try {
    const user = await commondb.findOne(modelName, { _id: req.user.id });
    if (!user) return errorResponse(res, 'User not found', 404);
    delete user.password;
    delete user.refreshTokens;

    await attachPrivileges(user);

    let features = [];
    if (user.ocode) {
      const org = await commondb.findOne('organization', { ocode: user.ocode });
      if (org && Array.isArray(org.features)) {
        features = org.features;
      }
    }

    return successResponse(res, 'Profile fetched successfully', { ...user, features });
  } catch (error) {
    return errorResponse(res, 'Error fetching profile', 500);
  }
};

/**
 * Show user by ID
 */
const show = async (req, res) => {
  try {
    const result = await commondb.findOne(modelName, { _id: req.params.id });
    if (!result) return errorResponse(res, 'User not found', 404);
    delete result.password;
    delete result.refreshTokens;
    return successResponse(res, 'User fetched successfully', result);
  } catch (error) {
    return errorResponse(res, 'Error fetching user', 500);
  }
};

const showUser = async (req, res) => {
  try {
    const result = await commondb.findOne(modelName, { email: req.params.id });
    if (!result) return errorResponse(res, 'User not found', 404);
    delete result.password;
    delete result.refreshTokens;
    return successResponse(res, 'User fetched successfully', result);
  } catch (error) {
    return errorResponse(res, 'Error fetching user', 500);
  }
};

/**
 * Login/Signin
 */
const signin = async (req, res) => {
  try {
    const { userid, password } = req.body;
    if (typeof userid !== 'string' || typeof password !== 'string') {
      return errorResponse(res, 'Invalid credentials', 400);
    }
    const ipaddress = getIpAddress(req);

    const user = await commondb.findOne(modelName, {
      $or: [{ userid }, { email: userid }, { mobile: userid }]
    });

    if (!user || !(await passwordUtils.comparePassword(password, user.password))) {
      return errorResponse(res, 'The userid or password you entered is incorrect', 401);
    }

    if (user.status === 'Inactive') {
      return errorResponse(res, 'This account is not active. Please contact your administrator', 403);
    }

    await attachPrivileges(user);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in array (multi-device support)
    await commondb.updateOne(modelName, { _id: user._id }, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: REFRESH_TOKEN_LIMIT } },
      $set: { lastupdatedon: new Date() }
    });

    await logModel.insertLog({
      collection: modelName,
      ocode: user.ocode,
      userid: user.userid,
      type: 'Sign in',
      reference: user.userid,
      message: 'has been signed in',
      ipaddress,
    });

    delete user.password;
    delete user.refreshTokens;

    let features = [];
    if (user.ocode) {
      const org = await commondb.findOne('organization', { ocode: user.ocode });
      if (org && Array.isArray(org.features)) {
        features = org.features;
      }
    }

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return successResponse(res, 'Login successful', { ...user, accessToken, features });
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Error during login', 500);
  }
};

/**
 * Logout/Signout
 */
const signout = async (req, res) => {
  try {
    const { userid, ocode } = req.user;
    const ipaddress = getIpAddress(req);

    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await commondb.updateOne(modelName, { _id: req.user.id }, {
        $pull: { refreshTokens: refreshToken },
        $set: { lastupdatedon: new Date() }
      });
    }

    await logModel.insertLog({
      collection: modelName,
      ocode,
      userid,
      type: 'Sign out',
      reference: userid,
      message: 'has been signed out',
      ipaddress,
    });

    res.clearCookie('refreshToken', clearCookieOptions);
    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 'Error during logout', 500);
  }
};

/**
 * Update Password (admin sets a specific password for a user)
 * Requires 'Reset Password' privilege. Tenant-isolated.
 */
const updatePassword = async (req, res) => {
  try {
    const { _id, password } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id || !password) return errorResponse(res, 'Invalid input', 400);

    const target = await commondb.findOne(modelName, { _id });
    if (!target) return errorResponse(res, 'User not found', 404);

    // Tenant isolation (APPADMIN bypass via '*' sentinel)
    if (!req.user.privilege?.includes('*') && req.user.ocode !== target.ocode) {
      return errorResponse(res, 'Forbidden: cross-organization access denied', 403);
    }

    const hashedPassword = await passwordUtils.hashPassword(password);
    await commondb.updateOne(modelName, { _id }, {
      $set: { password: hashedPassword, onetime: false, lastupdatedon: new Date() }
    });

    await logModel.insertLog({
      collection: modelName,
      ocode: target.ocode,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Update',
      reference: target.userid,
      message: 'password has been updated by admin',
      ipaddress,
    });

    return successResponse(res, 'Password updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error updating password', 500);
  }
};

/**
 * Reset Password (self-service OTP reset)
 * Caller can only reset their own password.
 * Generates a 6-digit OTP, stores it hashed with onetime: true,
 * and sends it to the user via email and SMS.
 */
const resetPassword = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) return errorResponse(res, 'User ID is required', 400);

    const target = await commondb.findOne(modelName, { _id });
    if (!target) return errorResponse(res, 'User not found', 404);

    const newPassword = passwordUtils.generateOTP();
    const hashed = await passwordUtils.hashPassword(newPassword);

    await commondb.updateOne(modelName, { _id }, {
      $set: { password: hashed, onetime: true, lastupdatedon: new Date(), refreshTokens: [] },
    });

    if (target.email) {
      emailService.sendEmail({
        to: target.email,
        subject: 'Your password has been reset',
        html: `<p>Hi ${target.firstname},</p>
               <p>Your password has been reset. Your temporary password is:</p>
               <h2>${newPassword}</h2>
               <p>You will be asked to change it on next sign-in.</p>`,
      }).catch(e => logger.error('Reset email failed', e));
    }
    if (target.mobile) {
      smsService.sendByMvayoo({
        mobile: target.mobile,
        message: `Your temporary password: ${newPassword}. Please change it on next sign-in.`,
        ocode: target.ocode,
        userid: target.userid,
      }).catch(e => logger.error('Reset SMS failed', e));
    }

    await logModel.insertLog({
      collection: modelName,
      ocode: target.ocode,
      userid: target.userid,
      type: 'Update',
      reference: target.userid,
      message: 'password has been reset (self-service)',
      ipaddress,
    });

    return successResponse(res, 'Password reset; temporary password sent via email/SMS');
  } catch (error) {
    logger.error('Reset Password Error:', error);
    return errorResponse(res, 'Error resetting password', 500);
  }
};

/**
 * Refresh Token
 */
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return errorResponse(res, 'Refresh token not found', 401);

    const decoded = verifyRefreshToken(token);
    // Find user who has this specific token in their array
    const user = await commondb.findOne(modelName, { _id: decoded.id, refreshTokens: token });

    if (!user) return errorResponse(res, 'Invalid refresh token', 403);

    // Token Rotation: Generate new tokens and swap the old one in the array
    await attachPrivileges(user);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Remove old token and add the new one
    await commondb.updateOne(modelName, { _id: user._id }, {
      $pull: { refreshTokens: token }
    });
    await commondb.updateOne(modelName, { _id: user._id }, {
      $push: { refreshTokens: { $each: [newRefreshToken], $slice: REFRESH_TOKEN_LIMIT } }
    });

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return successResponse(res, 'Token refreshed successfully', { accessToken: newAccessToken });
  } catch (error) {
    logger.error('Refresh Token Error:', error);
    return errorResponse(res, 'Invalid or expired refresh token', 403);
  }
};

/**
 * Upload Profile Picture
 * POST /upload  (multipart/form-data)
 * Body: file (the image), _id (user's ObjectId string)
 * Requires auth.
 */
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return errorResponse(res, 'No file provided', 400);
    }

    const { _id } = req.body;
    if (!_id) return errorResponse(res, 'User _id is required', 400);

    const tempPath = req.files.file.path;
    const originalName = req.files.file.name || '';
    const ext = originalName.substring(originalName.lastIndexOf('.')) || '.jpg';
    const fileName = moment().unix() + ext;

    // Upload new file to cloud storage
    const uploadData = await storageService.uploadFile(tempPath, IMAGE_FOLDER, fileName);

    // Fetch the existing user to grab old image name
    const old = await commondb.findOne(modelName, { _id });
    if (!old) return errorResponse(res, 'User not found', 404);

    // Update user document with new image filename
    await commondb.updateOne(modelName, { _id }, { $set: { image: uploadData.fileName } });

    // Delete old image from storage (fire-and-forget)
    if (old.image) {
      storageService.deleteFile(IMAGE_FOLDER, old.image)
        .then(() => logger.info(`Old profile pic deleted: ${old.image}`))
        .catch(e => logger.error('Failed to delete old profile pic', e));
    }

    return successResponse(res, 'Profile picture uploaded successfully', { image: uploadData.fileName });
  } catch (error) {
    logger.error('Upload Profile Pic Error:', error);
    return errorResponse(res, error.message || 'Error uploading profile picture', 500);
  }
};

/**
 * Get Profile Picture
 * GET /profilePic/:file
 * Public — no auth required. Falls back to nouser.png on any error.
 */
const getProfilePic = async (req, res) => {
  const file = req.params.file;

  // Always serve the local dummy file directly
  if (file === DUMMY_FILE_NAME) {
    const filePath = path.resolve(IMAGE_PATH, DUMMY_FILE_NAME);
    return fs.createReadStream(filePath).pipe(res);
  }

  try {
    const data = await storageService.getFile(IMAGE_FOLDER, file);
    res.send(data.Body);
  } catch (error) {
    // Fallback to the local dummy image if cloud retrieval fails
    logger.warn(`Profile pic not found in storage (${file}), serving fallback`);
    const filePath = path.resolve(IMAGE_PATH, DUMMY_FILE_NAME);
    fs.createReadStream(filePath).pipe(res);
  }
};

module.exports = {
  create,
  update,
  remove,
  search,
  count,
  show,
  getMe,
  signin,
  signout,
  refreshToken,
  updatePassword,
  resetPassword,
  showUser,
  uploadProfilePic,
  getProfilePic,
};
