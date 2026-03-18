require('dotenv').config();
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// --- SETUP EMAIL TRANSPORTER (GMAIL) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Get All Pending Suppliers
const getPendingSuppliers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.supplier_id, s.name, s.company_name, s.contact_info, s.status, u.email 
             FROM suppliers s
             JOIN users u ON s.user_id = u.id
             WHERE s.status = 'Pending'`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Approve or Reject Supplier
const updateSupplierStatus = async (req, res) => {
    const { id } = req.params; // Supplier ID
    const { status } = req.body; // 'Approved' or 'Rejected'

    try {
        // A. Update Supplier Table
        const supplierResult = await pool.query(
            'UPDATE suppliers SET status = $1 WHERE supplier_id = $2 RETURNING *',
            [status, id]
        );

        if (supplierResult.rows.length === 0) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const userId = supplierResult.rows[0].user_id;

        // B. If Approved, send verification email
        if (status === 'Approved') {
            // Get User Email
            const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
            const userEmail = userResult.rows[0].email;

            // Generate Verification Token (7 days expiry)
            const emailToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
            const url = `http://localhost:5000/api/auth/verify/${emailToken}`;

            // Send Approval + Verification Email
            await transporter.sendMail({
                to: userEmail,
                subject: 'Congratulations! Supplier Request Approved',
                html: `
                    <h2>Welcome to the Team!</h2>
                    <p>Your request to become a supplier has been approved by the owner.</p>
                    <p>Please click the link below to verify your account and log in:</p>
                    <a href="${url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify & Login Now</a>
                `
            });

            console.log(`✅ Verification email sent to supplier: ${userEmail}`);
        }

        res.json({ message: `Supplier ${status} successfully!` });

    } catch (err) {
        console.error("Supplier status update error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Get All Approved/Active Suppliers
const getApprovedSuppliers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.supplier_id, s.name, s.company_name, s.contact_info, s.status, u.email 
             FROM suppliers s
             JOIN users u ON s.user_id = u.id
             WHERE s.status IN ('Approved', 'Active')`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getPendingSuppliers, updateSupplierStatus, getApprovedSuppliers };