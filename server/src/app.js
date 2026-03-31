const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();

// Global Request Logger for Debugging
app.use((req, res, next) => {
    logger.info(`[GLOBAL-DEBUG] ${req.method} ${req.originalUrl}`);
    next();
});

// Security Middlewares
app.use(helmet());
app.use(compression());
// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Logging
app.use(morgan('dev', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development and complex dashboard usage
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);


// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/time', require('./routes/timeRoutes'));
app.use('/api/v1/orgs', require('./routes/orgRoutes'));
app.use('/api/v1/public', require('./routes/publicRoutes'));
app.use('/api/v1/meetings', require('./routes/meetingRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

module.exports = app;
