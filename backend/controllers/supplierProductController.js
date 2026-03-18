const pool = require('../config/db');

// 1. Get all raw materials for the Marketplace
const getSupplierMaterials = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rm.material_id, rm.name, rm.stock_level, rm.unit_cost, s.company_name, s.supplier_id
            FROM rawmaterials rm
            JOIN suppliers s ON rm.supplier_id = s.supplier_id
            WHERE s.status = 'Approved'
            ORDER BY rm.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching supplier materials:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Place a Purchase Order
const placePurchaseOrder = async (req, res) => {
    const { supplier_id, total_amount, items } = req.body; // items: [{ material_id, quantity, unit_price }]
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // --- PURCHASE ORDER STOCK VALIDATION ---
        for (const item of items) {
            const stockCheck = await client.query(
                "SELECT stock_level FROM rawmaterials WHERE material_id = $1",
                [item.material_id]
            );
            
            if (stockCheck.rows.length === 0) {
                throw new Error(`Material ID ${item.material_id} not found`);
            }
            
            const availableStock = parseFloat(stockCheck.rows[0].stock_level);
            if (availableStock < item.quantity) {
                res.status(400).json({ message: "Requested quantity exceeds available stock" });
                await client.query('ROLLBACK');
                return;
            }
        }

        // Create the PO
        const poResult = await client.query(
            "INSERT INTO purchase_orders (supplier_id, total_amount, status) VALUES ($1, $2, 'Pending') RETURNING po_id",
            [supplier_id, total_amount]
        );
        const poId = poResult.rows[0].po_id;

        // Insert items and deduct stock
        for (const item of items) {
            // INSERT PO item
            await client.query(
                "INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [poId, item.material_id, item.quantity, item.unit_price]
            );

            // DEDUCT stock from rawmaterials
            await client.query(
                "UPDATE rawmaterials SET stock_level = stock_level - $1 WHERE material_id = $2",
                [item.quantity, item.material_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Purchase Order Placed Successfully", po_id: poId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error placing PO:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 3. Get all Purchase Orders for the Owner
const getAllPurchaseOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT po.po_id, po.order_date, po.total_amount, po.status, s.company_name,
                   STRING_AGG(rm.name, ', ') as items
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.supplier_id
            LEFT JOIN purchase_order_items poi ON po.po_id = poi.po_id
            LEFT JOIN rawmaterials rm ON poi.material_id = rm.material_id
            GROUP BY po.po_id, s.company_name
            ORDER BY po.order_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching all POs:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3b. Get specific Purchase Orders for a Supplier (via user_id)
const getSupplierPurchaseOrders = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT po.po_id, po.order_date, po.total_amount, po.status,
                   STRING_AGG(rm.name || ' - ' || poi.quantity || ' units', ', ') as items_list
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.supplier_id
            LEFT JOIN purchase_order_items poi ON po.po_id = poi.po_id
            LEFT JOIN rawmaterials rm ON poi.material_id = rm.material_id
            WHERE s.user_id = $1
            GROUP BY po.po_id
            ORDER BY po.order_date DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching supplier POs:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. Update PO Status (e.g., Mark as Delivered or Rejected)
const updatePurchaseOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check current status
        const currentPO = await client.query("SELECT status FROM purchase_orders WHERE po_id = $1", [id]);
        if (currentPO.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Order not found" });
        }

        const oldStatus = currentPO.rows[0].status;

        // If newly rejected and wasn't already rejected, return stock
        if (status === 'Rejected' && oldStatus !== 'Rejected') {
            const items = await client.query("SELECT material_id, quantity FROM purchase_order_items WHERE po_id = $1", [id]);
            for (const item of items.rows) {
                await client.query(
                    "UPDATE rawmaterials SET stock_level = stock_level + $1 WHERE material_id = $2",
                    [item.quantity, item.material_id]
                );
            }
        }

        const result = await client.query(
            "UPDATE purchase_orders SET status = $1 WHERE po_id = $2 RETURNING *",
            [status, id]
        );

        await client.query('COMMIT');
        res.json({ message: `Order marked as ${status}`, order: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error updating PO status:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

module.exports = { getSupplierMaterials, placePurchaseOrder, getAllPurchaseOrders, updatePurchaseOrderStatus, getSupplierPurchaseOrders };
