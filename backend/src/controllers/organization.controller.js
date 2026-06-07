const commondb = require('../utils/commondb.utils');
const logModel = require('../models/log.model');
const emailService = require('../services/email.service');
const storageService = require('../services/storage.service');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { getIpAddress, cleanAndConvert, buildSearchCriteria } = require('../utils/request.utils');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const model = 'organization';
const IMAGE_FOLDER = 'organizations';
const DUMMY_FILE_NAME = 'NoLogo.png';
const IMAGE_PATH = path.join(__dirname, '../../public/images');

const validationOptions = {
  floatattrs: [],
  intattrs: [],
  dateattrs: ['addedon', 'createdon', 'expireon'],
  regxattrs: ['oname', 'city'],
};

const appsConfig = {
  'Company': {
    appname: 'Boilerplate',
    orgtype: 'Company',
    senderid: 'COMPAN',
    users: 'staffs',
    weblink: 'https://drrms.in/sntms/#/',
  }
};

/**
 * Send welcome / confirmation email
 */
const sendConfirmationMail = (obj) => {
  const otype = obj.otype || 'Company';
  const appConfig = appsConfig[otype] || appsConfig['Company'];

  const subject = `${appConfig.orgtype} Registration`;
  let html = `<p>Hi <strong> ${appConfig.orgtype} Admin</strong>,</p>`;
  html += `<p>Congratulations your ${appConfig.orgtype.toLowerCase()} <strong>${obj.oname}</strong> is now registered on ${appConfig.appname}.</p>`;
  html += `<p>With reference to your registration , the ${appConfig.orgtype.toLowerCase()} code given below.</p>`;
  html += `<p>${appConfig.orgtype} Code:</p>`;
  html += `<h2>${obj.ocode}</h2>`;
  html += `<p>To get started, invite ${appConfig.users} to your ${appConfig.appname} account using the above mentioned ${appConfig.orgtype.toLowerCase()} code.</p>`;
  html += `<p>It is an auto-generated e-mail. Hence do not reply.</p>`;
  html += `<br><br>`;
  html += `<p>Thanks & Regards,</p>`;
  html += `<p>${appConfig.appname} Admin</p>`;

  emailService.sendEmail({
    to: obj.email,
    subject: subject,
    html: html,
    fromName: appConfig.appname
  }).catch(err => {
    console.error('Failed to send registration confirmation mail:', err);
  });
};

/**
 * Create Organization
 */
