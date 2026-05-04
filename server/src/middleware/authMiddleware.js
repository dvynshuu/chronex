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
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await userRepository.findById(decoded.id);
            } catch (jwtError) {
                console.error('JWT Verification Error:', jwtError.message);
                return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
            }
        }

        // 2. Final check
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, token failed or missing' });
        }

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ message: 'Internal Server Auth Error' });
    }
};

module.exports = { protect };
