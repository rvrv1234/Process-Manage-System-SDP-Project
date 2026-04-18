-- ==========================================================
-- Notification System Migration
-- Run once to add the notifications table to the database.
-- ==========================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    type            VARCHAR(50) DEFAULT 'info',
    read_status     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
