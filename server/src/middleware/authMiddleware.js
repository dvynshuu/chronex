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
