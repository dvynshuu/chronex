const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    type: { type: String, required: true, index: true }, // 'api_call', 'user_session', 'error'
    path: String,
    method: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: Object,
    timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
