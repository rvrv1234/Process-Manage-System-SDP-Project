import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * NotificationBell — Universal reusable notification component.
 * Mount in any dashboard header by passing userId={user?.id}.
 * Polls every 30 seconds for new notifications.
 */
const POLL_INTERVAL = 30000; // 30 seconds

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read_status).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${userId}`);
      setNotifications(res.data || []);
    } catch (err) {
      // Silent fail — notifications are non-critical
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/notifications/${userId}/read`);
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  const getTypeBorderColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error':   return '#ef4444';
      default:        return '#3b82f6';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          color: isOpen ? '#f59e0b' : '#9ca3af',
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {/* Bell SVG */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            border: '2px solid #1f1f1f',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: '0',
          width: '360px',
          backgroundColor: 'white',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'notifSlideIn 0.18s ease-out',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 18px 12px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#fafafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
              >
                {loading ? 'Marking...' : '✓ Mark all read'}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto',
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔔</div>
                <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>All caught up!</div>
                <div>No notifications yet.</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.notification_id}
                  style={{
                    padding: '13px 18px',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: n.read_status ? 'white' : '#f0f9ff',
                    borderLeft: `3px solid ${getTypeBorderColor(n.type)}`,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                >
                  <div style={{
                    fontSize: '13px',
                    color: '#1f2937',
                    lineHeight: '1.5',
                    fontWeight: n.read_status ? '400' : '500',
                    marginBottom: '5px',
                  }}>
                    {n.message}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>{formatTime(n.created_at)}</span>
                    {!n.read_status && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        display: 'inline-block',
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 18px',
              backgroundColor: '#fafafa',
              borderTop: '1px solid #f3f4f6',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CSS keyframe for slide-in animation */}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
