const express = require('express');
const router = express.Router();
const outcomeController = require('../controllers/outcomeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', outcomeController.logOutcome);
router.get('/intelligence/:organizationId', outcomeController.getIntelligence);
router.get('/pain-tracking/:organizationId', outcomeController.getPainTracking);

module.exports = router;
