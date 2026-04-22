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
        const org = await Organization.findByIdAndUpdate(
            orgId,
            { $addToSet: { members: { user: userId, role } } },
            { new: true }
        );
        if (!org) throw new Error('Organization not found');
        return org;
    }

    async getOrgDashboard(orgId) {
        const org = await Organization.findById(orgId).populate('members.user', 'profile email baseTimezone workSchedule statusOverride');
        if (!org) return null;

        // Calculate stats & individual statuses
        const stats = { active: 0, away: 0, sleeping: 0, total: org.members.length };
        const membersData = org.members.map(m => {
            const user = m.user;
            const status = this._computeUserStatus(user);

            if (status.label === 'Available') stats.active++;
            else if (status.label === 'Sleeping') stats.sleeping++;
            else stats.away++;

            return {
                id: user._id,
                name: user.profile?.name || user.email,
                location: user.baseTimezone,
                status: status.label,
                statusLabel: status.label,
                statusIcon: status.icon,
                statusColor: status.color,
                timezone: user.baseTimezone
            };
        });

        return {
            name: org.name,
            stats,
            members: membersData
        };
    }

    async getUserOrganization(userId) {
        return await Organization.findOne({ 'members.user': userId });
    }

    _computeUserStatus(user) {
        const { DateTime } = require('luxon');
        const tz = user.baseTimezone || 'UTC';
        const now = DateTime.local().setZone(tz);
        const hour = now.hour;
        const workStart = user.workSchedule?.workStart ?? 9;
        const workEnd = user.workSchedule?.workEnd ?? 17;

        if (hour >= workStart && hour < workEnd) {
            return { label: 'Available', icon: '🟢', color: '#10b981' };
        }
        if (hour >= 22 || hour < 5) {
            return { label: 'Sleeping', icon: '🌙', color: '#6366f1' };
        }
        return { label: 'Off Hours', icon: '🏠', color: '#f59e0b' };
    }
}

module.exports = new OrganizationService();
