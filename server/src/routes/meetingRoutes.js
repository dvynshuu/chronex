const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// Protect all meeting routes
router.use(protect);

router.get('/team', meetingController.listByOrg);
router.post('/sync', meetingController.syncParticipants);
router.post('/schedule', meetingController.scheduleMeeting);
router.post('/suggestions', meetingController.getSuggestions);
router.post('/feedback', meetingController.recordFeedback);
router.get('/conflicts', meetingController.getConflicts);
router.get('/', meetingController.getParticipants);
router.get('/bootstrap', meetingController.getBootstrap);

module.exports = router;
