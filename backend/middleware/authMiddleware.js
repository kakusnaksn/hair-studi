// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';

// General authentication middleware
exports.protect = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // req.user will have { userId, role }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// Role-based authorization middleware
exports.authorize = (...roles) => { // Pass allowed roles as arguments
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'User role not found. Forbidden.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role '${req.user.role}' is not authorized for this resource.` });
        }
        next();
    };
};
