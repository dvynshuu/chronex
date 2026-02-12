const Organization = require('../models/Organization');

class OrganizationService {
    async createOrganization(adminId, name) {
        return await Organization.create({
            name,
            admin: adminId,
            members: [{ user: adminId, role: 'admin' }]
        });
    }

    async addMember(orgId, userId, role = 'member') {
        const org = await Organization.findById(orgId);
        if (!org) throw new Error('Organization not found');

        org.members.push({ user: userId, role });
        return await org.save();
    }

    async getOrgDashboard(orgId) {
        return await Organization.findById(orgId).populate('members.user', 'email profile baseTimezone');
    }
}

module.exports = new OrganizationService();
