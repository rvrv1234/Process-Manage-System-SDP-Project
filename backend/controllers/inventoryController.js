const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get all inventory items
const getInventory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, 
            CASE 
                WHEN stock > 10 THEN 'In Stock'
                WHEN stock > 0 AND stock <= 10 THEN 'Low Stock'
                ELSE 'Out of Stock'
            END as status
            FROM inventory 
            ORDER BY inventory_id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching inventory:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Add new inventory item
const addInventoryItem = async (req, res) => {
    const { name, category, stock, unit, price } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO inventory (name, category, stock, unit, price, status) VALUES ($1, $2, $3, $4, $5, CASE WHEN $3::numeric > 10 THEN 'In Stock' WHEN $3::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END) RETURNING *",
            [name, category, stock, unit, price]
        );
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'ADD_INVENTORY_ITEM', 'inventory', result.rows[0].inventory_id);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding inventory item:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Edit inventory item (Update Stock & Price when order arrives)
const updateInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { stock, price, name, category, unit } = req.body;
    
    try {
        // Build dynamic query based on what exactly was sent (mostly stock and price as requested by user)
        const result = await pool.query(
            "UPDATE inventory SET stock = $1, price = $2, name = $3, category = $4, unit = $5, last_updated = CURRENT_TIMESTAMP, status = CASE WHEN $1::numeric > 10 THEN 'In Stock' WHEN $1::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END WHERE inventory_id = $6 RETURNING *",
            [stock, price, name, category, unit, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_INVENTORY_ITEM', 'inventory', id);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating inventory item:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getInventory, addInventoryItem, updateInventoryItem };
