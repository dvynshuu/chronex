const express = require('express');
const availabilityService = require('../services/availabilityService');
const User = require('../models/User');
const router = express.Router();

/**
 * GET /api/v1/public/:slug
 * Public profile endpoint — no auth required
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const user = await User.findOne({ slug, 'publicProfile.enabled': true });

        if (!user) {
            return res.status(404).json({ message: 'Profile not found or not public' });
        }

        const timezone = user.baseTimezone || 'UTC';
        const workSchedule = user.workSchedule || {};
        const statusOverride = user.statusOverride || {};

        const status = availabilityService.getStatus(workSchedule, timezone, statusOverride);
        const nextAvailability = availabilityService.getNextAvailability(workSchedule, timezone);

        const profile = {
            name: user.profile?.name || slug,
            timezone,
            status: user.publicProfile.showStatus ? status : null,
            nextAvailability: user.publicProfile.showStatus ? nextAvailability : null,
            showOverlap: user.publicProfile.showOverlap,
            workSchedule: user.publicProfile.showOverlap ? {
                workStart: workSchedule.workStart || 9,
                workEnd: workSchedule.workEnd || 17
            } : null
        };

        res.status(200).json(profile);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
