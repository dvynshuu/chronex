const mongoose = require('mongoose');

const meetingOutcomeSchema = new mongoose.Schema({
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wasSuccess: { type: Boolean, default: true },
    painReduced: { type: Boolean, default: false }, // Did Chronex actually save time/stress?
    score: { type: Number, min: 1, max: 5 }, // 1: Major Friction, 5: Perfect Sync
    duration: { type: Number, default: 30 }, // minutes
    attendanceCount: { type: Number, default: 0 },
    rescheduleCount: { type: Number, default: 0 },
    sentiment: {
        label: { type: String, enum: ['Productive', 'Tiring', 'Chaotic', 'Efficient', 'Neutral'], default: 'Neutral' },
        score: { type: Number, min: 1, max: 5, default: 3 }
    },
    fairnessHit: { type: Number, default: 0 }, // Calculated hit to user's balance
    attentionCost: { type: Number, default: 0 },
    comments: String,
    metadata: {
        violatedPolicy: String,
        isSocialHour: Boolean,
        isSleepHour: Boolean,
        focusTimeImpact: { type: Number, default: 0 } // minutes of focus time lost/gained
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MeetingOutcome', meetingOutcomeSchema);
