const CITY_DATABASE = [
    { city: 'London', zone: 'Europe/London', country: 'UK' },
    { city: 'New York', zone: 'America/New_York', country: 'USA' },
    { city: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japan' },
    { city: 'Singapore', zone: 'Asia/Singapore', country: 'Singapore' },
    { city: 'Dubai', zone: 'Asia/Dubai', country: 'UAE' },
    { city: 'Paris', zone: 'Europe/Paris', country: 'France' },
    { city: 'Berlin', zone: 'Europe/Berlin', country: 'Germany' },
    { city: 'Mumbai', zone: 'Asia/Kolkata', country: 'India' },
    { city: 'Sydney', zone: 'Australia/Sydney', country: 'Australia' },
    { city: 'San Francisco', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Los Angeles', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Chicago', zone: 'America/Chicago', country: 'USA' },
    { city: 'Hong Kong', zone: 'Asia/Hong_Kong', country: 'China' },
    { city: 'Seoul', zone: 'Asia/Seoul', country: 'South Korea' }
];

exports.getCities = async (req, res, next) => {
    try {
        res.status(200).json(CITY_DATABASE);
    } catch (err) {
        next(err);
    }
};
