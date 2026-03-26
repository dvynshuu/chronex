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

const getOrg = async (req, res, next) => {
    try {
        const org = await organizationService.getOrgDashboard(req.params.id);
        res.status(200).json(org);
    } catch (err) { next(err); }
};

const addMemberByEmail = async (req, res, next) => {
    console.log(`[DEBUG] Adding member: ${req.body.email} by ${req.user.email}`);
    try {
        const User = require('../models/User');
        const Organization = require('../models/Organization');
        
        const { email } = req.body;
        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ message: 'User not found' });

        const myOrg = await organizationService.getUserOrganization(req.user._id);
        if (!myOrg) return res.status(404).json({ message: 'Organization not found' });

        const result = await organizationService.addMember(myOrg._id, userToAdd._id);
        res.status(200).json(result);
    } catch (err) { next(err); }
};

router.post('/', protect, createOrg);
router.get('/me', protect, getMyOrg);
router.post('/members', protect, addMemberByEmail);
router.get('/:id', protect, getOrg);

module.exports = router;
