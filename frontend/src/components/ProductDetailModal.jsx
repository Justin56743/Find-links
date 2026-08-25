import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  TrendingDown, 
  MapPin, 
  Sparkles, 
  Check, 
  Play, 
  Edit3,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../api/client';
import { PriceHistoryChart } from './PriceHistoryChart';

export const ProductDetailModal = ({ product: initialProduct, onClose, onProductDeleted, onProductUpdated }) => {
  const [product, setProduct] = useState(initialProduct);
  const [pincodeInput, setPincodeInput] = useState(product?.pincode || '560001');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [customStoreUrl, setCustomStoreUrl] = useState('');

  // Fetch full details with complete price history
  useEffect(() => {
    if (initialProduct?.id) {
      api.products.get(initialProduct.id)
        .then(res => {
          if (res.success) {
            setProduct(res.product);
            setPincodeInput(res.product.pincode || '560001');
          }
        })
        .catch(console.error);
    }
  }, [initialProduct?.id]);

  if (!product) return null;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const res = await api.products.update(product.id, {
        pincode: pincodeInput.trim()
      });
      if (res.success) {
        setProduct(prev => ({
          ...prev,
          pincode: res.product.pincode
        }));
        if (onProductUpdated) onProductUpdated(res.product);
        setSaveSuccessMsg('Delivery PIN location updated successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.products.refresh(product.id);
      if (res.success) {
        setProduct(res.product);
        if (onProductUpdated) onProductUpdated(res.product);
      }
    } catch (err) {
      alert('Price refresh failed: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulatePriceDrop = async () => {
    try {
      setIsSimulating(true);
      const res = await api.products.simulateDrop(product.id, 10);
      if (res.success) {
        setProduct(res.product);
        if (onProductUpdated) onProductUpdated(res.product);
        alert('🎉 10% Price Drop simulated! Notification created & Telegram alert dispatched.');
      }
    } catch (err) {
      alert('Simulation failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to stop tracking this product?')) {
      try {
        await api.products.delete(product.id);
        if (onProductDeleted) onProductDeleted(product.id);
        onClose();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  const handleSaveStoreUrl = async (storeListingId) => {
    try {
      const res = await api.products.update(product.id, {
        storeListings: [{ id: storeListingId, url: customStoreUrl }]
      });
      if (res.success) {
        setProduct(prev => ({
          ...prev,
          storeListings: prev.storeListings.map(l => l.id === storeListingId ? { ...l, url: customStoreUrl } : l)
        }));
        setEditingStoreId(null);
      }
    } catch (err) {
      alert('Failed to update URL');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '840px', padding: '32px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-success">
              <Sparkles size={12} /> Best Deal: {product.lowestStore}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Last checked: {product.lastCheckedAt ? new Date(product.lastCheckedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Product Hero Info */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '130px',
            height: '130px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {product.brand || product.category}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '12px' }}>
              {product.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                ₹{product.currentLowestPrice.toLocaleString('en-IN')}
              </span>
              {product.allTimeHigh > product.currentLowestPrice && (
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{product.allTimeHigh.toLocaleString('en-IN')}
                </span>
              )}
              <span className="badge badge-store" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)' }}>
                All-Time Low: ₹{product.allTimeLow.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery PIN Code Toolbar */}
        <form 
          onSubmit={handleSaveSettings}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '240px' }}>
            <MapPin size={16} color="#38bdf8" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Delivery Location PIN Code</label>
              <input 
                type="text"
                maxLength={6}
                className="input-field"
                style={{ padding: '6px 10px', fontSize: '0.85rem', marginBottom: 0 }}
                placeholder="560001"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              disabled={isSavingSettings}
            >
              <Check size={14} />
              <span>{isSavingSettings ? 'Saving...' : 'Update PIN Location'}</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div style={{ width: '100%', fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} /> {saveSuccessMsg}
            </div>
          )}
        </form>

        {/* Section 1: Store-by-Store Comparison Matrix */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Indian Retailers Price Comparison</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              (PIN: {product.pincode || '560001'})
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {product.storeListings?.map((listing) => {
              const isAvailable = listing.inStock && listing.currentPrice > 0;
              const isLowest = isAvailable && listing.currentPrice === product.currentLowestPrice;
              const storeKey = listing.store.toLowerCase().replace(/\s+/g, '');
              const isEditing = editingStoreId === listing.id;

              return (
                <div 
                  key={listing.id}
                  style={{
                    background: isLowest 
                      ? 'rgba(16, 185, 129, 0.08)' 
                      : isAvailable 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${isLowest ? 'rgba(16, 185, 129, 0.4)' : isAvailable ? 'var(--border-subtle)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    opacity: isAvailable ? 1 : 0.65
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
                    <span className={`badge-store ${storeKey}`} style={{ fontSize: '0.85rem' }}>
                      {listing.store}
                    </span>
                    {isLowest && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        Lowest Price
                      </span>
                    )}
                    {!isAvailable && (
                      <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> Item Not Found
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isAvailable ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isLowest ? '#34d399' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          ₹{listing.currentPrice.toLocaleString('en-IN')}
                        </div>
                        {listing.mrp && listing.mrp > listing.currentPrice && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            MRP: <s style={{ marginRight: '4px' }}>₹{listing.mrp.toLocaleString('en-IN')}</s>
                            <span style={{ color: '#fbbf24' }}>({listing.discountPercent}% OFF)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, fontStyle: 'italic' }}>
                        Does not exist on {listing.store}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '140px' }}>
                      {isAvailable ? (listing.deliveryInfo || 'Available for delivery') : `Not carried by ${listing.store}`}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isAvailable && listing.url ? (
                        <a 
                          href={listing.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`btn btn-sm ${isLowest ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px' }}
                        >
                          <span>Buy on {listing.store}</span>
                          <ExternalLink size={13} />
                        </a>
                      ) : (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px', opacity: 0.4, cursor: 'not-allowed' }}
                          disabled
                        >
                          Not Available
                        </button>
                      )}

                      {isAvailable && (
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          title="Edit direct store link"
                          onClick={() => {
                            if (isEditing) {
                              setEditingStoreId(null);
                            } else {
                              setEditingStoreId(listing.id);
                              setCustomStoreUrl(listing.url);
                            }
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* URL Editor Sub-panel */}
                  {isEditing && (
                    <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', gap: '8px' }}>
                      <input 
                        type="url"
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        placeholder={`Paste exact product link for ${listing.store}`}
                        value={customStoreUrl}
                        onChange={(e) => setCustomStoreUrl(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveStoreUrl(listing.id)}
                      >
                        Save Link
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Interactive Historical Price Chart */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
            Multi-Store Price History & Trend
          </h3>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <PriceHistoryChart 
              priceHistory={product.priceHistory || []} 
              allTimeLow={product.allTimeLow} 
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Checking...' : 'Refresh All Stores'}</span>
            </button>

            {/* Test Simulation Button */}
            <button 
              className="btn btn-sm" 
              style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              onClick={handleSimulatePriceDrop}
              disabled={isSimulating}
              title="Test real-time price drop notification & Telegram dispatch"
            >
              <Play size={13} />
              <span>{isSimulating ? 'Simulating...' : 'Test Drop Alert (10%)'}</span>
            </button>
          </div>

          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            <span>Remove Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
