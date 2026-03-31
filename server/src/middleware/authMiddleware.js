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
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Auth Bypass notice: Token verification failed in dev, falling through to demo user.');
                } else {
                    return res.status(401).json({ message: 'Not authorized, token failed' });
                }
            }
        }

        // 2. DEV BYPASS: If no user found and in dev mode, use/create demo user
        if (!req.user && process.env.NODE_ENV !== 'production') {
            try {
                let mockUser = await User.findOne({ email: 'demo@chronex.app' });
                if (!mockUser) {
                    console.info('Auto-creating demo@chronex.app user for development mode...');
                    mockUser = await User.create({
                        email: 'demo@chronex.app',
                        password: 'password123',
                        profile: { name: 'Demo User' },
                        slug: 'demo-user'
                    });
                }
                req.user = mockUser;
            } catch (mockErr) {
                console.error('CRITICAL: Failed to create or find demo user in dev mode:', mockErr.message);
                // We fall through and hope for the best, but line 42 will catch it
            }
        }

        // 3. Final check
        if (!req.user) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Auth Warning: No user found even after dev bypass attempt.');
            }
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
