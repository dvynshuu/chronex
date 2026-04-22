const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false
    },
    profile: {
        name: String,
        avatar: String,
        preferences: {
            timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
            theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
        }
    },
    baseTimezone: {
        type: String,
        default: 'UTC'
    },
    workSchedule: {
        workStart: { type: Number, default: 9, min: 0, max: 23 },
        workEnd: { type: Number, default: 17, min: 0, max: 23 },
        workDays: { type: [Number], default: [1, 2, 3, 4, 5] } // 1=Mon, 7=Sun
    },
    statusOverride: {
        label: { type: String, default: null },
        expiry: { type: Date, default: null }
    },
    publicProfile: {
        enabled: { type: Boolean, default: false },
        showStatus: { type: Boolean, default: true },
        showOverlap: { type: Boolean, default: true }
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    favorites: [{
        city: String,
        zone: String,
        workStart: { type: Number, default: 9 },
        workEnd: { type: Number, default: 17 }
    }],
    fairnessBalance: { type: Number, default: 0 }, // + for taking "bad" hours, - for "good" hours
    meetingFeedback: [{
        meetingId: mongoose.Schema.Types.ObjectId,
        score: Number, // 1-5
        painReduced: Boolean,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    commitments: [{
        title: String,
        startTime: Date,
        endTime: Date,
        type: { type: String, enum: ['focus', 'meeting', 'personal'], default: 'meeting' }
    }],
    attentionPreferences: {
        minDeepWorkBlock: { type: Number, default: 2 }, // hours
        preferredMeetingWindows: [{ start: Number, end: Number }] // local hours
    },
    refreshToken: String,
    onboarded: { type: Boolean, default: false },
    calendarConnected: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Indexes for performance at scale
userSchema.index({ email: 1 });
userSchema.index({ 'profile.name': 1 });
userSchema.index({ slug: 1 });
userSchema.index({ 'profile.name': 'text', email: 'text', slug: 'text' });

const User = mongoose.model('User', userSchema);

module.exports = User;
