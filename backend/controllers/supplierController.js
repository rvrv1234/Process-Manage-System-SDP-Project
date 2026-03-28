require('dotenv').config();
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../utils/auditLogger');

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

        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_SUPPLIER_STATUS', 'suppliers', id);

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
            `SELECT s.supplier_id, s.user_id, s.name, s.company_name, s.contact_info, s.status, u.email 
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

// 4. Update Purchase Order Status (Accepted/Rejected)
const updatePOStatus = async (req, res) => {
    const { id } = req.params; // po_id
    const { status } = req.body; // 'Accepted' or 'Rejected'

    try {
        const result = await pool.query(
            'UPDATE purchase_orders SET status = $1 WHERE po_id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_PO_STATUS', 'purchase_orders', id);

        res.json({ message: `Purchase Order ${status} successfully`, order: result.rows[0] });

    } catch (err) {
        console.error("PO status update error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 5. Create Return Request
const createReturnRequest = async (req, res) => {
    let { po_id, supplier_id, reason } = req.body;
    
    try {
        // --- BACKEND FALLBACK FOR SUPPLIER_ID ---
        if (!supplier_id || supplier_id === undefined) {
          const poResult = await pool.query("SELECT supplier_id FROM purchase_orders WHERE po_id = $1", [po_id]);
          if (poResult.rows.length > 0) {
            supplier_id = poResult.rows[0].supplier_id;
          } else {
            return res.status(404).json({ message: "Purchase Order not found to determine supplier." });
          }
        }

        console.log('Final Payload to DB:', { po_id, supplier_id, reason });

        const result = await pool.query(
            "INSERT INTO owner_return_requests (po_id, supplier_id, reason, status) VALUES ($1, $2, $3, 'Pending') RETURNING *",
            [po_id, supplier_id, reason]
        );
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'CREATE_RETURN_REQUEST', 'owner_return_requests', result.rows[0].return_id);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating return request:", err.message);
        res.status(500).json({ message: "Server Error: " + err.message });
    }
};

// 6. Get Return Requests for a Supplier
const getReturnRequestsBySupplier = async (req, res) => {
    const { supplierId } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.*, po.order_date, po.total_amount 
             FROM owner_return_requests r
             JOIN purchase_orders po ON r.po_id = po.po_id
             WHERE r.supplier_id = $1
             ORDER BY r.request_date DESC`,
            [supplierId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching return requests:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 7. Update Return Request Status (Approve/Reject)
const updateReturnStatus = async (req, res) => {
    const { id } = req.params; // return_id
    const { status } = req.body; // 'Approved' or 'Rejected'
    try {
        const result = await pool.query(
            "UPDATE owner_return_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE return_id = $2 RETURNING *",
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Return request not found" });
        }
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_RETURN_STATUS', 'owner_return_requests', id);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating return status:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { 
    getPendingSuppliers, 
    updateSupplierStatus, 
    getApprovedSuppliers, 
    updatePOStatus,
    createReturnRequest,
    getReturnRequestsBySupplier,
    updateReturnStatus
};