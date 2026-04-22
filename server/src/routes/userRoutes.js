const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 search requests per windowMs
    message: { message: 'Too many search requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(protect);

router.get('/me', userController.getProfile);
router.get('/search', searchLimiter, userController.searchUsers);
router.patch('/me', userController.updateProfile);
router.put('/me/favorites', userController.updateFavorites);

module.exports = router;
