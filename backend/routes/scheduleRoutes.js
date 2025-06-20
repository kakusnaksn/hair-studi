// backend/routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Set/Update a stylist's weekly schedule
// Admin can set for any stylist, Stylist can set for themselves (needs more refined check or separate routes)
// For now, let's assume Admin primarily uses this.
router.post(
    '/stylist/:stylistId',
    protect,
    authorize('admin'), // Or 'admin', 'stylist' with check in controller stylistId === req.user.userId
    scheduleController.setStylistWeeklySchedule
);

// Get a stylist's weekly schedule
router.get(
    '/stylist/:stylistId',
    // protect, // Could be protected or public based on studio policy
    scheduleController.getStylistWeeklySchedule
);

// Get available appointment slots
router.get(
    '/availability',
    scheduleController.getAvailableSlots
);

// Add a blocked time slot (e.g., for breaks, holidays)
// Admin can block for any stylist or studio-wide, Stylist for themselves.
router.post(
    '/block',
    protect,
    authorize('admin', 'stylist'), // Add check in controller: if role is stylist, stylist_id in body must match req.user.userId or be null for personal break not tied to a user for some reason (less likely)
    scheduleController.addBlockedTimeSlot
);

module.exports = router;
