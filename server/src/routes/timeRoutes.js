const express = require('express');
const timeController = require('../controllers/timeController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/current', timeController.getCurrentTimes);
router.post('/compare', timeController.compare);
router.post('/suggest', timeController.suggestMeeting);

module.exports = router;
