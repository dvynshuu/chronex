const express = require('express');
const organizationService = require('../services/organizationService');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Controller Logic inline for brevity in this step
const createOrg = async (req, res, next) => {
    try {
        const org = await organizationService.createOrganization(req.user._id, req.body.name);
        res.status(201).json(org);
    } catch (err) { next(err); }
};

const getOrg = async (req, res, next) => {
    try {
        const org = await organizationService.getOrgDashboard(req.params.id);
        res.status(200).json(org);
    } catch (err) { next(err); }
};

router.post('/', protect, createOrg);
router.get('/:id', protect, getOrg);

module.exports = router;
