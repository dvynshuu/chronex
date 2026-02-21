const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', userController.getProfile);
router.get('/search', userController.searchUsers);
router.patch('/me', userController.updateProfile);
router.put('/me/favorites', userController.updateFavorites);

module.exports = router;
