const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get Available Orders for Pickup
// Queries orders with status 'READY FOR DELIVERY' that have no delivery record yet.
// This bypasses the need for a pre-inserted deliveries row, since delivery_staff_id is NOT NULL.
const getAvailableOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.order_id as id,
                'ASSIGNED' as status,
                'Main Warehouse, Colombo' as pickup,
                c.address as delivery, 
                u.name as customer_name,
                u.phone as phone,
                o.order_date as deadline,
                (
                    SELECT STRING_AGG(oi.quantity || 'x ' || p.name || ' (' || oi.packet_size || ')', ', ')
                    FROM orderitems oi
                    JOIN products p ON oi.product_id = p.product_id
                    WHERE oi.order_id = o.order_id
                ) as items
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            WHERE o.status = 'READY FOR DELIVERY'
              AND NOT EXISTS (
                  SELECT 1 FROM deliveries d WHERE d.order_id = o.order_id
              )
            ORDER BY o.order_id ASC
        `;
        const result = await pool.query(query);
        console.log('Fetched available delivery orders:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching available orders:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Claim (Accept) an Order
// Auto-creates a deliverystaff record if needed, then inserts into deliveries with correct FK.
const claimOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id; // This is users.id from the JWT

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify the order is still available
        const checkRes = await client.query(
            "SELECT order_id FROM orders WHERE order_id = $1 AND status = 'READY FOR DELIVERY'",
            [orderId]
        );
        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Order already claimed or not ready for delivery." });
        }

        // Check no delivery record exists yet (race condition protection)
        const deliveryCheck = await client.query(
            "SELECT delivery_id FROM deliveries WHERE order_id = $1",
            [orderId]
        );
        if (deliveryCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Order already claimed or does not exist." });
        }

        // Upsert into deliverystaff to get a valid FK delivery_staff_id
        // The deliveries.delivery_staff_id FK references deliverystaff.delivery_staff_id (not users.id)
        const staffUpsert = await client.query(
            `INSERT INTO deliverystaff (user_id) VALUES ($1)
             ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
             RETURNING delivery_staff_id`,
            [userId]
        );
        const deliveryStaffId = staffUpsert.rows[0].delivery_staff_id;

        // Insert the delivery record using the correct FK
        const insertRes = await client.query(
            "INSERT INTO deliveries (order_id, delivery_staff_id, delivery_status, delivery_date) VALUES ($1, $2, 'PICKED_UP', CURRENT_TIMESTAMP) RETURNING *",
            [orderId, deliveryStaffId]
        );

        await client.query('COMMIT');

        const deliveryRecord = insertRes.rows[0];
        await logAudit(userId, 'DRIVER_CLAIMED_DELIVERY', 'deliveries', deliveryRecord.delivery_id);

        res.json({ 
            message: "Order claimed successfully!",
            delivery: deliveryRecord
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error claiming order:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 3. Get My Assigned Deliveries
const getMyDeliveries = async (req, res) => {
    const userId = req.user.id; // users.id from JWT
    try {
        const query = `
            SELECT 
                   d.delivery_id,
                   d.order_id as id, 
                   'Main Warehouse, Colombo' as pickup,
                   c.address as dest, 
                   c.address as delivery,
                   d.delivery_status as status, 
                   o.order_date as deadline,
                   o.order_date as date,
                   u.name as customer_name,
                   u.phone as phone,
                   (
                       SELECT STRING_AGG(oi.quantity || 'x ' || p.name || ' (' || oi.packet_size || ')', ', ')
                       FROM orderitems oi
                       JOIN products p ON oi.product_id = p.product_id
                       WHERE oi.order_id = d.order_id
                   ) as items,
                   5.0 as rating,
                   '4 hrs 30m' as duration
            FROM deliveries d
            JOIN deliverystaff ds ON d.delivery_staff_id = ds.delivery_staff_id
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            WHERE ds.user_id = $1 AND d.delivery_status IN ('PICKED_UP', 'DELIVERED')
            ORDER BY d.delivery_id DESC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching my deliveries:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. Complete a Delivery
const completeDelivery = async (req, res) => {
    const { deliveryId } = req.params;
    const userId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify this delivery belongs to the requesting driver
        const checkRes = await client.query(
            `SELECT d.delivery_id, d.order_id FROM deliveries d
             JOIN deliverystaff ds ON d.delivery_staff_id = ds.delivery_staff_id
             WHERE d.delivery_id = $1 AND ds.user_id = $2 AND d.delivery_status = 'PICKED_UP'`,
            [deliveryId, userId]
        );
        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Delivery not found or already completed." });
        }

        const orderId = checkRes.rows[0].order_id;

        // Mark delivery as DELIVERED
        await client.query(
            "UPDATE deliveries SET delivery_status = 'DELIVERED', delivery_date = CURRENT_TIMESTAMP WHERE delivery_id = $1",
            [deliveryId]
        );

        // Update the order status to COMPLETED
        await client.query(
            "UPDATE orders SET status = 'COMPLETED' WHERE order_id = $1",
            [orderId]
        );

        await client.query('COMMIT');

        await logAudit(userId, 'DRIVER_COMPLETED_DELIVERY', 'deliveries', deliveryId);

        res.json({ message: "Delivery marked as completed successfully." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error completing delivery:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

module.exports = {
    getAvailableOrders,
    claimOrder,
    getMyDeliveries,
    completeDelivery
};
