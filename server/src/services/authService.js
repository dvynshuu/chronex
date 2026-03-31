const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');

class AuthService {
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'chronex-dev-secret-key',
            { expiresIn: '7d' }
        );
        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET || 'chronex-dev-refresh-secret-key',
            { expiresIn: '30d' }
        );
        return { accessToken, refreshToken };
    }

    _formatUser(user) {
        return {
            id: user._id,
            email: user.email,
            name: user.profile?.name || '',
            avatar: user.profile?.avatar || '',
            baseTimezone: user.baseTimezone || 'UTC',
            preferences: user.profile?.preferences || {},
            workSchedule: user.workSchedule || {},
        };
    }

    async register(userData) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
            const error = new Error('Email already in use');
            error.status = 400;
            throw error;
        }

        // Build user document with profile.name from the signup form
        const createData = {
            email: userData.email,
            password: userData.password,
            profile: { name: userData.name || '' },
            baseTimezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        };

        const user = await userRepository.create(createData);
        const { accessToken, refreshToken } = this.generateTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        return { user: this._formatUser(user), accessToken, refreshToken };
    }

    async login(email, password) {
        const normalizedEmail = email?.toLowerCase().trim();
        const user = await userRepository.findByEmail(normalizedEmail);
        
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`[DEBUG] Login attempt: email=[${normalizedEmail}], NODE_ENV=[${process.env.NODE_ENV}]`);
        }

        // DEV BYPASS: Allow demo user even if password or DB lookup fails in development
        if (process.env.NODE_ENV !== 'production' && normalizedEmail === 'demo@chronex.app' && password === 'password123') {
            logger.info(`Auth Bypass: Logging in as demo user [${normalizedEmail}]`);
            let demoUser = user;
            if (!demoUser) {
                console.info('Auto-creating demo@chronex.app user for development mode...');
                demoUser = await userRepository.create({
                    email: 'demo@chronex.app',
                    password: 'password123',
                    profile: { name: 'Demo User' },
                    slug: 'demo-user'
                });
            }
            const { accessToken, refreshToken } = this.generateTokens(demoUser._id);
            demoUser.refreshToken = refreshToken;
            await demoUser.save();
            return { user: this._formatUser(demoUser), accessToken, refreshToken };
        }

        if (!user || !(await user.comparePassword(password, user.password))) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        const { accessToken, refreshToken } = this.generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        return { user: this._formatUser(user), accessToken, refreshToken };
    }

    async getMe(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }
        return { user: this._formatUser(user) };
    }

    async refresh(token) {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'chronex-dev-refresh-secret-key');
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
