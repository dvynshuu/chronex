const User = require('../models/User');
const Organization = require('../models/Organization');
const logger = require('../utils/logger');

const userController = {
    /**
     * GET /api/v1/users/me
     * Fetch current user's profile and favorites
     */
    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            res.status(200).json({
                id: user._id,
                email: user.email,
                profile: user.profile,
                workSchedule: user.workSchedule,
                favorites: user.favorites,
                slug: user.slug,
                publicProfile: user.publicProfile
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PATCH /api/v1/users/me
     * Update profile settings, work schedule, or slug
     */
    async updateProfile(req, res, next) {
        try {
            const updates = {};
            const allowedFields = ['profile', 'workSchedule', 'slug', 'publicProfile', 'statusOverride'];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            let user;
            try {
                user = await User.findByIdAndUpdate(
                    req.user.id,
                    { $set: updates },
                    { new: true, runValidators: true }
                );
            } catch (err) {
                // Handle duplicate key error (11000) for sloth
                if (err.code === 11000) {
                    const field = Object.keys(err.keyValue)[0];
                    return res.status(409).json({ 
                        message: `The ${field} "${err.keyValue[field]}" is already in use. Please try another.` 
                    });
                }
                throw err; // Let the global error handler catch other errors
            }

            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/v1/users/me/favorites
     * Update/Sync the favorite timezones list (Dashboard)
     */
    async updateFavorites(req, res, next) {
        try {
            const { favorites } = req.body;
            if (!Array.isArray(favorites)) {
                return res.status(400).json({ message: 'Favorites must be an array' });
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: { favorites } },
                { new: true }
            );

            res.status(200).json({ favorites: user.favorites });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/v1/users/search
     * Search for users by name or email
     */
    async searchUsers(req, res, next) {
        try {
            let { q } = req.query;

            // Normalize and sanitize query
            if (!q) return res.status(200).json([]);
            q = q.trim();
            
            // Basic protection against regex-based enumeration if fallback is used
            const sanitizedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            if (q.length < 2) {
                return res.status(200).json([]);
            }

            // Audit Logging
            logger.info({
                message: 'User search initiated',
                userId: req.user.id,
                query: q
            });

            // 1. Org Scoping: Find all users who share an organization with the current user
            const myOrgs = await Organization.find({ 'members.user': req.user.id }).select('members.user');
            
            if (!myOrgs || myOrgs.length === 0) {
                // If user is not in any org, they can't search (High-security default)
                return res.status(200).json([]);
            }

            // Extract all member IDs from my organizations
            const allowedMemberIds = [...new Set(myOrgs.flatMap(org => org.members.map(m => m.user.toString())))];

            // 2. Optimization: Use text index for searching restricted to allowed members
            const users = await User.find({
                $text: { $search: q },
                _id: { $in: allowedMemberIds, $ne: req.user.id }
            })
                .select('profile.name email baseTimezone workSchedule slug')
                .limit(10)
                .lean();

            // Fallback for partial matches if text search is too restrictive (still scoped)
            let finalUsers = users;
            if (users.length === 0) {
                finalUsers = await User.find({
                    $or: [
                        { email: { $regex: `^${sanitizedQ}`, $options: 'i' } },
                        { slug: { $regex: `^${sanitizedQ}`, $options: 'i' } },
                        { 'profile.name': { $regex: `^${sanitizedQ}`, $options: 'i' } }
                    ],
                    _id: { $in: allowedMemberIds, $ne: req.user.id }
                })
                .select('profile.name email baseTimezone workSchedule slug')
                .limit(10)
                .lean();
            }

            const results = finalUsers.map(u => ({
                id: u._id,
                name: u.profile?.name || u.slug || u.email,
                email: u.email,
                timezone: u.baseTimezone,
                workSchedule: u.workSchedule,
                slug: u.slug
            }));

            res.status(200).json(results);
        } catch (err) {
            next(err);
        }
    }
};

module.exports = userController;
