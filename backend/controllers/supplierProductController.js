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

        // Create the PO
        const poResult = await client.query(
            "INSERT INTO purchase_orders (supplier_id, total_amount, status) VALUES ($1, $2, 'Pending') RETURNING po_id",
            [supplier_id, total_amount]
        );
        const poId = poResult.rows[0].po_id;

        // Insert items (No stock deduction as per new requirement)
        for (const item of items) {
            await client.query(
                "INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [poId, item.material_id, item.quantity, item.unit_price]
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
            SELECT po.po_id, po.order_date, po.total_amount, po.status, po.denial_reason, s.company_name,
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
            SELECT po.po_id, po.order_date, po.total_amount, po.status, po.denial_reason,
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

        // If Rejected, we might have a reason
        const { reason } = req.body;

        const result = await client.query(
            "UPDATE purchase_orders SET status = $1, denial_reason = $2 WHERE po_id = $3 RETURNING *",
            [status, status === 'Rejected' ? reason : null, id]
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

// 5. Add a new Supplier Material
const addSupplierMaterial = async (req, res) => {
    const { supplier_id, name, unit_cost } = req.body;
    const stock_level = 0; // Default stock level as it's not required from supplier now
    try {
        const result = await pool.query(
            "INSERT INTO rawmaterials (supplier_id, name, stock_level, unit_cost) VALUES ($1, $2, $3, $4) RETURNING *",
            [supplier_id, name, stock_level, unit_cost]
        );
        res.status(201).json({ message: "Material added successfully", material: result.rows[0] });
    } catch (err) {
        console.error("Error adding material:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 6. Get materials for a specific supplier by user_id
const getMyMaterials = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT rm.* 
            FROM rawmaterials rm
            JOIN suppliers s ON rm.supplier_id = s.supplier_id
            WHERE s.user_id = $1
            ORDER BY rm.name ASC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching my materials:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 7. Delete a Supplier Material
const deleteSupplierMaterial = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM rawmaterials WHERE material_id = $1", [id]);
        res.json({ message: "Material deleted successfully" });
    } catch (err) {
        console.error("Error deleting material:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { 
    getSupplierMaterials, 
    placePurchaseOrder, 
    getAllPurchaseOrders, 
    updatePurchaseOrderStatus, 
    getSupplierPurchaseOrders,
    addSupplierMaterial,
    getMyMaterials,
    deleteSupplierMaterial
};
