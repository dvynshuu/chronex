const AvailabilitySource = require('../models/AvailabilitySource');
const User = require('../models/User');
const Organization = require('../models/Organization');
const googleCalendarService = require('../services/googleCalendarService');
const availabilityService = require('../services/availabilityService');

exports.getGoogleAuthUrl = async (req, res, next) => {
    try {
        // We pass the userId in the state to verify on callback
        const url = googleCalendarService.getAuthUrl(req.user._id.toString());
        res.status(200).json({ url });
    } catch (err) {
        next(err);
    }
};

exports.handleGoogleCallback = async (req, res, next) => {
    try {
        const { code, state } = req.body; // state is the userId

        if (!code) {
            return res.status(400).json({ message: 'Authorization code is required' });
        }

        const tokens = await googleCalendarService.getTokensFromCode(code);
        
        // Use state (userId) if provided, otherwise fallback to req.user (if middleware passed)
        const userId = state || req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User context lost' });
        }

        // Store or update the source
        let source = await AvailabilitySource.findOne({ user: userId, type: 'google_calendar' });

        if (source) {
            source.accessToken = tokens.access_token;
            if (tokens.refresh_token) source.refreshToken = tokens.refresh_token;
            source.lastSynced = new Date();
            await source.save();
        } else {
            source = await AvailabilitySource.create({
                user: userId,
                type: 'google_calendar',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                lastSynced: new Date(),
                isActive: true
            });
        }

        // Update User
        await User.findByIdAndUpdate(userId, { calendarConnected: true });

        res.status(200).json({
            success: true,
            message: 'Google Calendar connected successfully',
            source: {
                type: source.type,
                lastSynced: source.lastSynced
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.connectCalendar = async (req, res, next) => {
    // This was the old simulation endpoint, keeping it for backward compatibility or direct manual mocks
    try {
        const { type = 'google_calendar' } = req.body;
        let source = await AvailabilitySource.findOne({ user: req.user._id, type });
        if (!source) {
            source = await AvailabilitySource.create({
                user: req.user._id,
                type,
                externalId: `ext_${Math.random().toString(36).substr(2, 9)}`,
                accessToken: 'mock_access_token',
                refreshToken: 'mock_refresh_token',
                lastSynced: new Date()
            });
        }
        await User.findByIdAndUpdate(req.user._id, { calendarConnected: true });
        res.status(200).json({ success: true, source });
    } catch (err) {
        next(err);
    }
};

exports.getConnections = async (req, res, next) => {
    try {
        const sources = await AvailabilitySource.find({ user: req.user._id }).select('-accessToken -refreshToken');
        res.status(200).json(sources);
    } catch (err) {
        next(err);
    }
};

exports.checkViolation = async (req, res, next) => {
    try {
        const { startTime, endTime, organizationId } = req.body;
        const org = await Organization.findById(organizationId);
        if (!org) return res.status(404).json({ message: 'Organization not found' });

        const violations = availabilityService.getAgreementViolations(startTime, endTime, org);
        res.status(200).json({ violations });
    } catch (err) {
        next(err);
    }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        const { participantIds, organizationId, durationMinutes } = req.body;
        const [org, participants] = await Promise.all([
            Organization.findById(organizationId),
            User.find({ _id: { $in: participantIds } })
        ]);

        if (!org) return res.status(404).json({ message: 'Organization not found' });

        const suggestions = availabilityService.getEnforcedSuggestions(participants, org, durationMinutes);
        res.status(200).json({ suggestions });
    } catch (err) {
        next(err);
    }
};
