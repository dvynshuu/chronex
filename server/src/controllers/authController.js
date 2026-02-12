const authService = require('../services/authService');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
            const tokens = await authService.refresh(refreshToken);
            res.status(200).json(tokens);
        } catch (err) {
            res.status(401).json({ message: 'Invalid refresh token' });
        }
    }
}

module.exports = new AuthController();
