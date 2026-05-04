const locationService = require('../services/locationService');

exports.getCities = async (req, res, next) => {
    try {
        const cities = await locationService.getCities();
        res.status(200).json(cities);
    } catch (err) {
        next(err);
    }
};
