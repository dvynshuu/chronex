const Meeting = require('../models/Meeting');

const meetingController = {
    /**
     * GET /api/v1/meetings
     * Fetch the meeting configurations for the logged-in user.
     * For now, we assume a single 'active' meeting configuration for simplicity.
     */
    async getParticipants(req, res, next) {
        try {
            // Find the most recent meeting config for the user
            let meeting = await Meeting.findOne({ user: req.user.id }).sort({ updatedAt: -1 });

            if (!meeting) {
                // Return empty list if no meeting found
                return res.status(200).json({ participants: [] });
            }

            res.status(200).json({ participants: meeting.participants });
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
            const { participants } = req.body;

            // Update or Create
            let meeting = await Meeting.findOneAndUpdate(
                { user: req.user.id },
                { participants },
                { new: true, upsert: true }
            );

            res.status(200).json({ participants: meeting.participants });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = meetingController;
