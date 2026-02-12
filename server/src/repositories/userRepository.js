const User = require('../models/User');

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email }).select('+password');
    }

    async findById(id) {
        return await User.findById(id);
    }

    async create(userData) {
        return await User.create(userData);
    }

    async update(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async findByRefreshToken(token) {
        return await User.findOne({ refreshToken: token });
    }
}

module.exports = new UserRepository();
