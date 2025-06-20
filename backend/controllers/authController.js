const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key'; // Fallback secret, ensure it's in .env
const SALT_ROUNDS = 10;

// Helper function to get role_id
const getRoleId = async (roleName) => {
    const { rows } = await db.query('SELECT role_id FROM user_roles WHERE role_name = $1', [roleName]);
    if (rows.length === 0) {
        throw new Error(`Role '${roleName}' not found.`);
    }
    return rows[0].role_id;
};

exports.register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1 OR phone_number = $2', [email, phoneNumber]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email or phone number already exists.' });
        }

        const customerRoleId = await getRoleId('customer');
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserQuery = `
            INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, email, first_name, last_name, role_id;
        `;
        const values = [firstName, lastName, email, phoneNumber, hashedPassword, customerRoleId];
        const { rows } = await db.query(newUserQuery, values);
        const newUser = rows[0];

        res.status(201).json({
            message: 'Customer registered successfully.',
            user: {
                userId: newUser.user_id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        // Check for specific errors if needed, e.g., DB connection
        if (error.message && error.message.includes("Role 'customer' not found")) {
             return res.status(500).json({ message: "Server configuration error: Customer role not found." });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const { rows } = await db.query('SELECT u.*, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE u.email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.user_id, role: user.role_name },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role_name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Placeholder for password reset
exports.requestPasswordReset = async (req, res) => {
    // Logic for requesting password reset (e.g., send email with token)
    res.status(501).json({ message: 'Password reset functionality not yet implemented.' });
};

exports.resetPassword = async (req, res) => {
    // Logic for resetting password with token
    res.status(501).json({ message: 'Password reset functionality not yet implemented.' });
};
