// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create a new appointment
router.post(
    '/',
    protect, // User must be logged in
    authorize('customer', 'admin'), // Allow customers to book for themselves, or admin to book for anyone
    appointmentController.createAppointment
);

// Get appointments for the logged-in customer (Example for a future step)
router.get(
    '/my-appointments', // Matches the path used in frontend api.js
    protect,
    authorize('customer'), // Only customers can see their own appointments via this route
    appointmentController.getMyAppointments
);

// Update an appointment's status
router.patch( // Using PATCH as it's a partial update
    '/:appointmentId/status',
    protect,
    authorize('stylist', 'admin', 'customer'), // Customer role added for cancellation
    appointmentController.updateAppointmentStatus
);

module.exports = router;
