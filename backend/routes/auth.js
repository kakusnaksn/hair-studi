const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register a new customer
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login a user (customer, stylist, admin)
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/request-password-reset
// @desc    Request password reset
// @access  Public
router.post('/request-password-reset', authController.requestPasswordReset);

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using a token
// @access  Public
router.post('/reset-password/:token', authController.resetPassword);


module.exports = router;
