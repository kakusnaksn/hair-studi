// backend/routes/services.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route to add a new service (Admin only)
router.post(
    '/',
    protect, // Ensures user is logged in
    authorize('admin'), // Ensures user is an admin
    serviceController.addService
);

// Route to get all services (Public)
router.get('/', serviceController.getAllServices);

module.exports = router;
