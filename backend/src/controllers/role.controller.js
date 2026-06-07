const commondb = require('../utils/commondb.utils');
const logModel = require('../models/log.model');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { getIpAddress, cleanAndConvert, buildSearchCriteria } = require('../utils/request.utils');
const defaultRoles = require('../config/defaultroles.json');

const model = 'role';
const dmodels = ['user'];
const validationOptions = {
  dateattrs: ['addedon', 'lastupdatedon'],
};

/**
 * Create Role
 */
const create = async (req, res) => {
  try {
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);

    if (!obj.ocode || !obj.name) {
      return errorResponse(res, 'Required attributes missing: ocode, name', 400);
    }

    // --- Check against defaultroles.json ---
    const isDefaultRole = defaultRoles.some(r => r.name.toLowerCase() === obj.name.toLowerCase());
    if (isDefaultRole) {
      return errorResponse(res, "Insertion failed! Cannot create a custom role with a default role name.", 400);
    }

    // --- Duplicate Check (ocode + name) ---
    const criteria = {
      ocode: obj.ocode,
      name: new RegExp("^" + obj.name + "$", "i"),
    };
    const duplicates = await commondb.find(model, criteria, { name: 1, _id: 0 });

    if (duplicates.length > 0) {
      return errorResponse(res, "Insertion failed! This role name already exists.", 400);
    }

    obj.addedon = obj.addedon || new Date();
    obj.addedby = req.user ? req.user.userid : 'GUEST';
    if (!Array.isArray(obj.privilege)) obj.privilege = [];

    const result = await commondb.insertOne(model, obj);

    // --- Log Entry ---
    await logModel.insertLog({
      collection: model,
      ocode: obj.ocode,
      userid: obj.addedby,
      type: "Add",
      reference: obj.name,
      message: "Role has been added.",
      ipaddress,
    });

    return successResponse(res, 'Role created successfully', result, 200);
  } catch (err) {
    console.error("Role Create Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Update Role
 */
const update = async (req, res) => {
  let session;
  try {
    const obj = cleanAndConvert(req.body, validationOptions);
    const ipaddress = getIpAddress(req);
    const { _id, ...updateData } = obj;

    if (!_id) {
      return errorResponse(res, "Invalid record ID", 400);
    }

    // --- Duplicate Role Name Check (ocode + name) ---
    if (obj.name) {
      // --- Check against defaultroles.json ---
      const isDefaultRole = defaultRoles.some(r => r.name.toLowerCase() === obj.name.toLowerCase());
      if (isDefaultRole) {
        return errorResponse(res, "Update failed! Cannot rename a custom role to a default role name.", 400);
      }

      const dupCriteria = { ocode: obj.ocode, _id: { $ne: _id } };
      dupCriteria.name = new RegExp("^" + obj.name + "$", "i");

      const duplicates = await commondb.find(model, dupCriteria, { name: 1, _id: 0 });
      if (duplicates.length > 0) {
        return errorResponse(res, "Update failed! This role name already exists.", 400);
      }
    }

    // --- Start DB Transaction ---
    session = await commondb.startTransaction();

    const old = await commondb.findOne(model, { _id }, {}, session);
    if (!old) {
      await commondb.abortTransaction(session);
      return errorResponse(res, "Record not found.", 404);
    }

    // --- Compare Old vs New Values ---
    const unset = {};
    let unsetCount = 0;
    let logmessage = "";

    for (let key in old) {
      if (old[key] !== undefined && old[key] !== null && old[key] !== "" && updateData[key] === "") {
        unset[key] = null;
        unsetCount++;
        delete updateData[key];
      } else if (JSON.stringify(old[key]) !== JSON.stringify(updateData[key])) {
        if (logmessage) logmessage += ", ";
        logmessage += key;
      }
    }

    let updateattr = {
      $set: {
        ...updateData,
        lastupdatedon: new Date(),
        lastupdatedby: req.user ? req.user.userid : 'GUEST'
      }
    };
    if (unsetCount > 0) {
      updateattr.$unset = unset;
    }

    const result = await commondb.updateOne(model, { _id }, updateattr, session);

    // --- Cascade updates to dependent collections ---
    for (const dmodel of dmodels) {
      const dcriteria = { role: old.name, ocode: obj.ocode };
      const dresult = await commondb.find(dmodel, dcriteria, { role: 1, _id: 0 }, {}, session);

      if (dresult.length > 0) {
        for (const record of dresult) {
          await commondb.updateOne(
            dmodel,
            { role: record.role, ocode: obj.ocode },
            { $set: { role: obj.name } },
            session
          );
        }
      }
    }

    await commondb.commitTransaction(session);

    // --- Log Update ---
    await logModel.insertLog({
      collection: model,
      ocode: obj.ocode,
      userid: req.user ? req.user.userid : 'GUEST',
      type: "Update",
      reference: obj.name,
      message: logmessage ? `${logmessage} of role has been updated` : "Role has been updated",
      ipaddress,
    });

    return successResponse(res, 'Role updated successfully', result, 200);
  } catch (err) {
    if (session) {
      try {
        await commondb.abortTransaction(session);
      } catch (abortErr) { }
    }
    console.error("Role Update Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Delete Role
 */
const deleteRole = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) {
      return errorResponse(res, "Invalid record ID", 400);
    }

    // --- Find Record ---
    const old = await commondb.findOne(model, { _id }, {});
    if (!old) {
      return errorResponse(res, "Record not found.", 404);
    }

    // --- Check Dependencies ---
    for (const dmodel of dmodels) {
      const dcriteria = { role: old.name, ocode: old.ocode };
      const dresult = await commondb.count(dmodel, dcriteria);

      if (dresult > 0) {
        return errorResponse(
          res,
          `Delete Error! This role is already present in ${dmodel}.`,
          400
        );
      }
    }

    // --- Delete Record ---
    const result = await commondb.deleteOne(model, { _id });
    if (!result || result.deletedCount === 0) {
      return errorResponse(res, "Deletion failed.", 500);
    }

    // --- Log Deletion ---
    await logModel.insertLog({
      collection: model,
      ocode: old.ocode,
      userid: req.user ? req.user.userid : 'GUEST',
      type: "Delete",
      reference: old.name,
      message: "Role entry has been removed.",
      ipaddress,
    });

    return successResponse(res, 'Role removed successfully', { message: "Role has been removed successfully." }, 200);
  } catch (err) {
    console.error("Role Delete Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Search Roles
 */
const search = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { skipUserNameSearch: true });
    const dbRoles = await commondb.find(model, criteria, {});

    // Prepare default roles
    let filteredDefaults = defaultRoles.map(r => ({
      ...r,
      status: 'Active',
      isDefault: true,
      ocode: req.body.ocode || ''
    }));

    // Exclude global-only roles (APPADMIN, APPUSER) if ocode is provided in the payload
    if (req.body.ocode) {
      filteredDefaults = filteredDefaults.filter(r => r.name !== 'APPADMIN' && r.name !== 'APPUSER');
    }

    // Filter default roles by name if a name filter is provided
    if (req.body.name) {
      const searchName = req.body.name.toLowerCase();
      filteredDefaults = filteredDefaults.filter(r => 
        r.name.toLowerCase().includes(searchName)
      );
    }

    const result = [...filteredDefaults, ...dbRoles];
    return successResponse(res, 'Search completed successfully', result, 200);
  } catch (err) {
    console.error("Role Search Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Show Role by ID
 */
const show = async (req, res) => {
  try {
    const result = await commondb.findOne(model, { _id: req.params.id }, {});
    if (!result) {
      return errorResponse(res, "Role not found", 404);
    }
    return successResponse(res, 'Show completed successfully', result, 200);
  } catch (err) {
    console.error("Role Show Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Count Roles
 */
const count = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { skipUserNameSearch: true });
    const result = await commondb.count(model, criteria);
    return successResponse(res, 'Count completed successfully', result, 200);
  } catch (err) {
    console.error("Role Count Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Show Role by Name and Ocode
 */
const showByName = async (req, res) => {
  try {
    const criteria = buildSearchCriteria(req.body, { skipUserNameSearch: true });

    if (criteria.name && typeof criteria.name === 'string') {
      criteria.name = new RegExp('^' + criteria.name + '$', 'i');
    }

    if (!criteria.ocode) {
      return errorResponse(res, 'ocode is required', 400);
    }

    const result = await commondb.findOne(model, criteria, {});

    if (!result) {
      return errorResponse(res, 'No role found with given name and ocode', 404);
    }

    return successResponse(res, 'ShowByName completed successfully', result, 200);
  } catch (err) {
    console.error("Role ShowByName Error:", err);
    return errorResponse(res, "API error! Please try again.", 500);
  }
};

/**
 * Get default role templates from defaultroles.json.
 * If ocode is provided, excludes global-only roles (APPADMIN, APPUSER).
 */
const searchDefault = async (req, res) => {
  try {
    const { ocode } = req.body;
    let roles = defaultRoles;
    if (ocode) {
      roles = roles.filter(r => r.name !== 'APPADMIN' && r.name !== 'APPUSER');
    }
    return successResponse(res, 'Default roles fetched', roles, 200);
  } catch (err) {
    console.error('Default Role Search Error:', err);
    return errorResponse(res, 'API error! Please try again.', 500);
  }
};

module.exports = {
  create,
  update,
  deleteRole,
  search,
  show,
  count,
  showByName,
  searchDefault,
};
