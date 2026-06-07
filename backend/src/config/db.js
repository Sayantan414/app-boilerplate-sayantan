const { MongoClient } = require('mongodb');
const config = require('./config');
const logger = require('./logger');

let client;
let db;

const connectDB = async () => {
  if (db) return db;

  const { url, name } = config.db;

  try {
    client = await MongoClient.connect(url);
    db = client.db(name);
    logger.info('Connected to MongoDB successfully');
    return db;
  } catch (error) {
    logger.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const getClient = () => {
  if (!client) {
    throw new Error('Database client not initialized.');
  }
  return client;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  getClient,
  closeDB,
};