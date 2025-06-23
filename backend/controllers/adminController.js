// backend/controllers/adminController.js
const db = require('../db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Same as in authController

// Helper function to get role_id (can be shared or redefined)
const getRoleId = async (roleName) => {
    const { rows } = await db.query('SELECT role_id FROM user_roles WHERE role_name = $1', [roleName]);
    if (rows.length === 0) {
        // This should ideally not happen if DB is set up correctly
        throw new Error(`Role '${roleName}' not found. Critical server configuration error.`);
    }
    return rows[0].role_id;
};

// @desc    Admin creates a new stylist account
// @route   POST /api/admin/stylists
// @access  Private/Admin
exports.createStylistAccount = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required: firstName, lastName, email, phoneNumber, password.' });
    }

    // Add more robust validation for email, phone, password strength if needed

    try {
        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1 OR phone_number = $2', [email, phoneNumber]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email or phone number already exists.' });
        }

        const stylistRoleId = await getRoleId('stylist'); // Ensure 'stylist' role exists
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserQuery = `
            INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, email, first_name, last_name, role_id;
        `;
        const values = [firstName, lastName, email, phoneNumber, hashedPassword, stylistRoleId];
        const { rows } = await db.query(newUserQuery, values);
        const newStylist = rows[0];

        // --- NOTIFICATION PLACEHOLDER ---
        // sendStylistWelcomeEmail(newStylist.email, newStylist.first_name, password); // password is the plain text one from req.body
        // console.log(`Placeholder: Send welcome email with login details to new stylist ${newStylist.email}`);
        // --- END NOTIFICATION PLACEHOLDER ---

        // Exclude password_hash from the returned user object
        const { password_hash, ...stylistDetails } = newStylist;

        res.status(201).json({
            message: 'Stylist account created successfully.',
            stylist: stylistDetails,
        });

    } catch (error) {
        console.error('Error creating stylist account:', error);
        if (error.message.includes("Role 'stylist' not found")) {
             return res.status(500).json({ message: "Server configuration error: Stylist role not found. Cannot create stylist." });
        }
        res.status(500).json({ message: 'Server error during stylist account creation.' });
    }
};

// Future admin functions (e.g., editUser, deleteUser, listUsers) can be added here.
