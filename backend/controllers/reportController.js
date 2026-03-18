const pool = require('../config/db');

// 1. Get Financial Summary (Revenue, Expenses, Profit)
const getFinancialSummary = async (req, res) => {
    try {
        const revenueResult = await pool.query(`
            SELECT SUM(total_amount) as total_revenue 
            FROM orders 
            WHERE status NOT IN ('CANCELLED', 'REJECTED')
        `);
        const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue || 0);

        const expensesResult = await pool.query(`
            SELECT SUM(total_amount) as total_expenses 
            FROM purchase_orders 
            WHERE status != 'CANCELLED'
        `);
        const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses || 0);

        const netProfit = totalRevenue - totalExpenses;

        res.json({
            totalRevenue,
            totalExpenses,
            netProfit,
            currency: 'LKR'
        });
    } catch (err) {
        console.error("Error calculating financial summary:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Get Sales By Product
const getSalesByProduct = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.name, SUM(oi.quantity) as total_quantity, SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM orderitems oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status NOT IN ('CANCELLED', 'REJECTED')
            GROUP BY p.name
            ORDER BY total_revenue DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching sales by product:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Get Order Trends (Daily Revenue for last 30 days)
const getOrderTrends = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DATE(order_date) as date, SUM(total_amount) as revenue
            FROM orders
            WHERE status NOT IN ('CANCELLED', 'REJECTED')
            AND order_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(order_date)
            ORDER BY date ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching order trends:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. Get Inventory Distribution (Raw Materials)
const getInventoryDistribution = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT name, stock_level as stock
            FROM rawmaterials
            ORDER BY stock_level DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching inventory distribution:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { 
    getFinancialSummary, 
    getSalesByProduct, 
    getOrderTrends, 
    getInventoryDistribution 
};
