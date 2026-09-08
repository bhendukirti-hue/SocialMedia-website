const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Validation Error
    if (err.name === "ValidationError") {
        const errors = {};

        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });

        return res.status(400).json({
            success: false,
            message: errors,
        });
    }

    // Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];

        return res.status(400).json({
            success: false,
            message: `${field} already exists`,
        });
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID",
        });
    }

    // Default Error
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

module.exports = errorHandler;