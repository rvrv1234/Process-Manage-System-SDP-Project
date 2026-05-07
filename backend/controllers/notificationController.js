const pool = require('../config/db');

// get api
const getNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT notification_id, message, type, read_status, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// mark all as read
const markAllAsRead = async (req, res) => {
    const { userId } = req.params;
    try {
        await pool.query(
            'UPDATE notifications SET read_status = TRUE WHERE user_id = $1 AND read_status = FALSE',
            [userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking notifications as read:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getNotifications, markAllAsRead };
