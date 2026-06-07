const Joi = require('joi');

const create = {
  body: Joi.object().keys({
    mobile: Joi.string().length(10).required(),
    userid: Joi.string().optional(),
    email: Joi.string().email().allow('', null).optional(),
    firstname: Joi.string().required(),
    lastname: Joi.string().allow('', null).optional(),
    password: Joi.string().required().min(4),
    role: Joi.string().valid().optional(),
    status: Joi.string().valid('Active', 'Inactive').default('Active'),
    empno: Joi.string().allow('', null).optional(),
    ocode: Joi.string().allow('', null).optional(),
    dept_name: Joi.string().allow('', null).optional(),
    profilePic: Joi.string().allow('', null).optional(),

    // System-managed — stripped if sent
    notificationid: Joi.any().strip(),
    addedby: Joi.any().strip(),
    addedon: Joi.any().strip(),
    lastupdatedby: Joi.any().strip(),
    lastupdatedon: Joi.any().strip(),
    onetime: Joi.any().strip(),
  }).unknown(true),
};

const update = {
  body: Joi.object().keys({
    _id: Joi.string().required(),
    mobile: Joi.string().optional(),
    userid: Joi.string().optional(),
    email: Joi.string().email().allow('', null).optional(),
    firstname: Joi.string().optional(),
    lastname: Joi.string().allow('', null).optional(),
    role: Joi.string().valid().optional(),
    status: Joi.string().valid('Active', 'Inactive').optional(),
    empno: Joi.string().allow('', null).optional(),
    ocode: Joi.string().allow('', null).optional(),
    dept_name: Joi.string().allow('', null).optional(),
    profilePic: Joi.string().allow('', null).optional(),

    // System-managed — stripped if sent
    notificationid: Joi.any().strip(),
    addedby: Joi.any().strip(),
    addedon: Joi.any().strip(),
    lastupdatedby: Joi.any().strip(),
    lastupdatedon: Joi.any().strip(),
    onetime: Joi.any().strip(),
  }).unknown(true),
};

const signin = {
  body: Joi.object().keys({
    userid: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshToken = {};

module.exports = {
  create,
  update,
  signin,
  refreshToken,
};