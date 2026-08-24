import React from 'react';
import { 
  X, 
  CheckCheck, 
  Trash2, 
  TrendingDown, 
  Target, 
  Bell, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationDrawer = () => {
  const { 
    notifications, 
    unreadCount, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  if (!isDrawerOpen) return null;

  const timeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Notifications</h3>
            {unreadCount > 0 && (
              <span className="badge badge-danger">{unreadCount} New</span>
            )}
          </div>

          <button className="btn btn-secondary btn-icon" onClick={() => setIsDrawerOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Subheader Actions */}
        {notifications.length > 0 && (
          <div style={{
            padding: '10px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={markAllAsRead}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          </div>
        )}

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No price drop alerts yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                We'll notify you here and on Telegram when a tracked item gets discounted!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  style={{
                    background: notif.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.08)',
                    border: `1px solid ${notif.isRead ? 'var(--border-subtle)' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {notif.type === 'TARGET_REACHED' ? (
                        <Target size={14} color="#fbbf24" />
                      ) : (
                        <TrendingDown size={14} color="#10b981" />
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: notif.type === 'TARGET_REACHED' ? '#fbbf24' : '#34d399' }}>
                        {notif.type === 'TARGET_REACHED' ? 'TARGET REACHED' : 'PRICE DROP'}
                      </span>
                      {notif.store && (
                        <span className="badge-store" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {notif.store}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '10px' }}>
                    {notif.message}
                  </p>

                  {notif.oldPrice && notif.newPrice && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{notif.oldPrice.toLocaleString('en-IN')}
                      </span>
                      <span>→</span>
                      <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>
                        ₹{notif.newPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    {notif.sentToTelegram && (
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={11} /> Sent to Telegram
                      </span>
                    )}

                    <button 
                      className="btn btn-secondary btn-icon"
                      style={{ width: '24px', height: '24px', marginLeft: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      title="Delete notification"
                    >
                      <Trash2 size={12} color="var(--text-muted)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
