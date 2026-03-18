const pool = require('../config/db');

// 1. Get all products
const getCatalog = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
            COALESCE(
                json_agg(
                    json_build_object('weight', pp.weight, 'quantity', pp.quantity)
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

// 2. Add product with Raw Material Deduction
const addProduct = async (req, res) => {
    const { name, category, description, price, stock_level, raw_material_id, raw_material_quantity, packets } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Step 1: Insert into products table
        const productResult = await client.query(
            "INSERT INTO products (name, category, description, price, stock_level, status, raw_material_id, raw_material_quantity) VALUES ($1, $2, $3, $4, $5, 'In Stock', $6, $7) RETURNING *",
            [name, category, description, price, stock_level, raw_material_id, raw_material_quantity]
        );
        const productId = productResult.rows[0].product_id;

        // Step 2: Deduct from inventory if provided
        if (raw_material_id && raw_material_quantity && Number(raw_material_quantity) > 0) {
            await client.query(
                "UPDATE inventory SET stock = stock - ($1::numeric) WHERE inventory_id = $2",
                [raw_material_quantity, raw_material_id]
            );
        }

        // Step 3: Insert initial packets if provided
        if (packets && typeof packets === 'object') {
            for (const [weight, quantity] of Object.entries(packets)) {
                await client.query(
                    "INSERT INTO product_packets (inventory_id, weight, quantity) VALUES ($1, $2, $3)",
                    [productId, weight, parseInt(quantity) || 0]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(productResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error adding product:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 3. Update product with dynamic Raw Material Deduction
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, description, price, stock_level, raw_material_id, raw_material_quantity_per_unit, packets } = req.body;
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Step 1: Fetch old product to calculate delta
        const oldProductQuery = await client.query("SELECT stock_level FROM products WHERE product_id = $1", [id]);
        if (oldProductQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Product not found" });
        }
        
        const oldStockStr = oldProductQuery.rows[0].stock_level;
        const oldStockLevel = (oldStockStr === null || oldStockStr === undefined) ? 0 : Number(oldStockStr);
        const newStockLevel = (stock_level === null || stock_level === undefined) ? 0 : Number(stock_level);
        
        const stockAdded = newStockLevel - oldStockLevel;

        // Step 2: Deduct from inventory if stock increased AND mapping exists
        if (stockAdded > 0 && raw_material_id && raw_material_quantity_per_unit && Number(raw_material_quantity_per_unit) > 0) {
            const totalRawMaterialToDeduct = stockAdded * Number(raw_material_quantity_per_unit);
            await client.query(
                "UPDATE inventory SET stock = stock - ($1::numeric) WHERE inventory_id = $2",
                [totalRawMaterialToDeduct, raw_material_id]
            );
        }

        // Step 3: Update the actual product
        const result = await client.query(
            "UPDATE products SET name = $1, category = $2, description = $3, price = $4, stock_level = $5 WHERE product_id = $6 RETURNING *",
            [name, category, description, price, stock_level, id]
        );

        // Step 4: Update individual packets if provided (Absolute Update for Owner)
        if (packets) {
            const packetEntries = Array.isArray(packets) 
                ? packets.map(p => [p.weight, p.quantity]) 
                : Object.entries(packets);

            for (const [weight, quantity] of packetEntries) {
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
        
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error updating product:", err.message);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

// 4. Delete product
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM products WHERE product_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error("Error deleting product:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getCatalog, addProduct, updateProduct, deleteProduct };