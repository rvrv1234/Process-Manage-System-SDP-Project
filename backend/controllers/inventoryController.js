const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { notifyUsersByRole } = require('../utils/notificationHelper');

// Get all inventory items
const getInventory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, 
            CASE 
                WHEN stock > 30 THEN 'In Stock'
                WHEN stock > 0 AND stock <= 30 THEN 'Low Stock'
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

// Add new inventory item
const addInventoryItem = async (req, res) => {
    const { name, category, stock, unit, price } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO inventory (name, category, stock, unit, price, status) VALUES ($1, $2, $3::numeric, $4, $5, CASE WHEN $3::numeric > 30 THEN 'In Stock' WHEN $3::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END) RETURNING *",
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

// Edit inventory item 
const updateInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { stock, price, name, category, unit } = req.body;
    
    try {
        
        const result = await pool.query(
            "UPDATE inventory SET stock = $1::numeric, price = $2, name = $3, category = $4, unit = $5, last_updated = CURRENT_TIMESTAMP, status = CASE WHEN $1::numeric > 30 THEN 'In Stock' WHEN $1::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END WHERE inventory_id = $6 RETURNING *",
            [stock, price, name, category, unit, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_INVENTORY_ITEM', 'inventory', id);

        //  Alert inventory staff on low/empty stock 
        const updatedItem = result.rows[0];
        const stockNum = Number(updatedItem.stock);
        if (stockNum === 0) {
            await notifyUsersByRole(
                'owner',
                `⚠️ OUT OF STOCK: "${updatedItem.name}" has 0 units remaining!`,
                'error'
            );
        } else if (stockNum <= 30) {
            await notifyUsersByRole(
                'owner',
                `🟡 Low Stock: "${updatedItem.name}" is running low (${stockNum} ${updatedItem.unit} left)`,
                'warning'
            );
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating inventory item:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getInventory, addInventoryItem, updateInventoryItem };