const create = async (req, res) => {
  try {
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);

    if (!obj.oname) {
      return errorResponse(res, 'Required attributes missing: oname', 400);
    }

    obj.addedon = obj.addedon || new Date();
    obj.createdon = obj.createdon || new Date();
    if (!obj.status) obj.status = 'Active';

    if (!obj.expireon) {
      obj.expireon = moment(obj.createdon).add(1, 'year').endOf('day').toDate();
    }

    const userid = req.user ? req.user.userid : 'Guest';
    obj.addedby = userid;

    // Auto-generate Ocode
    let ocode = '';
    let criteria = {};
    if (!obj.ocode) {
      const storenameSplitted = obj.oname.split(' ');
      for (let i = 0; i < storenameSplitted.length; i++) {
        if (storenameSplitted[i]) {
          ocode += storenameSplitted[i].toLowerCase().charAt(0);
        }
      }
      criteria = { ocode: new RegExp('^' + ocode) };
    } else {
      ocode = obj.ocode;
      criteria = { ocode: ocode };
    }

    const organizations = await commondb.find(model, criteria, { ocode: 1, _id: 0 });
    if (organizations.length > 0) {
      let max = 0;
      for (let i = 0; i < organizations.length; i++) {
        const suffix = organizations[i].ocode.substring(ocode.length);
        const count = parseInt(suffix);
        if (!isNaN(count) && count > max) {
          max = count;
        }
      }
      max++;
      obj.ocode = ocode + max.toString();
    } else {
      obj.ocode = ocode;
    }

    const result = await commondb.insertOne(model, obj);

    // Welcome email
    if (result.email) {
      sendConfirmationMail(result);
    }

    // Log Action
    await logModel.insertLog({
      collection: model,
      userid: userid,
      type: 'Add',
      reference: obj.ocode,
      message: ' organization has been added',
      ipaddress,
    });

    return successResponse(res, 'Organization created successfully', result, 200);
  } catch (err) {
    console.error('Organization Create Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Update Organization
 */
const update = async (req, res) => {
  try {
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);
    const { _id, ...updateData } = obj;

    if (!_id) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const old = await commondb.findOne(model, { _id });
    if (!old) {
      return errorResponse(res, 'Record not found', 404);
    }

    const unset = {};
    let unsetCount = 0;
    let logmessage = '';

    for (let key in old) {
      if (old[key] !== undefined && old[key] !== null && old[key] !== '' && updateData[key] === '') {
        unset[key] = null;
        unsetCount++;
        delete updateData[key];
      } else if (JSON.stringify(old[key]) !== JSON.stringify(updateData[key])) {
        if (logmessage) logmessage += ', ';
        logmessage += key;
      }
    }

    let updateAttr = {
      $set: {
        ...updateData,
        lastupdatedon: new Date(),
        lastupdatedby: req.user ? req.user.userid : 'Guest'
      }
    };
    if (unsetCount > 0) {
      updateAttr.$unset = unset;
    }

    const result = await commondb.updateOne(model, { _id }, updateAttr);

    // Log Action
    await logModel.insertLog({
      collection: model,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Update',
      reference: old.ocode,
      message: `${logmessage ? logmessage + ' of ' : ''} organization has been updated`,
      ipaddress,
    });

    return successResponse(res, 'Organization updated successfully', result, 200);
  } catch (err) {
    console.error('Organization Update Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Delete Organization (Soft Delete)
 */
const deleteOrg = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const old = await commondb.findOne(model, { _id });
    if (!old) {
      return errorResponse(res, 'Record not found', 404);
    }

    const result = await commondb.updateOne(model, { _id }, { status: 'Removed' });

    // Log Action
    await logModel.insertLog({
      collection: model,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Delete',
      reference: old.ocode,
      message: ' organization has been removed',
      ipaddress,
    });

    return successResponse(res, 'Organization soft deleted successfully', { message: `${old.oname} organization has been successfully deleted` }, 200);
  } catch (err) {
    console.error('Organization Delete Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Permanently Remove Organization (Cascades across all collections)
 */
const remove = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const old = await commondb.findOne(model, { _id });
    if (!old) {
      return errorResponse(res, 'Record not found', 404);
    }

    // Guard: must be soft-deleted via /delete first (which enforced Delete Organization privilege)
    if (old.status !== 'Removed') {
      return errorResponse(res, 'Organization must be soft-deleted via /delete before permanent removal', 400);
    }


    const collInfos = await commondb.getCollections();
    for (let i = 0; i < collInfos.length; i++) {
      await commondb.deleteMany(collInfos[i].name, { ocode: old.ocode });
    }

    await logModel.insertLog({
      collection: model,
      userid: req.user ? req.user.userid : 'Guest',
      type: 'Delete',
      reference: old.ocode,
      message: 'organization has been permanently removed',
      ipaddress,
    });

    if (old.logo) {
      await storageService.deleteFile(IMAGE_FOLDER, old.logo).catch(e => {
        console.error('Failed to delete legacy logo from DO Spaces:', e);
      });
    }

    return successResponse(res, 'Organization permanently deleted', { message: `${old.oname} organization has been successfully deleted` }, 200);
  } catch (err) {
    console.error('Organization Permanent Delete Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Show Organization by ID
 */
const show = async (req, res) => {
  try {
    const result = await commondb.findOne(model, { _id: req.params.id });

    if (!result) {
      return errorResponse(res, 'Organization not found', 404);
    }

    return successResponse(res, 'Show completed successfully', result, 200);
  } catch (err) {
    console.error('Organization Show Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Show Organization by Code
 */
const showByCode = async (req, res) => {
  try {
    const result = await commondb.findOne(model, { ocode: req.params.ocode });

    if (!result) {
      return errorResponse(res, 'Organization not found', 404);
    }

    return successResponse(res, 'ShowByCode completed successfully', result, 200);
  } catch (err) {
    console.error('Organization ShowByCode Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Show All Organizations
 */
const showAll = async (req, res) => {
  try {
    const result = await commondb.find(model, { sort: { oname: 1 } });
    return successResponse(res, 'ShowAll completed successfully', result, 200);
  } catch (err) {
    console.error('Organization ShowAll Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Search Organizations
 */
const search = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.find(model, criteria);
    return successResponse(res, 'Search completed successfully', result, 200);
  } catch (err) {
    console.error('Organization Search Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Count Organizations
 */
const count = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.count(model, criteria);
    return successResponse(res, 'Count completed successfully', result, 200);
  } catch (err) {
    console.error('Organization Count Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Logo Image Upload to DO Space
 */
const upload = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return errorResponse(res, 'No logo file provided', 400);
    }
    const tempPath = req.files.file.path;
    const { _id } = req.body;
    const ext = path.extname(req.files.file.name);
    const name = `${moment().unix()}${ext}`;

    if (!_id) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const old = await commondb.findOne(model, { _id });
    if (!old) {
      return errorResponse(res, 'Organization not found', 404);
    }

    await storageService.uploadFile(tempPath, IMAGE_FOLDER, name);
    const result = await commondb.updateOne(model, { _id }, { logo: name });
    const responseObj = { ...result, value: name };

    if (old.logo) {
      await storageService.deleteFile(IMAGE_FOLDER, old.logo).catch(e => {
        console.error('Failed to delete old logo:', e);
      });
    }

    return successResponse(res, 'Logo uploaded successfully', responseObj, 200);
  } catch (err) {
    console.error('Organization Logo Upload Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

/**
 * Serve Logo Image
 */
const getLogo = async (req, res) => {
  try {
    const file = req.params.file;
    if (file === DUMMY_FILE_NAME) {
      const filePath = path.resolve(IMAGE_PATH, file);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath).pipe(res);
      }
      return errorResponse(res, 'Placeholder logo missing', 404);
    }

    try {
      const data = await storageService.getFile(IMAGE_FOLDER, file);
      res.setHeader('Content-Type', data.ContentType || 'image/png');
      return res.send(data.Body);
    } catch (s3Err) {
      const filePath = path.resolve(IMAGE_PATH, DUMMY_FILE_NAME);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath).pipe(res);
      }
      return errorResponse(res, 'Logo not found', 404);
    }
  } catch (err) {
    console.error('Organization Logo Serving Error:', err);
    return errorResponse(res, 'Internal Server Error', 500);
  }
};

/**
 * Distinct Aggregations
 */
const getCountries = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.distinct(model, criteria, 'country');
    return successResponse(res, 'Countries aggregate successfully', result, 200);
  } catch (err) {
    console.error('Organization Countries Distinct Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

const getStates = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.distinct(model, criteria, 'state');
    return successResponse(res, 'States aggregate successfully', result, 200);
  } catch (err) {
    console.error('Organization States Distinct Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

const getCities = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.distinct(model, criteria, 'city');
    return successResponse(res, 'Cities aggregate successfully', result, 200);
  } catch (err) {
    console.error('Organization Cities Distinct Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

const getZones = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { ...validationOptions, skipUserNameSearch: true });
    const result = await commondb.distinct(model, criteria, 'zone');
    return successResponse(res, 'Zones aggregate successfully', result, 200);
  } catch (err) {
    console.error('Organization Zones Distinct Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};

module.exports = {
  create,
  update,
  deleteOrg,
  remove,
  show,
  showByCode,
  showAll,
  search,
  count,
  upload,
  getLogo,
  getCountries,
  getStates,
  getCities,
  getZones,
};
