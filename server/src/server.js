require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const server = http.createServer(app);

// Initialize WebSockets
socketService.init(server);

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} with WebSockets enabled`);
        });
    })
    .catch((err) => {
        logger.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
