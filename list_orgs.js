const mongoose = require('mongoose');
const Organization = require('./server/src/models/Organization');
const User = require('./server/src/models/User');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/chronex');
        console.log('Connected to DB');
        
        const orgs = await Organization.find({}).populate('members.user', 'profile email');
        console.log('Orgs found:', orgs.length);
        
        orgs.forEach(org => {
            console.log(`Org: ${org.name} (${org._id})`);
            org.members.forEach(m => {
                console.log(` - ${m.user?.profile?.name || m.user?.email || 'Unknown'} (Role: ${m.role})`);
            });
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
