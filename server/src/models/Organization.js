const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        }
    }],
    settings: {
        sharedTimezones: [{
            city: String,
            timezone: String
        }]
    },
    norms: {
        noMeetingDays: { type: [Number], default: [5] }, // Default: No-Meeting Friday
        focusWindow: {
            start: { type: Number, default: 9 }, // 9 AM
            end: { type: Number, default: 11 }   // 11 AM
        },
        asyncHours: {
            start: { type: Number, default: 13 }, // 1 PM
            end: { type: Number, default: 15 }    // 3 PM
        },
        meetingFreeBlocks: [{
            day: Number, // 1-7 (Luxon)
            start: Number,
            end: Number
        }],
        handoffWindows: [{
            day: Number,
            start: Number,
            end: Number
        }],
        fairnessEnabled: { type: Boolean, default: true },
        maxDailyMeetings: { type: Number, default: 4 },
        enforcementLevel: { type: String, enum: ['strict', 'advisory'], default: 'advisory' }
    }
}, {
    timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
