require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
