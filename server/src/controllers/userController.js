const User = require('../models/User');

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
            const { q } = req.query;
            if (!q || q.length < 2) {
                return res.status(200).json([]);
            }

            const regex = new RegExp(q, 'i');
            const users = await User.find({
                $or: [
                    { 'profile.name': regex },
                    { email: regex },
                    { slug: regex }
                ],
                _id: { $ne: req.user.id } // Exclude current user
            })
                .select('profile.name email baseTimezone workSchedule slug')
                .limit(10);

            const results = users.map(u => ({
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
