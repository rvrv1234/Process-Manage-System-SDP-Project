const pool = require('../config/db');

// 1. Get All Production Batches
const getBatches = async (req, res) => {
    try {
        const query = `
            SELECT b.*, p.name as product_name 
            FROM production_batches b
            JOIN products p ON b.product_id = p.product_id
            ORDER BY b.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching batches:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Update Batch Status
const updateBatchStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        let query = "UPDATE production_batches SET status = $1 WHERE batch_id = $2 RETURNING *";
        let params = [status, id];

        if (status === 'Completed') {
            query = "UPDATE production_batches SET status = $1, completed_date = CURRENT_DATE WHERE batch_id = $2 RETURNING *";
        } else if (status === 'In Process') {
            query = "UPDATE production_batches SET status = $1, start_date = CURRENT_DATE WHERE batch_id = $2 RETURNING *";
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Batch not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating batch status:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getBatches,
    updateBatchStatus
};
