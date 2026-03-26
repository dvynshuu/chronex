const mongoose = require('mongoose');
const Organization = require('./server/src/models/Organization');
const User = require('./server/src/models/User');

async function cleanup() {
    try {
        await mongoose.connect('mongodb://localhost:27017/chronex');
        console.log('Connected to DB');
        
        // Find the mock users
        const mockUsers = await User.find({
            email: { $in: ['sarah@chronex.app', 'james@chronex.app'] }
        });
        const mockUserIds = mockUsers.map(u => u._id);
        
        console.log('Found mock users:', mockUserIds.length);
        
        // Remove them from all orgs
        const result = await Organization.updateMany(
            {},
            { $pull: { members: { user: { $in: mockUserIds } } } }
        );
        
        console.log('Organizations updated:', result.modifiedCount);
        
        // Optionally remove the users themselves
        await User.deleteMany({ _id: { $in: mockUserIds } });
        console.log('Mock users deleted');
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
