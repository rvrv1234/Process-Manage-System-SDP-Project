const pool = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { logAudit } = require('../utils/auditLogger');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Request Password Reset
const requestReset = async (req, res) => {
    const { email } = req.body;
    try {
        // Check if user exists (case insensitive)
        const result = await pool.query('SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = result.rows[0];

        // Generate 6-digit Code & Expiry
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        //  Update User Record
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE id = $3',
            [resetToken, resetExpiry, user.id]
        );

        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Code',
            html: `
                <h3>Hello ${user.name},</h3>
                <p>You requested a password reset. Your reset code is:</p>
                <h2 style="color: #059669; font-size: 24px; letter-spacing: 5px;">${resetToken}</h2>
                <p>This code is valid for 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        });

        res.json({ message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.error("Error in requestReset:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        //  Verify Token & Expiry
        const result = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_expiry > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or Expired Token' });
        }

        const userId = result.rows[0].id;

        //  Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update Password & Clear Token
        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2',
            [hashedPassword, userId]
        );

        await logAudit(userId, 'PASSWORD_RESET_TOKEN', 'users', userId);

        res.json({ message: 'Password has been reset successfully!' });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

module.exports = { requestReset, resetPassword };
