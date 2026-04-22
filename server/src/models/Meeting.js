const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    zone: { type: String, required: true },
    workStart: { type: Number, default: 9, min: 0, max: 23 },
    workEnd: { type: Number, default: 17, min: 0, max: 23 }
});

const meetingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Coordination'
    },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    participants: [participantSchema],
    selectedSlot: {
        type: Object,
        default: null
    },
    startTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: 45
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
