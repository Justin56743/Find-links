import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  ShoppingBag, 
  MapPin, 
  Plus, 
  Bell, 
  Send, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Navbar = ({ onOpenAddModal, onOpenTelegramModal, onOpenPincodeModal, onOpenAuthModal }) => {
  const { user, logout } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="nav-brand">
          <div className="brand-icon">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">Find-Links</span>
              <span className="brand-badge">India v1.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} color="var(--accent-primary)" />
              Multi-Store Price Tracker & Deals
            </div>
          </div>
        </div>

        <div className="nav-actions">
          {/* Location / PIN code Pill */}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onOpenPincodeModal}
            title="Click to change your delivery location PIN code"
            style={{ borderRadius: '999px', padding: '6px 14px' }}
          >
            <MapPin size={14} color="#38bdf8" />
            <span style={{ color: 'var(--text-secondary)' }}>PIN:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.defaultPincode || '560001'}
            </span>
          </button>

          {/* Telegram Status Button */}
          <button 
            className={`btn btn-sm ${user?.telegramChatId ? 'btn-secondary' : 'btn-telegram'}`}
            onClick={onOpenTelegramModal}
            style={{ borderRadius: '999px', padding: '6px 14px' }}
          >
            <Send size={14} />
            {user?.telegramChatId ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                <span>Telegram Active</span>
              </span>
            ) : (
              <span>Connect Telegram</span>
            )}
          </button>

          {/* Add Product Button */}
          <button 
            className="btn btn-primary"
            onClick={onOpenAddModal}
            id="add-product-btn"
          >
            <Plus size={16} />
            <span>Track Product</span>
          </button>

          {/* Notifications Bell */}
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={() => setIsDrawerOpen(true)}
            style={{ position: 'relative' }}
            title="Price Drop Notifications"
            id="notifications-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
                animation: 'pulse 1.5s infinite'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Account / Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
              </div>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={logout}
                title="Log Out"
              >
                <LogOut size={16} color="var(--text-muted)" />
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={onOpenAuthModal}>
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
