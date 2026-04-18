const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { createNotification, notifyUsersByRole } = require('../utils/notificationHelper');

// 1. Create a Customer Order
const createCustomerOrder = async (req, res) => {
    const { user_id, total_amount, items, payment_method, transaction_id, status } = req.body; // items: [{ product_id, quantity, unit_price }]
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

        const orderStatus = status || 'PENDING';
        const orderPaymentMethod = payment_method || 'cod';
        const orderTransactionId = transaction_id || null;

        console.log("Inserting order for customer:", customer_id, "with status:", orderStatus, "and delivery_status: PROCESSING");
        const orderResult = await client.query(
            "INSERT INTO orders (customer_id, total_amount, status, transaction_id, payment_method, delivery_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING order_id",
            [customer_id, Number(total_amount), orderStatus, orderTransactionId, orderPaymentMethod, 'PROCESSING']
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
        
        // Audit Logging
        const auditUserId = req.user?.id || user_id || null;
        await logAudit(auditUserId, 'CREATE_ORDER', 'orders', orderId);

        // --- NOTIFICATIONS ---
        // Notify the owner that a new customer order has arrived
        try {
            const customerNameResult = await pool.query(
                'SELECT u.name FROM users u JOIN customers c ON c.user_id = u.id WHERE c.customer_id = $1',
                [customer_id]
            );
            const customerName = customerNameResult.rows[0]?.name || 'A customer';
            await notifyUsersByRole('admin', `📦 New order #${orderId} received from ${customerName}`, 'info');
        } catch (notifErr) {
            console.error('[Notification] Failed to notify owner on new order:', notifErr.message);
        }

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
            SELECT o.order_id as id, o.order_date as date, o.total_amount as total, o.status, o.customer_id,
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
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_ORDER_STATUS', 'orders', id);

        // --- NOTIFICATION: Tell the customer their order status changed ---
        try {
            const customerUserResult = await pool.query(
                'SELECT c.user_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id = $1',
                [id]
            );
            if (customerUserResult.rows.length > 0) {
                const customerUserId = customerUserResult.rows[0].user_id;
                await createNotification(customerUserId, `🔔 Your order #${id} status has been updated to: ${status}`, 'info');
            }
        } catch (notifErr) {
            console.error('[Notification] Failed to notify customer on order status change:', notifErr.message);
        }
        
        res.json({ message: "Order status updated", order: result.rows[0] });
    } catch (err) {
        console.error("Error updating customer order status:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 5. Request a Customer Return
const requestCustomerOrderReturn = async (req, res) => {
    let { order_id, customer_id, reason, user_id } = req.body;
    const image_url = req.file ? `/uploads/returns/${req.file.filename}` : null;

    try {
        // Fallback: If customer_id not provided, find it from user_id
        if (!customer_id && user_id) {
            const customerResult = await pool.query("SELECT customer_id FROM customers WHERE user_id = $1", [user_id]);
            if (customerResult.rows.length > 0) {
                customer_id = customerResult.rows[0].customer_id;
            }
        }

        if (!customer_id) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        console.log('Final Payload for DB (Customer Return):', { order_id, customer_id, reason, image_url });

        const result = await pool.query(
            "INSERT INTO customer_return_requests (order_id, customer_id, reason, image_url, status) VALUES ($1, $2, $3, $4, 'Pending') RETURNING *",
            [order_id, customer_id, reason, image_url]
        );

        const auditUserId = req.user?.id || customer_id || null;
        await logAudit(auditUserId, 'REQUEST_CUSTOMER_RETURN', 'customer_return_requests', result.rows[0].return_id);

        res.status(201).json({ message: "Return request submitted successfully", returnRequest: result.rows[0] });
    } catch (err) {
        console.error("CRITICAL ERROR: Failed to submit customer return request.");
        console.error("DB Message:", err.message);
        console.error("DB Code:", err.code);
        res.status(500).json({ message: "Server Error: " + err.message });
    }
};

// 6. Get All Customer Returns (for Owner)
const getAllCustomerReturns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cr.*, o.order_date, u.name as customer_name
            FROM customer_return_requests cr
            JOIN orders o ON cr.order_id = o.order_id
            JOIN customers c ON cr.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.id
            ORDER BY cr.request_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching customer returns:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 7. Update Customer Return Status
const updateCustomerReturnStatus = async (req, res) => {
    const { id } = req.params; // return_id
    let { status } = req.body; // 'APPROVED' or 'REJECTED'

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Normalize status to uppercase for DB consistency
        const upperStatus = status?.toUpperCase();

        // Update return request status
        const returnRes = await client.query(
            "UPDATE customer_return_requests SET status = $1 WHERE return_id = $2 RETURNING *",
            [upperStatus, id]
        );

        if (returnRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Return request not found" });
        }

        const order_id = returnRes.rows[0].order_id;

        // If Approved, update the original order status to 'RETURNED'
        if (upperStatus === 'APPROVED' || upperStatus === 'ACCEPTED') {
            await client.query(
                "UPDATE orders SET status = 'RETURNED' WHERE order_id = $1",
                [order_id]
            );
        }

        await client.query('COMMIT');

        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_CUSTOMER_RETURN_STATUS', 'customer_return_requests', id);

        res.json({ message: `Return request ${upperStatus} successfully`, returnRequest: returnRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("DATABASE FAILURE: Update status at updateCustomerReturnStatus failed.");
        console.error("Error Message:", err.message);
        console.error("Constraint Violated:", err.constraint);
        console.warn("Hint: Ensure the status matches the CHECK constraint in the database.");
        res.status(500).json({ message: "Server Error: " + err.message });
    } finally {
        client.release();
    }
};

module.exports = { 
    createCustomerOrder, 
    getAllCustomerOrders, 
    getCustomerOrders, 
    updateCustomerOrderStatus,
    requestCustomerOrderReturn,
    getAllCustomerReturns,
    updateCustomerReturnStatus
};
