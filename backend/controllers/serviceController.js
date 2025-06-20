// backend/controllers/serviceController.js
const db = require('../db');

// @desc    Add a new service
// @route   POST /api/services
// @access  Private/Admin
exports.addService = async (req, res) => {
    const { serviceName, description, durationMinutes, price } = req.body;

    if (!serviceName || !durationMinutes || !price) {
        return res.status(400).json({ message: 'Service name, duration, and price are required.' });
    }

    if (isNaN(parseInt(durationMinutes)) || parseInt(durationMinutes) <= 0) {
        return res.status(400).json({ message: 'Duration must be a positive number.' });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: 'Price must be a positive number.' });
    }

    try {
        const query = `
            INSERT INTO services (service_name, description, duration_minutes, price)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [serviceName, description, parseInt(durationMinutes), parseFloat(price)];
        const { rows } = await db.query(query, values);

        res.status(201).json({
            message: 'Service added successfully.',
            service: rows[0],
        });
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).json({ message: 'Server error while adding service.' });
    }
};

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM services ORDER BY service_name ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Server error while fetching services.' });
    }
};

// @desc    Get a specific service by ID
// @route   GET /api/services/:id (Example, not creating route for this now, just helper)
// @access  Public or Private
exports.getServiceById = async (serviceId) => {
    const { rows } = await db.query('SELECT * FROM services WHERE service_id = $1', [serviceId]);
    if (rows.length === 0) {
        // Consider throwing an error or returning null based on how you want to handle "not found"
        // For createAppointment, throwing an error that can be caught is good.
        throw new Error(`Service with ID ${serviceId} not found.`);
    }
    return rows[0];
};
