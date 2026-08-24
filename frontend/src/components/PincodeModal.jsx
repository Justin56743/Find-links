import React, { useState } from 'react';
import { X, MapPin, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PincodeModal = ({ onClose }) => {
  const { user, updatePincode } = useAuth();
  const [pincode, setPincode] = useState(user?.defaultPincode || '560001');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const popularCities = [
    { name: 'Bangalore', pin: '560001' },
    { name: 'Mumbai', pin: '400001' },
    { name: 'Delhi', pin: '110001' },
    { name: 'Hyderabad', pin: '500001' },
    { name: 'Chennai', pin: '600001' },
    { name: 'Kolkata', pin: '700001' },
    { name: 'Pune', pin: '411001' },
    { name: 'Ahmedabad', pin: '380001' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await updatePincode(pincode.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update PIN code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '460px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <MapPin color="#38bdf8" size={22} />
            <span>Delivery Location PIN Code</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
          Set your default 6-digit Indian PIN code to check store delivery availability, delivery speed, and local retailer pricing.
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.82rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Indian Postal PIN Code</label>
            <input 
              type="text"
              maxLength={6}
              className="input-field"
              placeholder="e.g. 560001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Quick Select Metro Cities:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {popularCities.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="badge-store"
                  style={{
                    cursor: 'pointer',
                    background: pincode === city.pin ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                    borderColor: pincode === city.pin ? 'var(--accent-primary)' : undefined
                  }}
                  onClick={() => setPincode(city.pin)}
                >
                  {city.name} ({city.pin})
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={saving}
          >
            <Check size={16} />
            <span>{saving ? 'Updating...' : 'Save Default Location'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
