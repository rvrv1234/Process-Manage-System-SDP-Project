const pool = require('../config/db');

/**
 * createNotification — inserts a notification row for a specific user.
 * This function is intentionally wrapped in try/catch: it must NEVER
 * throw or reject, so callers' core logic is never interrupted.
 *
 * @param {number} userId   - users.id of the recipient
 * @param {string} message  - notification message text
 * @param {string} type     - 'info' | 'warning' | 'success' | 'error'
 */
const createNotification = async (userId, message, type = 'info') => {
    if (!userId) return; // Safety: don't insert if no target user
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [userId, message, type]
        );
    } catch (err) {
        // Log but never re-throw — notifications are non-critical
        console.error('[NotificationHelper] Failed to create notification:', err.message);
    }
};

/**
 * notifyUsersByRole — broadcasts a notification to ALL users with a given role.
 * Used for: delivery staff (new delivery available), inventory staff (low stock).
 *
 * @param {string} role     - user role string e.g. 'delivery', 'staff'
 * @param {string} message  - notification message text
 * @param {string} type     - 'info' | 'warning' | 'success' | 'error'
 */
const notifyUsersByRole = async (role, message, type = 'info') => {
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE role = $1',
            [role]
        );
        const insertPromises = result.rows.map(row =>
            pool.query(
                'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [row.id, message, type]
            ).catch(e => console.error('[NotificationHelper] Broadcast insert failed:', e.message))
        );
        await Promise.all(insertPromises);
    } catch (err) {
        console.error('[NotificationHelper] Failed to broadcast notification:', err.message);
    }
};

module.exports = { createNotification, notifyUsersByRole };
