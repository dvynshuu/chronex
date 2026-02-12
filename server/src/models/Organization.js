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
    }
}, {
    timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
