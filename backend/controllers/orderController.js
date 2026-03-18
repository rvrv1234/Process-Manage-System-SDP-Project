const pool = require('../config/db');

// 1. Create a Customer Order
const createCustomerOrder = async (req, res) => {
    const { user_id, total_amount, items } = req.body; // items: [{ product_id, quantity, unit_price }]
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find customer_id from user_id
        const customerResult = await pool.query("SELECT customer_id FROM customers WHERE user_id = $1", [user_id]);
        if (customerResult.rows.length === 0) {
            throw new Error("Customer record not found for this user");
        }
        const customer_id = customerResult.rows[0].customer_id;
        
        // --- CUSTOMER STOCK VALIDATION ---
        for (const item of items) {
            const stockResult = await client.query(
                "SELECT quantity FROM product_packets WHERE inventory_id = $1 AND weight = $2",
                [item.product_id, item.packet_size]
            );
            
            if (stockResult.rows.length === 0) {
                throw new Error(`Product packet ${item.packet_size} not found for product ID ${item.product_id}`);
            }
            
            const availableStock = parseInt(stockResult.rows[0].quantity);
            if (availableStock < item.quantity) {
                res.status(400).json({ message: "Requested quantity exceeds available stock" });
                await client.query('ROLLBACK');
                return;
            }
        }

        console.log("Inserting order for customer:", customer_id, "with status: PENDING and delivery_status: PROCESSING");
        const orderResult = await client.query(
            "INSERT INTO orders (customer_id, total_amount, status, delivery_status) VALUES ($1, $2, $3, $4) RETURNING order_id",
            [customer_id, total_amount, 'PENDING', 'PROCESSING']
        );
        const orderId = orderResult.rows[0].order_id;

        for (const item of items) {
            // INSERT order item
            await client.query(
                "INSERT INTO orderitems (order_id, product_id, quantity, unit_price, packet_size) VALUES ($1, $2, $3, $4, $5)",
                [orderId, item.product_id, item.quantity, item.unit_price, item.packet_size]
            );

            // DEDUCT stock from product_packets
            await client.query(
                "UPDATE product_packets SET quantity = quantity - $1 WHERE inventory_id = $2 AND weight = $3",
                [item.quantity, item.product_id, item.packet_size]
            );

            // --- AUTO CREATE PRODUCTION BATCH ---
            // This makes the order appear in the Production tab for staff/owner
            await client.query(
                "INSERT INTO production_batches (product_id, quantity, status, due_date, order_id, packet_size) VALUES ($1, $2, 'To Produce', CURRENT_DATE, $3, $4)",
                [item.product_id, item.quantity, orderId, item.packet_size]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ message: "Order Placed Successfully", order_id: orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error placing customer order:", err.message);
        res.status(500).json({ message: "Server Error: " + err.message });
    } finally {
        client.release();
    }
};

// 2. Get All Customer Orders (for Owner)
const getAllCustomerOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.order_id, o.order_date, o.total_amount, o.status, u.name as customer_name,
                   (SELECT COUNT(*) FROM orderitems WHERE order_id = o.order_id) as item_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            ORDER BY o.order_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching customer orders:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Get Orders for a Specific Customer
const getCustomerOrders = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT o.order_id as id, o.order_date as date, o.total_amount as total, o.status,
                   json_agg(json_build_object('name', p.name, 'quantity', oi.quantity, 'price', oi.unit_price, 'size', oi.packet_size)) as items
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN orderitems oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE c.user_id = $1
            GROUP BY o.order_id
            ORDER BY o.order_date DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching customer personal orders:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. Update Customer Order Status
const updateCustomerOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order status updated", order: result.rows[0] });
    } catch (err) {
        console.error("Error updating customer order status:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { createCustomerOrder, getAllCustomerOrders, getCustomerOrders, updateCustomerOrderStatus };
