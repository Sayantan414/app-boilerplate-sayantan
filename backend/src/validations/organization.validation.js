const Joi = require('joi');

const create = {
  body: Joi.object().keys({
    oname: Joi.string().required(),
    ocode: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pin: Joi.string().allow('', null).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('Active', 'Expired', 'Removed').default('Active'),
    addedon: Joi.date().optional(),
    lastupdated: Joi.date().optional(),
    expiredon: Joi.date().optional(),
    userid: Joi.string().allow('', null).optional(),
  }).unknown(true), // Allow other fields that might be processed
};

const update = {
  body: Joi.object().keys({
    _id: Joi.string().required(),
    oname: Joi.string().optional(),
    ocode: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pin: Joi.string().allow('', null).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('Active', 'Expired', 'Removed').optional(),
    addedon: Joi.date().optional(),
    lastupdated: Joi.date().optional(),
    expiredon: Joi.date().optional(),
    userid: Joi.string().allow('', null).optional(),
  }).unknown(true),
};

module.exports = {
  create,
  update,
};
