const mongoose = require('mongoose');
const path = require('path');

async function check() {
    try {
        const mongoUrl = 'mongodb://localhost:27017/chronex';
        await mongoose.connect(mongoUrl);
        console.log('Connected to:', mongoUrl);
        
        // Define schema manually to avoid path issues
        const userSchema = new mongoose.Schema({
            email: String,
            profile: { name: String },
            slug: String
        });
        const User = mongoose.model('User', userSchema);
        
        const users = await User.find({});
        console.log('Total Users:', users.length);
        console.log('User Data:', JSON.stringify(users, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
