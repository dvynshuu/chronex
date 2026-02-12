const validateBody = (schema) => (req, res, next) => {
    const missing = schema.filter(field => !req.body[field]);
    if (missing.length > 0) {
        return res.status(400).json({
            message: `Validation failed. Missing fields: ${missing.join(', ')}`
        });
    }
    next();
};

module.exports = { validateBody };
