const organizationService = require('../services/organizationService');
const pipelineService = require('../services/pipeline/pipelineService');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { DateTime } = require('luxon');

// Static fallback data for map nodes — real geographic coordinates (lon, lat)
// Frontend converts to viewport % using Equirectangular projection:
//   x% = (lon + 180) / 360 * 100,  y% = (90 - lat) / 180 * 100
const MAP_NODES = [
    { id: 'sf',  lon: -122.42, lat: 37.77,  label: 'San Francisco' },
    { id: 'ny',  lon: -73.94,  lat: 40.71,  label: 'New York' },
    { id: 'lon', lon: -0.12,   lat: 51.51,  label: 'London' },
    { id: 'ber', lon: 13.40,   lat: 52.52,  label: 'Berlin', featured: true },
    { id: 'dub', lon: 55.30,   lat: 25.27,  label: 'Dubai' },
    { id: 'mum', lon: 72.88,   lat: 19.08,  label: 'Mumbai' },
    { id: 'sin', lon: 103.82,  lat: 1.35,   label: 'Singapore' },
    { id: 'tok', lon: 139.69,  lat: 35.68,  label: 'Tokyo' },
    { id: 'syd', lon: 151.21,  lat: -33.87, label: 'Sydney' },
    { id: 'par', lon: 2.35,    lat: 48.86,  label: 'Paris' },
    { id: 'chi', lon: -87.63,  lat: 41.88,  label: 'Chicago' },
    { id: 'hk',  lon: 114.17,  lat: 22.32,  label: 'Hong Kong' },
    { id: 'seo', lon: 126.98,  lat: 37.57,  label: 'Seoul' },
    { id: 'la',  lon: -118.24, lat: 34.05,  label: 'Los Angeles' },
];

const generateOpsPulse = (members = []) => {
    const pulse = [];
    if (members.length === 0) {
        return [
            { 
                id: 'init-1',
                icon: '⚡', 
                color: 'var(--color-primary)', 
                title: 'System Initialized', 
                desc: 'Standing by for team alignment...', 
                time: 'Now',
                details: { traceId: 'TR-00001-INIT', status: 'Standby' }
            }
        ];
    }

    const online = members.filter(m => {
        const tz = m.user?.baseTimezone || 'UTC';
        const now = DateTime.local().setZone(tz);
        const hour = now.hour;
        const workStart = m.user?.workSchedule?.workStart ?? 9;
        const workEnd = m.user?.workSchedule?.workEnd ?? 17;
        return hour >= workStart && hour < workEnd;
    });

    if (online.length > 0) {
        pulse.push({
            id: `sync-${Date.now()}`,
            icon: '✓',
            color: 'var(--color-tertiary)',
            title: 'Team Sync Active',
            desc: `${online.length} nodes currently aligned`,
            time: 'Just now',
            details: {
                traceId: `TR-${Math.floor(Math.random()*90000)+10000}-SYNC`,
                nodes: online.slice(0, 3).map(m => (m.user?.baseTimezone || 'UTC').split('/').pop().toUpperCase()),
                status: 'Success'
            }
        });
    }

    const sleepers = members.filter(m => {
        const tz = m.user?.baseTimezone || 'UTC';
        const now = DateTime.local().setZone(tz);
        return now.hour >= 22 || now.hour < 5;
    });

    if (sleepers.length > 0) {
        pulse.push({
            id: `drift-${Date.now() + 1}`,
            icon: '🌙',
            color: 'var(--color-primary)',
            title: 'Nocturnal Shift',
            desc: `${sleepers.length} nodes in rest cycle`,
            time: 'Active',
            details: {
                traceId: `TR-${Math.floor(Math.random()*90000)+10000}-SHIFT`,
                nodes: sleepers.slice(0, 2).map(m => (m.user?.baseTimezone || 'UTC').split('/').pop().toUpperCase()),
                status: 'Resting'
            }
        });
    }

    return pulse;
};

const _computeStatus = (user) => {
    const tz = user.baseTimezone || 'UTC';
    const now = DateTime.local().setZone(tz);
    const hour = now.hour;
    const workStart = user.workSchedule?.workStart ?? 9;
    const workEnd = user.workSchedule?.workEnd ?? 17;

    if (hour >= workStart && hour < workEnd) return 'online';
    if (hour >= 22 || hour < 5) return 'sleeping';
    return 'offline';
};

