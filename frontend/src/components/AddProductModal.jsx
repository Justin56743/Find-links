import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Check, 
  MapPin, 
  ExternalLink, 
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AddProductModal = ({ onClose, onProductAdded }) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [title, setTitle] = useState('');
  const [pincode, setPincode] = useState(user?.defaultPincode || '560001');
  const [storeListings, setStoreListings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleLinks = [
    { label: 'iPhone 15 (Amazon)', url: 'https://www.amazon.in/dp/B0CHX1W1XY' },
    { label: 'MacBook Air M2 (Flipkart)', url: 'https://www.flipkart.com/apple-macbook-air-m2-8-gb-256-gb-ssd-mac-os-monterey-mly33hn-a/p/itmd751b3d5b00ee' },
    { label: 'Sony XM5 Headphones (Amazon)', url: 'https://www.amazon.in/dp/B09XS7JWHH' }
  ];

  const handleFetchPreview = async (inputUrl) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) return;

    try {
      setLoadingPreview(true);
      setErrorMsg('');
      const res = await api.products.preview(targetUrl.trim());
      if (res.success && res.preview) {
        setPreviewData(res.preview);
        setTitle(res.preview.title);
        setStoreListings(res.preview.crossListings || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to extract product details. Please verify the URL.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setErrorMsg('Product title and URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await api.products.create({
        title: title.trim(),
        originalUrl: url.trim(),
        imageUrl: previewData?.imageUrl,
        primaryStore: previewData?.store || 'Amazon',
        pincode: pincode.trim(),
        storeListings: storeListings
      });

      if (res.success && res.product) {
        if (onProductAdded) onProductAdded(res.product);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to track product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '680px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <ShoppingBag color="var(--accent-primary)" size={22} />
            <span>Track New Product in India</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Step 1: Paste Link */}
        <div className="input-group">
          <label className="input-label">Paste Product URL (Amazon India, Flipkart, Croma, etc.)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="url"
              className="input-field"
              placeholder="https://www.amazon.in/dp/... or https://www.flipkart.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFetchPreview(); }}
              autoFocus
            />
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => handleFetchPreview()}
              disabled={loadingPreview || !url.trim()}
            >
              <Search size={16} />
              <span>{loadingPreview ? 'Fetching...' : 'Extract'}</span>
            </button>
          </div>
        </div>

        {/* Sample Links Pill Bar */}
        {!previewData && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Or try a sample link:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {sampleLinks.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  className="badge-store"
                  style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => {
                    setUrl(sample.url);
                    handleFetchPreview(sample.url);
                  }}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Extracted Product Preview & Cross-Store Matches */}
        {previewData && (
          <form onSubmit={handleFormSubmit} style={{ marginTop: '20px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#ffffff',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={previewData.imageUrl} 
                  alt="preview" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>

              <div style={{ flex: 1 }}>
                <input 
                  type="text"
                  className="input-field"
                  style={{ marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Product Title"
                  required
                />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                    ₹{previewData.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="badge badge-store" style={{ textTransform: 'uppercase' }}>
                    Detected on: {previewData.store}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery PIN Code */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#38bdf8" />
                Delivery Location PIN Code
              </label>
              <input 
                type="text"
                maxLength={6}
                className="input-field"
                placeholder="560001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
            </div>

            {/* Matched Retail Stores Overview */}
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
                Retail Store Availability & Live Prices:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {storeListings.map((listing, i) => {
                  const isAvailable = listing.inStock !== false && listing.currentPrice !== null;
                  return (
                    <div 
                      key={i} 
                      className="badge-store"
                      style={{ 
                        padding: '6px 12px', 
                        background: isAvailable ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                        opacity: isAvailable ? 1 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderStyle: isAvailable ? 'solid' : 'dashed'
                      }}
                    >
                      {isAvailable ? (
                        <CheckCircle2 size={12} color="#10b981" />
                      ) : (
                        <XCircle size={12} color="var(--text-muted)" />
                      )}
                      <span>{listing.store}:</span>
                      {isAvailable ? (
                        <strong style={{ color: '#34d399' }}>₹{listing.currentPrice?.toLocaleString('en-IN')}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Not Available</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              disabled={submitting}
              id="confirm-track-btn"
            >
              <Sparkles size={18} />
              <span>{submitting ? 'Adding to Watchlist...' : 'Start 24/7 Price Tracking'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
