const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');

class AuthService {
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        return { accessToken, refreshToken };
    }

    async register(userData) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
            const error = new Error('Email already in use');
            error.status = 400;
            throw error;
        }
        const user = await userRepository.create(userData);
        const { accessToken, refreshToken } = this.generateTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        return { user: { id: user._id, email: user.email }, accessToken, refreshToken };
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user || !(await user.comparePassword(password, user.password))) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        const { accessToken, refreshToken } = this.generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        return { user: { id: user._id, email: user.email }, accessToken, refreshToken };
    }

    async refresh(token) {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await userRepository.findByRefreshToken(token);

        if (!user || user._id.toString() !== decoded.id) {
            throw new Error('Invalid refresh token');
        }

        const tokens = this.generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return tokens;
    }
}

module.exports = new AuthService();
