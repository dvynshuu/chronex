const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// Protect all meeting routes
router.use(protect);

router.get('/', meetingController.getParticipants);
router.post('/sync', meetingController.syncParticipants);

module.exports = router;
