// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route for Admin to create a new stylist account
router.post(
    '/stylists',
    protect, // User must be logged in
    authorize('admin'), // Only users with 'admin' role
    adminController.createStylistAccount
);

// Placeholder for other admin routes (e.g., managing services, users, settings)
// router.get('/users', protect, authorize('admin'), adminController.getAllUsers);
// router.put('/users/:userId', protect, authorize('admin'), adminController.updateUser);

module.exports = router;
