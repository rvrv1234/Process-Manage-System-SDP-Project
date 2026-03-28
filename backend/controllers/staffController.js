const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

// --- A. STAFF MANAGEMENT FUNCTIONS ---

// 1. Get All Staff
const getStaff = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM staff ORDER BY staff_id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching staff:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Add New Staff
const addStaff = async (req, res) => {
    const { name, role, email, phone, password } = req.body;
    try {
        if (!name || !role || !email || !password) {
            return res.status(400).json({ message: "Please provide Name, Role, Email, and Password." });
        }

        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        await pool.query('BEGIN');

        // Hash provided password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Map role to user role expected by frontend
        let userRole = 'inventory_manager';
        if (role === 'Delivery Staff') {
            userRole = 'delivery_manager';
        } else if (role === 'Staff') {
            userRole = 'inventory_manager'; // complies with users_role_check
        } else {
            userRole = role.toLowerCase().replace(' ', '_');
        }

        // Insert into users table
        await pool.query(
            "INSERT INTO users (name, email, password, role, phone, is_verified) VALUES ($1, $2, $3, $4, $5, true)",
            [name, email, hashedPassword, userRole, phone]
        );

        // Insert into staff table (including hashed password as requested)
        const result = await pool.query(
            "INSERT INTO staff (name, role, email, phone, status, password) VALUES ($1, $2, $3, $4, 'Active', $5) RETURNING *",
            [name, role, email, phone, hashedPassword]
        );

        await pool.query('COMMIT');
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'ADD_STAFF', 'staff', result.rows[0].staff_id);
        
        res.json(result.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error adding staff:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Remove Staff
const deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('BEGIN');

        // Delete from staff table first
        const result = await pool.query("DELETE FROM staff WHERE staff_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: "Staff member not found" });
        }

        // Delete from users table using the email from the deleted staff record
        const staffEmail = result.rows[0].email;
        if (staffEmail) {
            await pool.query("DELETE FROM users WHERE email = $1", [staffEmail]);
        }

        await pool.query('COMMIT');
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'DELETE_STAFF', 'staff', id);
        
        res.json({ message: "Staff removed successfully" });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error deleting staff:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- B. CATALOG MANAGEMENT FUNCTIONS ---

// 4. Update Catalog (Packets)
const updateCatalog = async (req, res) => {
    const { productId, packets } = req.body; 

    if (!productId || !packets) {
        return res.status(400).json({ message: "Product ID and Packets are required." });
    }

    try {
        await pool.query('BEGIN'); // Start Transaction

        for (const [weight, quantity] of Object.entries(packets)) {
            const qty = parseInt(quantity, 10) || 0;

            // Upsert Logic: Insert if new, ADD to existing if exists
            await pool.query(
                `INSERT INTO product_packets (inventory_id, weight, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (inventory_id, weight)
                 DO UPDATE SET quantity = product_packets.quantity + EXCLUDED.quantity`,
                [productId, weight, qty]
            );
        }

        await pool.query('COMMIT'); // Save Changes
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_CATALOG_PACKETS', 'product_packets', productId);
        
        res.json({ message: 'Catalog updated successfully!' });

    } catch (error) {
        await pool.query('ROLLBACK'); // Undo changes if error
        console.error('Error updating catalog:', error.message);
        res.status(500).json({ message: 'Server error while updating catalog' });
    }
};

// 👇 CRITICAL: Make sure ALL functions are exported here
module.exports = { 
    getStaff, 
    addStaff, 
    deleteStaff, 
    updateCatalog 
};