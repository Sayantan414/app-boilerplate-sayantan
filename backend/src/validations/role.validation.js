const Joi = require('joi');

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    privilege: Joi.array().items(Joi.string()).default([]),
    status: Joi.string().valid('Active', 'Inactive').default('Active'),
    ocode: Joi.string().required(),
    userid: Joi.string().allow('', null).optional(),
  }).unknown(true),
};

const update = {
  body: Joi.object().keys({
    _id: Joi.string().required(),
    name: Joi.string().optional(),
    privilege: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('Active', 'Inactive').optional(),
    ocode: Joi.string().optional(),
    userid: Joi.string().allow('', null).optional(),
  }).unknown(true),
};

const deleteRole = {
  body: Joi.object().keys({
    _id: Joi.string().required(),
    userid: Joi.string().allow('', null).optional(),
  }).unknown(true),
};

const showByName = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    ocode: Joi.string().required(),
  }),
};

module.exports = {
  create,
  update,
  deleteRole,
  showByName,
};
