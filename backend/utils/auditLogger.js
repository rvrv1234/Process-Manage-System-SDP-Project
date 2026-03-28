const pool = require('../config/db');

const logAudit = async (userId, actionType, entityName, entityId) => {
    console.log('📝 AUDIT TRIGGERED:', { userId, actionType, entityName, entityId });
    try {
        const safeUserId = (userId === undefined || userId === null) ? null : parseInt(userId, 10);
        const safeEntityId = (entityId === undefined || entityId === null) ? null : parseInt(entityId, 10);
        await pool.query(
            "INSERT INTO auditrecords (user_id, action_type, entity_name, entity_id, timestamp) VALUES ($1, $2, $3, $4, NOW())",
            [safeUserId, actionType, entityName, safeEntityId]
        );
    } catch (err) {
        console.error('❌ AUDIT DB ERROR:', err.message);
    }
};

module.exports = { logAudit };
