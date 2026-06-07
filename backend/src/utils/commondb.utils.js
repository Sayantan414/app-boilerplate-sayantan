const { getDB, getClient } = require('../config/db');
const { ObjectId } = require('mongodb');

const castObjectId = (criteria) => {
  if (!criteria) return criteria;
  const queryCriteria = { ...criteria };
  if (queryCriteria._id) {
    if (typeof queryCriteria._id === 'string' && queryCriteria._id.length === 24) {
      queryCriteria._id = new ObjectId(queryCriteria._id);
    } else if (typeof queryCriteria._id === 'object' && queryCriteria._id !== null) {
      // Handle operators like $ne, $eq, $gt, etc.
      for (const op of ['$ne', '$eq', '$gt', '$gte', '$lt', '$lte']) {
        if (queryCriteria._id[op] && typeof queryCriteria._id[op] === 'string' && queryCriteria._id[op].length === 24) {
          queryCriteria._id[op] = new ObjectId(queryCriteria._id[op]);
        }
      }
      if (Array.isArray(queryCriteria._id['$in'])) {
        queryCriteria._id['$in'] = queryCriteria._id['$in'].map(id => 
          (typeof id === 'string' && id.length === 24) ? new ObjectId(id) : id
        );
      }
      if (Array.isArray(queryCriteria._id['$nin'])) {
        queryCriteria._id['$nin'] = queryCriteria._id['$nin'].map(id => 
          (typeof id === 'string' && id.length === 24) ? new ObjectId(id) : id
        );
      }
    }
  }
  return queryCriteria;
};

/**
 * Find one document
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} projection 
 * @param {Object} session optional mongo session
 */
const findOne = async (collection, criteria, projection = {}, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  const options = { projection };
  if (session) options.session = session;
  return await db.collection(collection).findOne(queryCriteria, options);
};

/**
 * Find multiple documents
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} projection 
 * @param {Object} sort 
 * @param {Object} session optional mongo session
 */
const find = async (collection, criteria, projection = {}, sort = {}, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  
  // Clean custom pagination/sort properties if they leak into criteria
  let skip = 0;
  if (queryCriteria.skip !== undefined) {
    skip = parseInt(queryCriteria.skip);
    delete queryCriteria.skip;
  }
  let limit = 0;
  if (queryCriteria.limit !== undefined) {
    limit = parseInt(queryCriteria.limit);
    delete queryCriteria.limit;
  }
  let querySort = { ...sort };
  if (queryCriteria.sort) {
    querySort = queryCriteria.sort;
    delete queryCriteria.sort;
  }
  let hint = null;
  if (queryCriteria.hint) {
    hint = queryCriteria.hint;
    delete queryCriteria.hint;
  }

  const options = {};
  if (session) options.session = session;

  let cursor = db.collection(collection).find(queryCriteria, options);
  cursor = cursor.project(projection).sort(querySort);
  if (hint) cursor = cursor.hint(hint);
  if (skip > 0) cursor = cursor.skip(skip);
  if (limit > 0) cursor = cursor.limit(limit);

  return await cursor.toArray();
};

/**
 * Insert one document
 * @param {string} collection 
 * @param {Object} obj 
 * @param {Object} session optional mongo session
 */
const insertOne = async (collection, obj, session = null) => {
  const db = getDB();
  const options = session ? { session } : {};
  const result = await db.collection(collection).insertOne(obj, options);
  return { _id: result.insertedId, ...obj };
};

/**
 * Update one document
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} updateJson 
 * @param {Object} session optional mongo session
 */
const updateOne = async (collection, criteria, updateJson, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  
  // Normalize update format to ensure $set is used if not already structured
  let update = updateJson;
  if (!updateJson['$push'] && !updateJson['$pop'] && !updateJson['$unset'] && !updateJson['$set'] && !updateJson['$pull']) {
    update = { $set: updateJson };
  }

  const options = session ? { session } : {};
  return await db.collection(collection).updateOne(queryCriteria, update, options);
};

/**
 * Update many documents
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} updateJson 
 * @param {Object} session optional mongo session
 */
const updateMany = async (collection, criteria, updateJson, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  let update = updateJson;
  if (!updateJson['$push'] && !updateJson['$pop'] && !updateJson['$unset'] && !updateJson['$set'] && !updateJson['$pull']) {
    update = { $set: updateJson };
  }
  const options = session ? { session } : {};
  return await db.collection(collection).updateMany(criteria, update, options);
};

/**
 * Delete one document
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} session optional mongo session
 */
const deleteOne = async (collection, criteria, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  const options = session ? { session } : {};
  return await db.collection(collection).deleteOne(queryCriteria, options);
};

/**
 * Delete many documents
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} session optional mongo session
 */
const deleteMany = async (collection, criteria, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  const options = session ? { session } : {};
  return await db.collection(collection).deleteMany(criteria, options);
};

/**
 * Count documents
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {Object} session optional mongo session
 */
const count = async (collection, criteria, session = null) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  const options = session ? { session } : {};
  return await db.collection(collection).countDocuments(queryCriteria, options);
};

/**
 * Distinct values
 * @param {string} collection 
 * @param {Object} criteria 
 * @param {string} field 
 */
const distinct = async (collection, criteria, field) => {
  const db = getDB();
  const queryCriteria = castObjectId(criteria);
  return await db.collection(collection).distinct(field, queryCriteria);
};

/**
 * Aggregate query
 */
const aggregate = async (collection, pipeline, session = null) => {
  const db = getDB();
  const options = session ? { session } : {};
  return await db.collection(collection).aggregate(pipeline, options).toArray();
};

/**
 * Legacy group helper
 */
const groupOnly = async (collection, criteria, groupJson, session = null) => {
  const pipeline = [];
  const queryCriteria = castObjectId(criteria);
  if (queryCriteria.sort) {
    const sort = queryCriteria.sort;
    delete queryCriteria.sort;
    pipeline.push({ $match: queryCriteria });
    pipeline.push({ $sort: sort });
  } else {
    pipeline.push({ $match: queryCriteria });
  }
  pipeline.push({ $group: groupJson });
  return await aggregate(collection, pipeline, session);
};

/**
 * Get all database collection metadata
 */
const getCollections = async () => {
  const db = getDB();
  return await db.listCollections().toArray();
};

/**
 * Start Database Transaction
 */
const startTransaction = async () => {
  const client = getClient();
  const session = client.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary'
  });
  return session;
};

/**
 * Commit Database Transaction
 */
const commitTransaction = async (session) => {
  try {
    await session.commitTransaction();
  } finally {
    await session.endSession();
  }
};

/**
 * Abort Database Transaction
 */
const abortTransaction = async (session) => {
  try {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
};

module.exports = {
  findOne,
  find,
  insertOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  count,
  distinct,
  aggregate,
  groupOnly,
  getCollections,
  startTransaction,
  commitTransaction,
  abortTransaction,
};
