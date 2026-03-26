const Meeting = require('../models/Meeting');
const Organization = require('../models/Organization');

const meetingController = {
    /**
     * GET /api/v1/meetings
     * Fetch the meeting configurations for the logged-in user.
     * For now, we assume a single 'active' meeting configuration for simplicity.
     */
    async getParticipants(req, res, next) {
        try {
            // Find the most recent meeting config for the user
            // We'll also try to associate it with an organization if the user belongs to one.
            let query = { user: req.user.id };

            // Find the organization the user belongs to to filter by orgId if present
            const org = await Organization.findOne({ 'members.user': req.user.id });
            if (org) {
                query.orgId = org._id;
            }

            let meeting = await Meeting.findOne(query).sort({ updatedAt: -1 });

            if (!meeting) {
                // Return empty list if no meeting found
                return res.status(200).json({ participants: [] });
            }

            res.status(200).json({ 
                participants: meeting.participants,
                selectedSlot: meeting.selectedSlot 
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/meetings/org/:orgId
     * Fetch all meeting configurations for a specific organization.
     */
    async listByOrg(req, res, next) {
        try {
            let { orgId } = req.params;

            // If orgId is not provided in params, find the user's current organization
            if (!orgId) {
                const userOrg = await Organization.findOne({ 'members.user': req.user.id });
                if (!userOrg) return res.status(200).json([]);
                orgId = userOrg._id;
            }

            // Ensure the user is a member of the organization
            const organization = await Organization.findOne({ _id: orgId, 'members.user': req.user.id });
            if (!organization) {
                return res.status(403).json({ message: 'Not authorized to view meetings for this organization.' });
            }

            const meetings = await Meeting.find({ orgId: orgId }).sort({ updatedAt: -1 }).limit(10);

            res.status(200).json(meetings);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/v1/meetings/sync
     * Update the entire list of participants (sync the state).
     */
    async syncParticipants(req, res, next) {
        try {
            const { participants, selectedSlot, title } = req.body;

            // Find the organization the user belongs to
            const org = await Organization.findOne({ 'members.user': req.user.id });
            const orgId = org ? org._id : null;

            // Update or Create the meeting config
            // For now, we still associate primarily with 'user', but add 'orgId' for team visibility
            let meeting = await Meeting.findOneAndUpdate(
                { user: req.user.id },
                { 
                    participants, 
                    selectedSlot, 
                    title: title || 'New Coordination',
                    orgId,
                    updatedBy: req.user.id
                },
                { new: true, upsert: true }
            );

            res.status(200).json({ 
                participants: meeting.participants,
                selectedSlot: meeting.selectedSlot,
                title: meeting.title,
                orgId: meeting.orgId
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = meetingController;
