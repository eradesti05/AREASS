import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { C } from '../constants/theme';
import { Bell, RotateCw, Loader2, X } from 'lucide-react';

// Keyframe animation styles
const animationStyles = `
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 2px 10px rgba(255, 107, 107, 0.4);
    }
    50% {
      box-shadow: 0 2px 20px rgba(255, 107, 107, 0.6);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Fetch every 30 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifikasi saat dropdown dibuka
  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

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
      // Mark as read dulu sebelum navigate
      if (!notification.isRead) {
        try {
          await notificationAPI.markAsRead(notification._id);
          // Update state lokal
          setNotifications(prev =>
            prev.map(n => n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n)
          );
        } catch (markError) {
          console.error('Error marking as read:', markError);
        }
      }
      
      // Navigate ke tasks
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
      case 'urgent': return '#FF6B6B';
      case 'warning': return '#FF9800';
      case 'summary': return '#667EEA';
      default: return C.textGray;
    }
  };

  const getStatsBadges = (message) => {
    const regex = /Hari ini:\s*([\d\w\s|]+)/;
    const match = message.match(regex);
    
    if (!match) return null;
    
    const stats = match[1].split('|').map(s => s.trim());
    
    return stats.map((stat, idx) => {
      let bgColor = '#F5F5F5';
      let textColor = '#666';
      
      if (stat.includes('total')) {
        bgColor = '#F5F5F5';
        textColor = '#666';
      } else if (stat.includes('progres')) {
        bgColor = '#FFF5E6';
        textColor = '#D97706';
      } else if (stat.includes('selesai')) {
        bgColor = '#ECFDF5';
        textColor = '#059669';
      } else if (stat.includes('urgent')) {
        bgColor = '#FEF2F2';
        textColor = '#DC2626';
      } else if (stat.includes('overdue')) {
        bgColor = '#FDF2F8';
        textColor = '#BE185D';
      }
      
      return { stat, bgColor, textColor };
    });
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'urgent': return '#FEF2F2';
      case 'warning': return '#FEF9F0';
      case 'summary': return '#F0F4FF';
      default: return '#F5F7FB';
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1001 }}>
      <style>{animationStyles}</style>
      {/* Bell Icon Button */}
      <button
        onClick={handleBellClick}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#718EBF',
          padding: '8px',
          borderRadius: '10px',
          transition: 'all 0.2s ease',
          width: 44,
          height: 44,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F5F7FB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Bell size={22} strokeWidth={1.5} style={{ transition: 'all 0.2s' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
            color: 'white',
            borderRadius: '50%',
            minWidth: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            border: '2px solid white',
            boxShadow: '0 2px 10px rgba(255, 107, 107, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 70,
            right: 'max(16px, calc((100vw - 100%) / 2 + 16px))',
            width: 'min(calc(100vw - 32px), 420px)',
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF'
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1A1A1A',
                  letterSpacing: '-0.5px'
                }}>
                  Notifikasi
                </h3>
                <span style={{
                  fontSize: 12,
                  color: '#999',
                  fontWeight: 500,
                  marginTop: 4,
                  display: 'inline-block',
                  letterSpacing: '0.2px'
                }}>
                  {unreadCount} belum dibaca
                </span>
              </div>
              <button
                onClick={fetchNotifications}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  padding: '8px',
                  borderRadius: 8,
                  width: 36,
                  height: 36
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <RotateCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              scrollBehavior: 'smooth',
              paddingTop: 12,
              paddingBottom: 12
            }}>
              {loading ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 200,
                  letterSpacing: '-0.2px'
                }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: 60,
                  textAlign: 'center',
                  color: '#BBB',
                  fontSize: 13,
                  minHeight: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                  Tidak ada notifikasi
                </div>
              ) : (
                <div>
                  {displayedNotifications.map((notif, idx) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '16px 20px',
                        marginBottom: idx === displayedNotifications.length - 1 ? 0 : 8,
                        marginLeft: 12,
                        marginRight: 12,
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
                        borderRadius: 12,
                        borderLeft: `4px solid ${getColor(notif.type)}`,
                        border: `1px solid #F0F0F0`,
                        borderLeftWidth: 4,
                        boxShadow: notif.isRead ? '0 2px 4px rgba(0,0,0,0.05)' : `0 2px 8px ${getColor(notif.type)}15`,
                        opacity: notif.isRead ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 4px 12px ${getColor(notif.type)}25`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = notif.isRead ? '0 2px 4px rgba(0,0,0,0.05)' : `0 2px 8px ${getColor(notif.type)}15`;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, flexDirection: 'column', width: '100%' }}>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            marginBottom: 6
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: 14,
                              color: notif.isRead ? '#ABABAB' : getColor(notif.type),
                              wordBreak: 'break-word',
                              letterSpacing: '-0.3px'
                            }}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <div style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: getColor(notif.type),
                                flexShrink: 0,
                                marginTop: 2
                              }} />
                            )}
                          </div>

                          {notif.type === 'summary' ? (
                            <>
                              <p style={{
                                margin: 0,
                                fontSize: 13,
                                color: notif.isRead ? '#B8B8B8' : '#555',
                                marginBottom: 6,
                                letterSpacing: '-0.2px'
                              }}>
                                Hari ini:
                              </p>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                {getStatsBadges(notif.message)?.map((item, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      background: item.bgColor,
                                      color: item.textColor,
                                      padding: '4px 12px',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      opacity: notif.isRead ? 0.6 : 1
                                    }}
                                  >
                                    {item.stat}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p style={{
                              margin: 0,
                              fontSize: 13,
                              color: notif.isRead ? '#B8B8B8' : '#555',
                              lineHeight: 1.5,
                              marginBottom: 6,
                              wordBreak: 'break-word',
                              letterSpacing: '-0.2px'
                            }}>
                              {notif.message}
                            </p>
                          )}

                          <span style={{
                            fontSize: 11,
                            color: notif.isRead ? '#D5D5D5' : '#999',
                            fontWeight: 500,
                            letterSpacing: '0.2px'
                          }}>
                            {new Date(notif.sentAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })} · {new Date(notif.sentAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Load More / Show All */}
            {hasMore && !loading && (
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid #F0F0F0',
                textAlign: 'center',
                backgroundColor: '#FFFFFF'
              }}>
                <button
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    background: '#64748B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.2)',
                    letterSpacing: '-0.3px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#475569';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#64748B';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(100, 116, 139, 0.2)';
                  }}
                >
                  {!showAll ? `Lihat ${notifications.length - 5} Lagi` : 'Sembunyikan'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
