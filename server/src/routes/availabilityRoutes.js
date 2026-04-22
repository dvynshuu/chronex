const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/connect', availabilityController.connectCalendar);
router.get('/sources', availabilityController.getConnections);

// Google OAuth
router.get('/google/url', availabilityController.getGoogleAuthUrl);
router.post('/google/callback', availabilityController.handleGoogleCallback);

// Intelligence
router.post('/intelligence/check-violation', availabilityController.checkViolation);
router.post('/intelligence/suggestions', availabilityController.getSuggestions);

module.exports = router;
