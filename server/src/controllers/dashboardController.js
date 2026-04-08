const organizationService = require('../services/organizationService');
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

const generateOpsPulse = () => {
    const now = Date.now();
    return [
        { 
            id: 'sync-1',
            icon: '✓', 
            color: 'var(--color-tertiary)', 
            title: 'Team Sync Completed', 
            desc: 'San Francisco & London clusters aligned', 
            time: '2 mins ago',
            details: {
                traceId: 'TR-88219-SYNC',
                nodes: ['SF-AMER-1', 'LON-EMEA-4'],
                latency: '42ms',
                status: 'Success'
            }
        },
        { 
            id: 'shift-1',
            icon: '→', 
            color: 'var(--color-primary)', 
            title: 'New Shift Start', 
            desc: 'Singapore handover to EMEA node', 
            time: '14 mins ago',
            details: {
                traceId: 'TR-99802-SHIFT',
                nodes: ['SIN-APAC-2', 'BER-EMEA-1'],
                handoff: 'Active',
                status: 'Processing'
            }
        },
        { 
            id: 'drift-1',
            icon: '▲', 
            color: 'var(--color-danger)', 
            title: 'Drift Detected', 
            desc: 'Berlin cluster reporting 2h sync offset', 
            time: '32 mins ago',
            details: {
                traceId: 'TR-00451-ERR',
                nodes: ['BER-EMEA-1'],
                offset: '120 min',
                severity: 'High',
                status: 'Warning'
            }
        },
    ];
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
        
        let onlineNow = 0, offlineRest = 0;
        let overlapping = 0; // Simplified
        let regionalDistribution = [];

        if (org) {
            await org.populate('members.user', 'baseTimezone workSchedule');
            const members = org.members;
            
            members.forEach(m => {
                const status = _computeStatus(m.user);
                if (status === 'online') onlineNow++;
                else offlineRest++;
            });
            // Fake some overlapping for illustration based on total online
            overlapping = Math.floor(onlineNow * 0.4);
            
            regionalDistribution = computeRegionalDistribution(members);
        } else {
            // Fallbacks for standalone user
            onlineNow = 1; 
            offlineRest = 0;
            overlapping = 0;
            regionalDistribution = computeRegionalDistribution([{ user: req.user }]);
        }

        const total = onlineNow + overlapping + offlineRest || 1;
        const index = Math.round((onlineNow / total) * 100);

        res.status(200).json({
            mapNodes: MAP_NODES,
            synchronicity: { index, onlineNow, overlapping, offlineRest },
            regionalDistribution,
            opsPulse: generateOpsPulse()
        });
    } catch (err) {
        next(err);
    }
};

exports.getTeamStats = async (req, res, next) => {
    try {
        // Return dummy temporal statistics directly referencing UI expectations.
        // In a real production system, this would aggregate activity logs or calendar events.
        const WEEK_ENERGY_DATA = [
            { day: 'MON', namer: 35, emea: 45, apac: 20 },
            { day: 'TUE', namer: 40, emea: 38, apac: 30 },
            { day: 'WED', namer: 50, emea: 42, apac: 25 },
            { day: 'THU', namer: 45, emea: 50, apac: 35 },
            { day: 'FRI', namer: 30, emea: 35, apac: 40 },
            { day: 'SAT', namer: 15, emea: 20, apac: 45 },
            { day: 'SUN', namer: 10, emea: 15, apac: 35 },
        ];

        const temporalPulse = [
            { day: 'M', val: 60 }, { day: 'T', val: 85 }, { day: 'W', val: 45 },
            { day: 'T', val: 70 }, { day: 'F', val: 90 }, { day: 'S', val: 30 }, { day: 'S', val: 40 }
        ];

        res.status(200).json({
            weeklyEnergy: WEEK_ENERGY_DATA,
            temporalPulse
        });

    } catch (err) {
        next(err);
    }
};
