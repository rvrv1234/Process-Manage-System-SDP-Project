const pool = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../utils/auditLogger');

// --- SETUP EMAIL (Same as Auth Controller) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- 1. GET PENDING SUPPLIERS ---
const getPendingSuppliers = async (req, res) => {
    try {
        const query = `
            SELECT s.supplier_id, u.id as user_id, u.name, u.email, u.phone, s.company_name, s.description, s.status, s.address
            FROM suppliers s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'Pending' OR s.status IS NULL; 
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- 2. APPROVE SUPPLIER (AND SEND EMAIL) ---
const approveSupplier = async (req, res) => {
    const { id } = req.params; // This is supplier_id

    try {
        // A. Update Status in DB
        const updateResult = await pool.query(
            "UPDATE suppliers SET status = 'Approved' WHERE supplier_id = $1 RETURNING user_id", 
            [id]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // B. Get User Details (Email)
        const userId = updateResult.rows[0].user_id;
        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
        const userEmail = userResult.rows[0].email;

        // C. Generate Verification Token
        const emailToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // This link allows them to verify and then login
        const url = `http://localhost:5000/api/auth/verify/${emailToken}`;

        // D. Send "You are Approved" Email
        await transporter.sendMail({
            to: userEmail,
            subject: 'Congratulations! Supplier Request Approved',
            html: `
                <h2>Welcome to the Team!</h2>
                <p>Your request to become a supplier has been approved by the owner.</p>
                <p>Please click the link below to verify your account and log in:</p>
                <a href="${url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
            `
        });

        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'APPROVE_SUPPLIER', 'suppliers', id);

        res.json({ message: 'Supplier Approved and Email Sent!' });

    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- 3. REJECT SUPPLIER ---
const rejectSupplier = async (req, res) => {
    const { id } = req.params;
    try {
        // Just set status to Rejected (No email sent)
        await pool.query("UPDATE suppliers SET status = 'Rejected' WHERE supplier_id = $1", [id]);
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'REJECT_SUPPLIER', 'suppliers', id);
        
        res.json({ message: 'Supplier Rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getPendingSuppliers, approveSupplier, rejectSupplier };