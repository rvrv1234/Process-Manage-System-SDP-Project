const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { notifyUsersByRole } = require('../utils/notificationHelper');

// 1. Get All Production Batches
const getBatches = async (req, res) => {
    try {
        const query = `
            SELECT b.*, p.name as product_name 
            FROM production_batches b
            JOIN products p ON b.product_id = p.product_id
            ORDER BY b.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching batches:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Update Batch Status (Now handles Order Bundles by order_id)
const updateBatchStatus = async (req, res) => {
    const { id } = req.params; 
    console.log('Attempting to start production for ID:', id);
    const { status } = req.body; // 'In Process' or 'Completed'

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bypassing 'orders_status_check': Not needed anymore! The constraints have been globally updated to accept 'Ready for Delivery'.
        // Synchronizing explicitly per User Instruction: orders.status and production_batches BOTH get 'Ready for Delivery'
        let orderStatus = status === 'Completed' ? 'READY FOR DELIVERY' : 'PROCESSING';
        await client.query("UPDATE orders SET status = $1 WHERE order_id = $2", [orderStatus, id]);

        // Status Sync: Push 'Ready for Delivery' straight onto production_batches so Delivery Board locks it
        let batchStatus = status === 'Completed' ? 'Ready for Delivery' : status;
        let batchQuery = "UPDATE production_batches SET status = $1 WHERE order_id = $2 RETURNING *";
        if (status === 'Completed') {
            batchQuery = "UPDATE production_batches SET status = $1, completed_date = CURRENT_DATE WHERE order_id = $2 RETURNING *";
        } else if (status === 'In Process') {
            batchQuery = "UPDATE production_batches SET status = $1, start_date = CURRENT_DATE WHERE order_id = $2 RETURNING *";
        }
        await client.query(batchQuery, [batchStatus, id]);

        await client.query('COMMIT');

        // Separate delivery creation from the main transaction
        if (status === 'Completed') {
            try {
                await pool.query("INSERT INTO deliveries (order_id, delivery_status) VALUES ($1, 'ASSIGNED')", [id]);
            } catch (deliveryErr) {
                console.error('Non-critical error creating delivery record:', deliveryErr.message);
            }

            // --- NOTIFICATION: Inform all delivery staff a new pickup is available ---
            await notifyUsersByRole('delivery_manager', `🚚 A new delivery is available! Order #${id} is ready for pickup.`, 'info');
        }

        // Audit Log Fix: Ensure req.user.id exists securely before passing it.
        if (!req.user || !req.user.id) {
            console.error('Audit Log Blocked: req.user.id is officially undefined!');
        } else {
            let auditAction = status === 'Completed' ? 'COMPLETE_BUNDLE_PRODUCTION' : 'START_BUNDLE_PRODUCTION';
            await logAudit(req.user.id, auditAction, 'orders', id);
        }

        res.json({ message: "Status updated successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('--- PRODUCTION ERROR TRACE ---', error);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 3. Get Grouped Orders for Bundling
const getGroupedOrders = async (req, res) => {
    try {
        const query = `
            SELECT o.order_id, u.name as customer_name, 
                   MAX(b.status) as status, 
                   MIN(b.due_date) as due_date,
                   MAX(b.assigned_team) as assigned_team,
                   (
                       SELECT STRING_AGG(oi.quantity || 'x ' || p.name || ' (' || oi.packet_size || ')', ', ')
                       FROM orderitems oi
                       JOIN products p ON oi.product_id = p.product_id
                       WHERE oi.order_id = o.order_id
                   ) as merged_items
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            JOIN production_batches b ON o.order_id = b.order_id
            GROUP BY o.order_id, u.name
            ORDER BY o.order_id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching grouped orders:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};



module.exports = {
    getBatches,
    updateBatchStatus,
    getGroupedOrders
};
