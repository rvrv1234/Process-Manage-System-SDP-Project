const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { createNotification } = require('../utils/notificationHelper');

const saveOwnerPayment = async (req, res) => {
    console.log("📥 Received Owner Payment:", req.body);
    const { owner_id, supplier_id, total_amount, transaction_id, items } = req.body;
    
    // Dynamically set status and payment method based on transaction_id
    const status = transaction_id ? 'Paid' : 'Pending';
    const payment_method = transaction_id ? 'Online' : 'COD';
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            "INSERT INTO purchase_orders (supplier_id, total_amount, status, payment_method, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING po_id",
            [supplier_id, Number(total_amount), status, payment_method, transaction_id || null]
        );
        const poId = result.rows[0].po_id;

        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    "INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                    [poId, item.material_id, item.quantity, item.unit_price]
                );
            }
        }

        await client.query('COMMIT');

        // Audit Logging
        const auditUserId = req.user?.id || owner_id || null;
        await logAudit(auditUserId, 'PROCESS_PAYMENT', 'purchase_orders', poId);

        // --- NOTIFICATION: Inform the supplier they received a new purchase order ---
        try {
            const supplierUserResult = await pool.query(
                'SELECT user_id FROM suppliers WHERE supplier_id = $1',
                [supplier_id]
            );
            if (supplierUserResult.rows.length > 0) {
                await createNotification(
                    supplierUserResult.rows[0].user_id,
                    `📩 You have received a new purchase order (PO #${poId}) from the owner.`,
                    'info'
                );
            }
        } catch (notifErr) {
            console.error('[Notification] Failed to notify supplier on new PO:', notifErr.message);
        }

        res.status(201).json({ message: "Purchase Order saved successfully", payment_id: poId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error saving owner payment:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

module.exports = { saveOwnerPayment };
