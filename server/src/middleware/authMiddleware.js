const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // --- DEV BYPASS ---
        if (!token && process.env.NODE_ENV !== 'production') {
            const User = require('../models/User');
            let mockUser = await User.findOne({ email: 'demo@chronex.app' });
            if (!mockUser) {
                mockUser = await User.create({
                    email: 'demo@chronex.app',
                    password: 'password123',
                    profile: { name: 'Demo User' },
                    slug: 'demo-user'
                });
            }
            req.user = mockUser;

            // --- SEED DEMO ORG ---
            const Organization = require('../models/Organization');
            let demoOrg = await Organization.findOne({ name: 'Chronex Core Team' });
            if (!demoOrg) {
                // Create some other users for the team
                const sarah = await User.findOneAndUpdate(
                    { email: 'sarah@chronex.app' },
                    { profile: { name: 'Sarah Chen' }, baseTimezone: 'Asia/Singapore', workSchedule: { workStart: 9, workEnd: 18 } },
                    { upsert: true, new: true }
                );
                const james = await User.findOneAndUpdate(
                    { email: 'james@chronex.app' },
                    { profile: { name: 'James Wilson' }, baseTimezone: 'Europe/London', workSchedule: { workStart: 9, workEnd: 17 } },
                    { upsert: true, new: true }
                );

                demoOrg = await Organization.create({
                    name: 'Chronex Core Team',
                    admin: mockUser._id,
                    members: [
                        { user: mockUser._id, role: 'admin' },
                        { user: sarah._id, role: 'member' },
                        { user: james._id, role: 'member' }
                    ]
                });
            }
            // ---------------------

            return next();
        }
        // ------------------

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userRepository.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
