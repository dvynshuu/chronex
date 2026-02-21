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

const getMyOrg = async (req, res, next) => {
    try {
        const org = await organizationService.getUserOrganization(req.user._id);
        if (!org) return res.status(200).json(null);

        const dashboard = await organizationService.getOrgDashboard(org._id);
        res.status(200).json(dashboard);
    } catch (err) { next(err); }
};

router.post('/', protect, createOrg);
router.get('/me', protect, getMyOrg);
router.get('/:id', protect, getOrg);

module.exports = router;
