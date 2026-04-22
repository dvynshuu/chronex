const MeetingOutcome = require('../models/MeetingOutcome');
const analyticsService = require('../services/analyticsService');

exports.logOutcome = async (req, res, next) => {
    try {
        const { meetingId, wasSuccess, score, duration, attendanceCount, rescheduleCount, sentiment, comments, metadata } = req.body;
        
        const outcome = await MeetingOutcome.create({
            meeting: meetingId,
            user: req.user._id,
            wasSuccess,
            score,
            duration,
            attendanceCount,
            rescheduleCount,
            sentiment,
            comments,
            metadata
        });

        res.status(201).json({ success: true, outcome });
    } catch (err) {
        next(err);
    }
};

exports.getIntelligence = async (req, res, next) => {
    try {
        const { organizationId } = req.params;
        const intelligence = await analyticsService.getCoordinationIntelligence(organizationId);
        res.status(200).json(intelligence);
    } catch (err) {
        next(err);
    }
};

exports.getPainTracking = async (req, res, next) => {
    try {
        const { organizationId } = req.params;
        const tracking = await analyticsService.trackLongitudinalPain(organizationId);
        res.status(200).json(tracking);
    } catch (err) {
        next(err);
    }
};
