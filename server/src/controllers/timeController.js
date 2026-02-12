const timezoneService = require('../services/timezoneService');
const cache = require('../utils/cache');

class TimeController {
    async getCurrentTimes(req, res, next) {
        try {
            const { zones } = req.query;
            if (!zones) return res.status(400).json({ message: 'Timezones are required' });

            const zoneList = Array.isArray(zones) ? zones : zones.split(',');
            const cacheKey = `times:${zoneList.sort().join('-')}`;

            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }

            const result = timezoneService.getCurrentTimes(zoneList);

            // Cache for 1 minute
            await cache.setEx(cacheKey, 60, JSON.stringify(result));

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async compare(req, res, next) {
        try {
            const { utcTime, zones } = req.body;
            if (!utcTime || !zones) return res.status(400).json({ message: 'utcTime and zones are required' });

            const result = timezoneService.compareTimezones(utcTime, zones);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async suggestMeeting(req, res, next) {
        try {
            const { zones, duration } = req.body;
            if (!zones) return res.status(400).json({ message: 'Participant zones are required' });

            const suggestions = timezoneService.findOverlap(zones, duration);
            res.status(200).json(suggestions);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TimeController();
