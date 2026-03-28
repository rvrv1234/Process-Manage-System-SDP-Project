const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get Available Orders for Pickup (Bridge Query)
const getAvailableOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.delivery_id,
                d.order_id as id, 
                d.delivery_status as status,
                'Main Warehouse, Colombo' as pickup,
                c.address as delivery, 
                u.name as customer_name,
                u.phone as phone,
                o.order_date as deadline,
                (
                    SELECT STRING_AGG(oi.quantity || 'x ' || p.name || ' (' || oi.packet_size || ')', ', ')
                    FROM orderitems oi
                    JOIN products p ON oi.product_id = p.product_id
                    WHERE oi.order_id = d.order_id
                ) as items
            FROM deliveries d
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            WHERE d.delivery_status = 'Ready for Pickup' AND d.delivery_staff_id IS NULL
            ORDER BY d.delivery_id ASC
        `;
        const result = await pool.query(query);
        console.log('Fetched joined delivery data:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching available orders:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Claim (Accept) an Order
const claimOrder = async (req, res) => {
    const { orderId } = req.params; // This matches the route parameter
    const driverId = req.user.id; 

    try {
        // Update deliveries prioritizing delivery_id OR order_id (whichever the frontend passed via the 'id' binding)
        // The condition 'AND delivery_staff_id IS NULL' natively handles race conditions safely.
        const updateQuery = `
            UPDATE deliveries 
            SET delivery_staff_id = $1, delivery_status = 'Picked Up' 
            WHERE (delivery_id = $2 OR order_id = $2) AND delivery_staff_id IS NULL 
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [driverId, orderId]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Order already claimed or does not exist." });
        }

        const deliveryRecord = result.rows[0];
        const extractedDeliveryId = deliveryRecord.delivery_id;

        // Audit Logging
        await logAudit(driverId, 'DRIVER_CLAIMED_DELIVERY', 'deliveries', extractedDeliveryId);

        res.json({ 
            message: "Order claimed successfully!",
            delivery: deliveryRecord
        });
    } catch (err) {
        console.error("Error claiming order:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Get My Assigned Deliveries
const getMyDeliveries = async (req, res) => {
    const driverId = req.user.id;
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
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            WHERE d.delivery_staff_id = $1 AND d.delivery_status = 'Picked Up'
            ORDER BY d.delivery_id DESC
        `;
        const result = await pool.query(query, [driverId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching my deliveries:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getAvailableOrders,
    claimOrder,
    getMyDeliveries
};
