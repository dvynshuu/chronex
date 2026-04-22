const Meeting = require('../models/Meeting');
const Organization = require('../models/Organization');
const MeetingOutcome = require('../models/MeetingOutcome');
const AvailabilitySource = require('../models/AvailabilitySource');

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
    },

    /**
     * POST /api/v1/meetings/schedule
     * Formalize the draft into a 'scheduled' meeting.
     */
    async scheduleMeeting(req, res, next) {
        try {
            const { participants, selectedSlot, title, duration, startTime } = req.body;

            const org = await Organization.findOne({ 'members.user': req.user.id });
            const orgId = org ? org._id : null;

            const meeting = await Meeting.create({
                user: req.user.id,
                orgId,
                participants,
                selectedSlot,
                title: title || 'Global Alignment Session',
                duration: duration || 45,
                startTime: startTime || new Date(),
                status: 'scheduled'
            });

            // Update fairness balance for participants taking "bad" hours
            if (selectedSlot && org?.norms?.fairnessEnabled) {
                const User = require('../models/User');
                const timezoneService = require('../services/timezoneService');
                const utcTime = new Date(startTime).toISOString();
                
                const stats = timezoneService.compareTimezones(utcTime, participants);
                
                for (let i = 0; i < participants.length; i++) {
                    const p = participants[i];
                    const stat = stats[i];
                    if (!p.userId) continue;

                    let hit = 0;
                    if (stat.isSleepHour) hit = 5;
                    else if (stat.isSocialHour) hit = 1;

                    if (hit > 0) {
                        await User.findByIdAndUpdate(p.userId, { $inc: { fairnessBalance: hit } });
                    } else if (stat.isWorkHour) {
                        // Slowly reduce balance if they take good hours
                        await User.findByIdAndUpdate(p.userId, { $inc: { fairnessBalance: -0.2 } });
                    }
                }
            }

            res.status(201).json(meeting);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/v1/meetings/suggestions
     * Get intelligent suggestions based on norms and fairness.
     */
    async getSuggestions(req, res, next) {
        try {
            const { participants, duration = 1 } = req.body;
            const org = await Organization.findOne({ 'members.user': req.user.id }).populate('members.user', 'fairnessBalance');
            
            // Enrichment: Check if participants have active AvailabilitySources
            for (let p of participants) {
                if (p.userId) {
                    const sources = await AvailabilitySource.find({ user: p.userId, isActive: true });
                    p.availabilitySources = sources.map(s => s.type);
                }
            }

            const timezoneService = require('../services/timezoneService');
            const suggestions = timezoneService.findOverlap(participants, duration, {
                norms: org?.norms,
                members: org?.members || []
            });

            res.status(200).json(suggestions);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/v1/meetings/feedback
     * Record post-meeting sentiment to "close the loop".
     */
    async recordFeedback(req, res, next) {
        try {
            const { meetingId, score, painReduced, comment, metadata } = req.body;
            const User = require('../models/User');
            
            // Create a systemic outcome record
            const outcome = await MeetingOutcome.create({
                meeting: meetingId,
                user: req.user.id,
                score,
                painReduced,
                comments: comment,
                metadata
            });

            // Keep a summary in the user document for fast retrieval
            await User.findByIdAndUpdate(req.user.id, {
                $push: { 
                    meetingFeedback: { 
                        meetingId, 
                        score, 
                        painReduced, 
                        comment, 
                        createdAt: new Date() 
                    } 
                }
            });
            
            res.status(200).json({ message: 'Outcome recorded', outcomeId: outcome._id });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/meetings/bootstrap
     * High-performance aggregate endpoint for MeetingPlanner initialization.
     * Returns participants, norms, initial suggestions, and conflicts in 1 RTT.
     */
    async getBootstrap(req, res, next) {
        try {
            const userId = req.user.id;
            
            // Parallelize all DB lookups
            const [org, meeting] = await Promise.all([
                Organization.findOne({ 'members.user': userId }).populate('members.user', 'fairnessBalance'),
                Meeting.findOne({ user: userId }).sort({ updatedAt: -1 })
            ]);

            const participants = meeting?.participants || [];
            const duration = meeting?.duration || 1;

            // Compute suggestions & conflicts in parallel
            const timezoneService = require('../services/timezoneService');
            
            // Enrichment for suggestions
            for (let p of participants) {
                if (p.userId) {
                    const sources = await AvailabilitySource.find({ user: p.userId, isActive: true });
                    p.availabilitySources = sources.map(s => s.type);
                }
            }

            const [suggestions, scheduled, cities] = await Promise.all([
                timezoneService.findOverlap(participants, duration, {
                    norms: org?.norms,
                    members: org?.members || []
                }),
                org ? Meeting.find({ 
                    orgId: org._id, 
                    status: 'scheduled',
                    startTime: { $gte: new Date() }
                }).limit(3) : [],
                require('../services/locationService').getCities()
            ]);

            const conflicts = scheduled.map(m => ({
                id: m._id,
                name: m.title,
                time: m.startTime,
                duration: m.duration,
                status: 'CONFLICT'
            }));

            res.status(200).json({
                participants,
                title: meeting?.title || '',
                selectedSlot: meeting?.selectedSlot,
                norms: org?.norms,
                suggestions,
                conflicts,
                cities
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/meetings/conflicts
     * Simulated conflict detection based on other scheduled meetings.
     */
    async getConflicts(req, res, next) {
        try {
            const org = await Organization.findOne({ 'members.user': req.user.id });
            if (!org) return res.status(200).json([]);

            const scheduled = await Meeting.find({ 
                orgId: org._id, 
                status: 'scheduled',
                startTime: { $gte: new Date() }
            }).limit(3);

            const conflicts = scheduled.map(m => ({
                id: m._id,
                name: m.title,
                time: m.startTime,
                duration: m.duration,
                status: Math.random() > 0.5 ? 'CONFLICT' : 'CLEAR'
            }));

            // If no real meetings, return some "smart" simulated ones
            if (conflicts.length === 0) {
                conflicts.push({
                    id: 'sim-1',
                    name: 'Internal Sync',
                    time: new Date(Date.now() + 3600000),
                    duration: 60,
                    status: 'CONFLICT'
                });
            }

            res.status(200).json(conflicts);
        } catch (err) {
            next(err);
        }
    }
};

module.exports = meetingController;
