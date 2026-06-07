const { getDB } = require('../config/db');

const collectionName = 'userlog';

/**
 * Insert a log entry
 * @param {Object} logData 
 */
const insertLog = async (logData) => {
  try {
    const db = getDB();
    const log = {
      ...logData,
      timestamp: new Date(),
    };
    await db.collection(collectionName).insertOne(log);
  } catch (error) {
    // We don't want to crash if logging fails, just console error
    console.error('Failed to insert log:', error);
  }
};

module.exports = {
  insertLog,
};
