const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// Protect all meeting routes
router.use(protect);

router.get('/team', meetingController.listByOrg);
router.post('/sync', meetingController.syncParticipants);
router.get('/', meetingController.getParticipants);

module.exports = router;
