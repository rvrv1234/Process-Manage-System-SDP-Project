const logAudit = async (pool, userId, actionType, entityName, entityId) => {
    try {
        await pool.query(
            "INSERT INTO audit_record (user_id, action_type, entity_name, entity_id, created_at) VALUES ($1, $2, $3, $4, NOW())",
            [parseInt(userId, 10), actionType, entityName, entityId]
        );
    } catch (err) {
        console.error("Audit log failed:", err.message);
    }
};

module.exports = { logAudit };
