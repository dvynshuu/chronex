const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

async function cleanup() {
    try {
        await mongoose.connect('mongodb://localhost:27017/time-intelligence');
        console.log('Connected to DB');
        
        // Find organizations and prune members
        const orgs = await Organization.find({});
        console.log(`Found ${orgs.length} organizations`);

        for (const org of orgs) {
            console.log(`Processing org: ${org.name}`);
            
            // Filter members to keep only the ones that aren't the mock users
            // Or better, just keep the admin
            const originalCount = org.members.length;
            org.members = org.members.filter(m => {
                // Keep the admin or any user that isn't Sarah/James
                // Actually, let's keep anyone whose email DOESN'T end in @chronex.app
                // but we need to populate to check email.
                return true; 
            });

            // Let's do a direct $pull by email/name fallbacks if possible, 
            // but since it's an array of ObjectIds, we need to find the IDs.
            const mockUsers = await User.find({
                $or: [
                    { email: /@chronex\.app/ },
                    { 'profile.name': /Sarah Chen/ },
                    { 'profile.name': /James Wilson/ }
                ]
            });
            const mockIds = mockUsers.map(u => u._id.toString());
            
            const newMembers = org.members.filter(m => !mockIds.includes(m.user?.toString()));
            
            if (newMembers.length !== originalCount) {
                org.members = newMembers;
                await org.save();
                console.log(`Removed ${originalCount - newMembers.length} members from ${org.name}`);
            }

            // Also delete the users
            if (mockIds.length > 0) {
                const delResult = await User.deleteMany({ _id: { $in: mockIds } });
                console.log(`Deleted ${delResult.deletedCount} mock user records`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
