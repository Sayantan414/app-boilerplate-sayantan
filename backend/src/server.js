const app = require('./app');
const config = require('./config/config');
const { connectDB, closeDB } = require('./config/db');
const logger = require('./config/logger');

let server;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Start Server
    server = app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const exitHandler = () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      await closeDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
