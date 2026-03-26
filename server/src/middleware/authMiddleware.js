const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const User = require('../models/User');
const Organization = require('../models/Organization');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // 1. Attempt to verify token if present
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chronex-dev-secret-key');
                req.user = await userRepository.findById(decoded.id);
            } catch (err) {
                // If token is invalid and we're NOT in dev, fail here
                if (process.env.NODE_ENV === 'production') {
                    return res.status(401).json({ message: 'Not authorized, token failed' });
                }
                // In dev, we can fall through to bypass
            }
        }

        // 2. DEV BYPASS: If no user found and in dev mode, use/create demo user
        if (!req.user && process.env.NODE_ENV !== 'production') {
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
        }

        // 3. Final check
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user found' });
        }

        // 4. DEV AUTO-ORG: Ensure the user has an organization in development
        if (process.env.NODE_ENV !== 'production') {
            let userOrg = await Organization.findOne({ 'members.user': req.user._id });
            if (!userOrg) {
                await Organization.create({
                    name: 'Chronex Core Team',
                    admin: req.user._id,
                    members: [{ user: req.user._id, role: 'admin' }]
                });
            }
        }

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ message: 'Internal Server Auth Error' });
    }
};

module.exports = { protect };
