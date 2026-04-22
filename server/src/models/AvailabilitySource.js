const mongoose = require('mongoose');

const availabilitySourceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['google_calendar', 'outlook', 'slack', 'manual'], default: 'manual' },
    externalId: String,
    accessToken: String,
    refreshToken: String,
    syncToken: String,
    isActive: { type: Boolean, default: true },
    lastSynced: Date,
    config: {
        workHoursOnly: { type: Boolean, default: true },
        ignoreAllDayEvents: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AvailabilitySource', availabilitySourceSchema);
