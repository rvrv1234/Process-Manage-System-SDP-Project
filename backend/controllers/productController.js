const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { notifyUsersByRole } = require('../utils/notificationHelper');

// Get all products
const getCatalog = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.product_id, p.name, p.category, p.description, p.price, p.stock_level, 
            CASE 
                WHEN p.stock_level > 10 THEN 'In Stock'
                WHEN p.stock_level > 0 AND p.stock_level <= 10 THEN 'Low Stock'
                ELSE 'Out of Stock'
            END as status,
            p.raw_material_id, p.raw_material_quantity,
            COALESCE(
                json_agg(
                    json_build_object('weight', pp.weight, 'quantity', pp.quantity, 'price', pp.price)
                ) FILTER (WHERE pp.weight IS NOT NULL), 
                '[]'
            ) as packets
            FROM products p
            LEFT JOIN product_packets pp ON p.product_id = pp.inventory_id
            GROUP BY p.product_id
            ORDER BY p.product_id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching catalog:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

//  Add product with Raw Material Deduction
const addProduct = async (req, res) => {
    const { name, category, description, price, stock_level, raw_material_id, raw_material_quantity, packets } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        //  Insert into products table
        const productResult = await client.query(
            "INSERT INTO products (name, category, description, price, stock_level, status, raw_material_id, raw_material_quantity) VALUES ($1, $2, $3, $4, $5::numeric, CASE WHEN $5::numeric > 10 THEN 'In Stock' WHEN $5::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END, $6, $7) RETURNING *",
            [name, category, description, price, stock_level, raw_material_id, raw_material_quantity]
        );
        const productId = productResult.rows[0].product_id;

        // Deduct from inventory if provided
        if (raw_material_id && raw_material_quantity && Number(raw_material_quantity) > 0) {
            const invUpdate = await client.query(
                "UPDATE inventory SET stock = stock - ($1::numeric), status = CASE WHEN stock - ($1::numeric) > 30 THEN 'In Stock' WHEN stock - ($1::numeric) > 0 THEN 'Low Stock' ELSE 'Out of Stock' END WHERE inventory_id = $2 RETURNING stock, name, unit",
                [raw_material_quantity, raw_material_id]
            );
            if (invUpdate.rows.length > 0) {
                const updatedItem = invUpdate.rows[0];
                const stockNum = Number(updatedItem.stock);
                if (stockNum <= 0) {
                    await notifyUsersByRole('owner', `⚠️ OUT OF STOCK: "${updatedItem.name}" has 0 units remaining!`, 'error');
                } else if (stockNum <= 30) {
                    await notifyUsersByRole('owner', `🟡 Low Stock: "${updatedItem.name}" is running low (${stockNum} ${updatedItem.unit} left)`, 'warning');
                }
            }
        }

        //  Insert initial packets if provided
        if (packets && Array.isArray(packets)) {
            for (const p of packets) {
                if (p.weight) {
                    await client.query(
                        "INSERT INTO product_packets (inventory_id, weight, quantity, price) VALUES ($1, $2, $3, $4)",
                        [productId, p.weight, parseInt(p.quantity) || 0, parseFloat(p.price) || 0]
                    );
                }
            }
        } else if (packets && typeof packets === 'object') {
            for (const [weight, quantity] of Object.entries(packets)) {
                await client.query(
                    "INSERT INTO product_packets (inventory_id, weight, quantity) VALUES ($1, $2, $3)",
                    [productId, weight, parseInt(quantity) || 0]
                );
            }
        }

        await client.query('COMMIT');
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'ADD_PRODUCT', 'products', productId);
        
        res.status(201).json(productResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error adding product:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 3. Update product
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, description, price, stock_level, raw_material_id, raw_material_quantity_per_unit, packets } = req.body;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        //  Fetch old product to calculate delta
        const oldProductQuery = await client.query("SELECT stock_level FROM products WHERE product_id = $1", [id]);
        if (oldProductQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Product not found" });
        }
        
        const oldStockStr = oldProductQuery.rows[0].stock_level;
        const oldStockLevel = (oldStockStr === null || oldStockStr === undefined) ? 0 : Number(oldStockStr);
        const newStockLevel = (stock_level === null || stock_level === undefined) ? 0 : Number(stock_level);
        
        const stockAdded = newStockLevel - oldStockLevel;

        // Deduct from inventory if stock increased 
        if (stockAdded > 0 && raw_material_id && raw_material_quantity_per_unit && Number(raw_material_quantity_per_unit) > 0) {
            const totalRawMaterialToDeduct = stockAdded * Number(raw_material_quantity_per_unit);
            const invUpdate = await client.query(
                "UPDATE inventory SET stock = stock - ($1::numeric), status = CASE WHEN stock - ($1::numeric) > 30 THEN 'In Stock' WHEN stock - ($1::numeric) > 0 THEN 'Low Stock' ELSE 'Out of Stock' END WHERE inventory_id = $2 RETURNING stock, name, unit",
                [totalRawMaterialToDeduct, raw_material_id]
            );
            if (invUpdate.rows.length > 0) {
                const updatedItem = invUpdate.rows[0];
                const stockNum = Number(updatedItem.stock);
                if (stockNum <= 0) {
                    await notifyUsersByRole('owner', `⚠️ OUT OF STOCK: "${updatedItem.name}" has 0 units remaining!`, 'error');
                } else if (stockNum <= 30) {
                    await notifyUsersByRole('owner', `🟡 Low Stock: "${updatedItem.name}" is running low (${stockNum} ${updatedItem.unit} left)`, 'warning');
                }
            }
        }

        //  Update the actual product
        const result = await client.query(
            "UPDATE products SET name = $1, category = $2, description = $3, price = $4, stock_level = $5::numeric, status = CASE WHEN $5::numeric > 10 THEN 'In Stock' WHEN $5::numeric > 0 THEN 'Low Stock' ELSE 'Out of Stock' END WHERE product_id = $6 RETURNING *",
            [name, category, description, price, stock_level, id]
        );

        //  Update individual packets if provided
        if (packets) {
            if (Array.isArray(packets)) {
                for (const p of packets) {
                    if (p.weight) {
                        await client.query(
                            `INSERT INTO product_packets (inventory_id, weight, quantity, price)
                             VALUES ($1, $2, $3, $4)
                             ON CONFLICT (inventory_id, weight)
                             DO UPDATE SET quantity = EXCLUDED.quantity, price = EXCLUDED.price`,
                            [id, p.weight, parseInt(p.quantity) || 0, parseFloat(p.price) || 0]
                        );
                    }
                }
            } else {
                for (const [weight, quantity] of Object.entries(packets)) {
                     if (weight) {
                         await client.query(
                            `INSERT INTO product_packets (inventory_id, weight, quantity)
                             VALUES ($1, $2, $3)
                             ON CONFLICT (inventory_id, weight)
                             DO UPDATE SET quantity = EXCLUDED.quantity`,
                            [id, weight, parseInt(quantity) || 0]
                         );
                     }
                }
            }
        }
        
        await client.query('COMMIT');
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'UPDATE_PRODUCT', 'products', id);
        
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error updating product:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

//  Delete product
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM products WHERE product_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        const auditUserId = req.user?.id || req.body?.user_id || null;
        await logAudit(auditUserId, 'DELETE_PRODUCT', 'products', id);
        
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error("Error deleting product:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getCatalog, addProduct, updateProduct, deleteProduct };