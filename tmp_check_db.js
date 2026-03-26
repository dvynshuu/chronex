const mongoose = require('mongoose');
const User = require('./server/src/models/User');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/chronex');
        console.log('Connected to DB');
        
        const users = await User.find({
            $or: [
                { 'profile.name': /akash/i },
                { email: /akash/i },
                { slug: /akash/i }
            ]
        });
        
        console.log('Results:');
        console.log(JSON.stringify(users, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
