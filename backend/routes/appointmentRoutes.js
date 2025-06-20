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
// router.get(
//     '/my-appointments',
//     protect,
//     authorize('customer'),
//     appointmentController.getCustomerAppointments
// );

module.exports = router;
