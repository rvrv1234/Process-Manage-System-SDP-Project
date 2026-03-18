require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For verification links
const nodemailer = require('nodemailer');

// --- 1. SETUP EMAIL TRANSPORTER (GMAIL) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Reads from .env
        pass: process.env.EMAIL_PASS  // Reads from .env
    }
});

// --- 2. REGISTER USER ---
const registerUser = async (req, res) => {
    // Get all potential fields from the frontend
    const { name, email, password, role, phone, address, company_name, description } = req.body;

    try {
        // A. Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // B. Hash the Password (Security)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // C. Insert into USERS table
        // We set is_verified to FALSE initially
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role, phone, address, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, hashedPassword, role, phone, address, false]
        );
        
        const userId = newUser.rows[0].id;

        // D. Insert into ROLE-SPECIFIC Tables
        if (role === 'customer') {
            await pool.query('INSERT INTO customers (user_id, address) VALUES ($1, $2)', [userId, address]);
        } 
        else if (role === 'supplier') {
            // Includes Name, Description, and Status='Pending'
            await pool.query(
                'INSERT INTO suppliers (user_id, name, address, company_name, contact_info, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                [userId, name, address, company_name, phone, description, 'Pending']
            );
            
            // 🛑 STOP HERE FOR SUPPLIERS
            // Do NOT send the verification email yet. The Admin must approve first.
            return res.status(201).json({ 
                message: 'Request sent to Owner! You will receive an email once approved.' 
            });
        }
        else if (role === 'inventory_manager' || role === 'production_manager') {
            // Staff logic
            const dept = role === 'inventory_manager' ? 'Inventory' : 'Production';
            await pool.query('INSERT INTO staff (user_id, department, address) VALUES ($1, $2, $3)', [userId, dept, address]);
        }
        else if (role === 'delivery_manager') {
             await pool.query('INSERT INTO delivery_staff (user_id, address) VALUES ($1, $2)', [userId, address]);
        }

        // E. Generate Verification Token & Send Email
        // This will send verification emails to any registering role (Customers, Staff) except Suppliers.
        const emailToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // This link points to your BACKEND, which will then redirect to Frontend
        const url = `http://localhost:5000/api/auth/verify/${emailToken}`;

        await transporter.sendMail({
            to: email,
            subject: 'Verify Your Email - Spices App',
            html: `
                <h3>Welcome to Spices App!</h3>
                <p>Please click the link below to verify your email address:</p>
                <a href="${url}">Verify Email</a>
            `
        });

        res.status(201).json({ message: `Registration successful! Please check ${email} to verify.` });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// --- 3. LOGIN USER (UPDATED) ---
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // A. Find User
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid Credentials' });

        const user = result.rows[0];

        // B. Check Password using Bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // C. Check Verification Status (UPDATED LOGIC)
        // Customers verify via email sent at registration.
        // Suppliers verify via email sent when the Owner approves their request.
        // Staff, Delivery, and Owners SKIP this check entirely.
        const rolesRequiringVerification = ['customer', 'supplier'];

        if (rolesRequiringVerification.includes(user.role) && !user.is_verified) {
            // Supplier-specific message vs Customer message
            const msg = user.role === 'supplier' 
                ? 'Your request is still pending approval from the Owner, or you have not verified your email yet.' 
                : 'Please verify your email first (Check your inbox)';
            return res.status(403).json({ message: msg });
        }

        // D. Login Success -> Send Token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            message: 'Login Successful',
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- 4. VERIFY EMAIL ROUTE ---
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Debugging: Check if Secret is loaded
        if (!process.env.JWT_SECRET) {
            console.error("ERROR: JWT_SECRET is missing in .env or not loaded!");
            return res.status(500).send("Server Configuration Error: Missing Secret");
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log("✅ Token Verified for User ID:", decoded.id);

        // Update user to verified
        await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [decoded.id]);
        
        // Redirect to Frontend Login Page
        const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(frontend); 
        
    } catch (error) {
        console.error("❌ VERIFICATION FAILED:", error.message);
        res.status(400).send(`Verification Failed: ${error.message}`);
    }
};

// --- 5. FORGOT PASSWORD (DEBUG VERSION) ---
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log("1. Received Forgot Password Request for:", email);

    try {
        // A. Check if user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log("❌ User not found in database.");
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        console.log("2. User Found:", user.email);

        // B. Generate Reset Token
        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        // C. Check Email Credentials
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("❌ ERROR: Missing EMAIL_USER or EMAIL_PASS in .env file");
            return res.status(500).json({ message: 'Server Config Error: Email credentials missing' });
        }

        console.log("3. Preparing to send email via:", process.env.EMAIL_USER);

        // D. Send Email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        await transporter.sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Reset Your Password</h3>
                <p>Click the link below to reset your password.</p>
                <a href="${resetUrl}">Reset Password</a>
            `
        });

        console.log("✅ Email sent successfully!");
        res.json({ message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.error("❌ EMAIL SENDING ERROR:", error);
        res.status(500).json({ message: 'Error sending email: ' + error.message });
    }
};

// --- 6. RESET PASSWORD (UPDATE DB) ---
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // A. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // B. Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // C. Update Password in DB
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);

        res.json({ message: 'Password has been reset successfully! You can now log in.' });

    } catch (error) {
        res.status(400).json({ message: 'Invalid or Expired Token' });
    }
};

module.exports = { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword };