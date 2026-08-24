import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Sparkles, 
  Trash2,
  BellRing
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const TelegramSettingsModal = ({ onClose }) => {
  const { user, updateTelegramInfo } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [manualChatId, setManualChatId] = useState(user?.telegramChatId || '');
  const [manualUsername, setManualUsername] = useState(user?.telegramUsername || '');
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.telegram.status()
      .then(res => {
        if (res.success) {
          setStatusData(res);
          if (res.telegramChatId) {
            setManualChatId(res.telegramChatId);
            setManualUsername(res.telegramUsername || '');
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleCopyLink = () => {
    if (statusData?.connectUrl) {
      navigator.clipboard.writeText(statusData.connectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!manualChatId.trim()) {
      setMsg({ type: 'error', text: 'Please enter a valid Telegram Chat ID.' });
      return;
    }

    try {
      setSaving(true);
      const res = await api.telegram.connect(manualChatId.trim(), manualUsername.trim());
      if (res.success) {
        updateTelegramInfo(res.user.telegramChatId, res.user.telegramUsername);
        setMsg({ type: 'success', text: 'Telegram account linked successfully! Welcome message sent.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to link Telegram account.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestPing = async () => {
    try {
      setSendingTest(true);
      const res = await api.telegram.testMessage();
      if (res.success) {
        setMsg({ 
          type: 'success', 
          text: res.simulated 
            ? 'Test message simulated successfully! (Add real TELEGRAM_BOT_TOKEN in .env for direct Telegram app delivery)' 
            : 'Test message sent to your Telegram app!' 
        });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to send test message.' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect your Telegram alerts?')) {
      try {
        await api.telegram.disconnect();
        updateTelegramInfo(null, null);
        setManualChatId('');
        setManualUsername('');
        setMsg({ type: 'success', text: 'Telegram disconnected.' });
      } catch (err) {
        setMsg({ type: 'error', text: err.message });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '580px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Send color="#229ED9" size={22} />
            <span>Telegram Price Drop Alerts</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msg.type === 'success' ? '#34d399' : '#f87171',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        {/* Option 1: 1-Click Connect URL */}
        <div style={{
          background: 'rgba(34, 158, 217, 0.08)',
          border: '1px solid rgba(34, 158, 217, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            Method 1: Instant 1-Click Bot Connect
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Open the official Find-Links Telegram bot and tap <b>START</b> to link your watchlist automatically.
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a 
              href={statusData?.connectUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-telegram"
              style={{ flex: 1, minWidth: '180px' }}
            >
              <Send size={15} />
              <span>Open @{statusData?.botUsername || 'FindLinksAlertBot'}</span>
              <ExternalLink size={14} />
            </a>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCopyLink}
              title="Copy link"
            >
              {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Manual Chat ID / Verification */}
        <form onSubmit={handleManualSave} style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>
            Method 2: Enter Telegram Chat ID Manually
          </h4>

          <div className="input-group">
            <label className="input-label">Your Telegram Chat ID</label>
            <input 
              type="text"
              className="input-field"
              placeholder="e.g. 123456789 (Get it from @userinfobot)"
              value={manualChatId}
              onChange={(e) => setManualChatId(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Tip: Message <code>@userinfobot</code> on Telegram to see your numeric Chat ID.
            </span>
          </div>

          <div className="input-group">
            <label className="input-label">Telegram Username (Optional)</label>
            <input 
              type="text"
              className="input-field"
              placeholder="e.g. your_username"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save & Link Telegram'}</span>
            </button>

            {user?.telegramChatId && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleSendTestPing}
                disabled={sendingTest}
                title="Send test message to your Telegram chat"
              >
                <BellRing size={16} color="#fbbf24" />
                <span>{sendingTest ? 'Sending...' : 'Test Ping'}</span>
              </button>
            )}
          </div>
        </form>

        {user?.telegramChatId && (
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-danger btn-sm"
              onClick={handleDisconnect}
            >
              <Trash2 size={13} />
              <span>Disconnect Telegram</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