const computeRegionalDistribution = (members) => {
    let namer = 0, emea = 0, apac = 0;
    
    // Simplistic grouping
    members.forEach(m => {
        const tz = (m.user?.baseTimezone || '').toLowerCase();
        if (tz.includes('america') || tz.includes('us')) namer++;
        else if (tz.includes('europe') || tz.includes('africa')) emea++;
        else apac++; // Asia, Australia, Pacific
    });
    
    const count = members.length || 1; // avoid div by 0 for max

    return [
        { region: 'North America', members: namer, max: count, color: 'var(--color-primary)' },
        { region: 'Europe & Africa', members: emea, max: count, color: 'var(--color-secondary)' },
        { region: 'Asia Pacific', members: apac, max: count, color: 'var(--color-primary)' }
    ];
};


exports.getDashboardOverview = async (req, res, next) => {
    try {
        const org = await organizationService.getUserOrganization(req.user._id);
        
        // 1. Run Intelligence Pipeline
        const userIds = org ? org.members.map(m => m.user?._id || m.user) : [req.user._id];
        const pipelineResult = await pipelineService.run({
            teamId: org?._id,
            userIds,
            organization: org,
            timeRange: {
                start: DateTime.now().startOf('day').toISO(),
                end: DateTime.now().plus({ days: 7 }).toISO()
            }
        });

        const { metrics, data: optimizedData } = pipelineResult;

        // 2. Synchronicity Calculation (Dashboard Visuals)
        let onlineNow = 0, offlineRest = 0;
        let regionalDistribution = [];

        if (org) {
            await org.populate('members.user', 'baseTimezone workSchedule');
            org.members.forEach(m => {
                const status = _computeStatus(m.user);
                if (status === 'online') onlineNow++;
                else offlineRest++;
            });
            regionalDistribution = computeRegionalDistribution(org.members);
        } else {
            onlineNow = 1; 
            regionalDistribution = computeRegionalDistribution([{ user: req.user }]);
        }

        const totalNodes = onlineNow + offlineRest || 1;
        const synchronicityIndex = Math.round((onlineNow / totalNodes) * 100);

        // 3. Feedback / Sentiment
        const feedback = req.user.meetingFeedback || [];
        const recentFeedback = feedback.filter(f => new Date(f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const syncSentiment = recentFeedback.length > 0 
            ? Math.round((recentFeedback.filter(f => f.painReduced).length / recentFeedback.length) * 100)
            : 88;

        res.status(200).json({
            mapNodes: MAP_NODES,
            synchronicity: { 
                index: synchronicityIndex, 
                onlineNow, 
                offlineRest, 
                syncSentiment, 
                cpi: { index: metrics.teamFairnessIndex, factors: metrics.burdenDistribution } 
            },
            regionalDistribution,
            opsPulse: generateOpsPulse(org?.members || []),
            norms: org?.norms,
            intelligence: {
                recoveryPotential: metrics.potentialRecoveredHours,
                optimizations: optimizedData.recommendations,
                onboarded: req.user.onboarded,
                fairnessScore: metrics.teamFairnessIndex
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getTeamStats = async (req, res, next) => {
    try {
        const org = await organizationService.getUserOrganization(req.user._id);
        
        // In a real system, we'd aggregate historical activity.
        // Here we simulate it based on the org members' typical work cycles.
        let weeklyEnergy = [
            { day: 'MON', namer: 0, emea: 0, apac: 0 },
            { day: 'TUE', namer: 0, emea: 0, apac: 0 },
            { day: 'WED', namer: 0, emea: 0, apac: 0 },
            { day: 'THU', namer: 0, emea: 0, apac: 0 },
            { day: 'FRI', namer: 0, emea: 0, apac: 0 },
            { day: 'SAT', namer: 0, emea: 0, apac: 0 },
            { day: 'SUN', namer: 0, emea: 0, apac: 0 },
        ];

        if (org) {
            await org.populate('members.user', 'baseTimezone');
            org.members.forEach(m => {
                const tz = (m.user?.baseTimezone || '').toLowerCase();
                let region = 'apac';
                if (tz.includes('america') || tz.includes('us')) region = 'namer';
                else if (tz.includes('europe') || tz.includes('africa')) region = 'emea';

                weeklyEnergy.forEach(d => {
                    const base = d.day === 'SAT' || d.day === 'SUN' ? 10 : 40;
                    d[region] += base + Math.floor(Math.random() * 20);
                });
            });
        }

        const temporalPulse = weeklyEnergy.map(d => ({
            day: d.day[0],
            val: Math.min(100, Math.floor((d.namer + d.emea + d.apac) / (org?.members.length || 1) * 1.5))
        }));

        res.status(200).json({
            weeklyEnergy,
            temporalPulse
        });

    } catch (err) {
        next(err);
    }
};
