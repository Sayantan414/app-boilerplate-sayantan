const config = require('./config/config');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/error.middleware');
const indexRoutes = require('./routes/index.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const organizationRoutes = require('./routes/organization.routes');
const smslogRoutes = require('./routes/smslog.routes');
const userlogRoutes = require('./routes/userlog.routes');

const { errorResponse } = require('./utils/response.utils');

const app = express();

// Middleware
// Support multiple allowed origins: FRONTEND_URL + optional comma-separated EXTRA_ORIGINS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Always allow any localhost port in development
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'UPDATE', 'OPTIONS'],
  allowedHeaders: ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.use('/api', indexRoutes);
app.use('/api/user', userRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/smslog', smslogRoutes);
app.use('/api/userlog', userlogRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('API Boilerplate is running...');
});

// Handle 404
app.use((req, res) => {
  errorResponse(res, 'Route not found', 404);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
