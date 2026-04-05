import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { C } from '../constants/theme';
import { Bell, AlertCircle, BarChart3, Loader2, RotateCw } from 'lucide-react';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Fetch every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);
  const hasMore = notifications.length > 5;

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await notificationAPI.markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n)
        );
      }
      
      // Navigate to task management
      navigate('/tasks');
      setIsOpen(false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'warning': return '⚠️';
      case 'summary': return '📊';
      default: return '📬';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'urgent': return C.red;
      case 'warning': return '#FF9800';
      case 'summary': return C.primary;
      default: return C.textGray;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.textGray
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: C.red,
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 40,
          right: 0,
          width: 380,
          background: C.white,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: 600,
          overflow: 'auto'
        }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${C.bg}`, position: 'sticky', top: 0, background: C.white, borderRadius: '12px 12px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.textDark }}>
                Notifikasi ({notifications.length})
              </span>
              <button
                onClick={fetchNotifications}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textGray }}
              >
                <RotateCw size={16} />
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ padding: 16, textAlign: 'center', color: C.textGray, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Memuat notifikasi...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: C.textGray, fontSize: 13 }}>
              Tidak ada notifikasi
            </div>
          )}

          {!loading && displayedNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              style={{
                padding: 12,
                borderBottom: `1px solid ${C.bg}`,
                background: notif.isRead ? 'white' : '#F5F7FB',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { background: '#F0F2F7' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F7'}
              onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'white' : '#F5F7FB'}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{getIcon(notif.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: getColor(notif.type),
                    marginBottom: 2
                  }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 12, color: C.textGray, marginBottom: 4 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: 10, color: C.textGray }}>
                    {new Date(notif.sentAt).toLocaleDateString('id-ID')} · {new Date(notif.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!notif.isRead && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: C.primary,
                    marginTop: 4,
                    flexShrink: 0
                  }} />
                )}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div style={{ padding: 12, borderTop: `1px solid ${C.bg}`, textAlign: 'center' }}>
              {!showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    background: C.primaryLight,
                    color: C.primary,
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Lihat {notifications.length - 5} Notifikasi Lainnya
                </button>
              ) : (
                <button
                  onClick={() => setShowAll(false)}
                  style={{
                    background: C.primaryLight,
                    color: C.primary,
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Sembunyikan
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
