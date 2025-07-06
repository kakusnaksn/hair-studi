// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto'); // For generating reset tokens
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';
const SALT_ROUNDS = 10; // For password hashing

const getRoleId = async (roleName) => {
    const { rows } = await db.query('SELECT role_id FROM user_roles WHERE role_name = $1', [roleName]);
    if (rows.length === 0) throw new Error(`Role '${roleName}' not found.`);
    return rows[0].role_id;
};

exports.register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
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

        // --- NOTIFICATION PLACEHOLDER ---
        // sendWelcomeEmail(newUser.email, newUser.first_name);
        console.log(`Placeholder: Send welcome notification to ${newUser.email}`);
        // --- END NOTIFICATION PLACEHOLDER ---

        res.status(201).json({
            message: 'Customer registered successfully.',
            user: { userId: newUser.user_id, email: newUser.email, firstName: newUser.first_name, lastName: newUser.last_name },
        });
    } catch (error) {
        console.error('Registration error:', error);
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
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });
        const token = jwt.sign( { userId: user.user_id, role: user.role_name }, JWT_SECRET, { expiresIn: '1h' } );
        res.status(200).json({
            message: 'Login successful.', token,
            user: { userId: user.user_id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role_name },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- Password Reset Functions ---
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const { rows: users } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (users.length === 0) {
            console.log(`Password reset request for non-existent email: ${email}`);
            return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link.' });
        }
        const user = users[0];

        await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.user_id]);

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await db.query(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [user.user_id, tokenHash, expiresAt]
        );

        // --- NOTIFICATION PLACEHOLDER ---
        console.log(`Placeholder: Password Reset Token for ${user.email}: ${resetToken}`);
        // --- END NOTIFICATION PLACEHOLDER ---

        res.status(200).json({ message: 'If your email is registered, you will receive a password reset link.' });

    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ message: 'Error processing your request.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const { rows: tokenEntries } = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
            [hashedToken]
        );

        if (tokenEntries.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token.' });
        }
        const tokenEntry = tokenEntries[0];

        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [newPasswordHash, tokenEntry.user_id]
        );

        await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenEntry.id]);

        // --- NOTIFICATION PLACEHOLDER ---
        // const { rows: users } = await db.query('SELECT email FROM users WHERE user_id = $1', [tokenEntry.user_id]);
        // if (users.length > 0) {
        //   sendPasswordChangedConfirmationEmail(users[0].email);
        //   console.log(`Placeholder: Send password changed confirmation to ${users[0].email}`);
        // }
        // --- END NOTIFICATION PLACEHOLDER ---

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error processing your request.' });
    }
};
