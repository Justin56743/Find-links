import React, { useState } from 'react';
import { 
  TrendingDown, 
  ExternalLink, 
  RefreshCw, 
  MapPin, 
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

export const ProductCard = ({ product, onSelectProduct, onProductUpdated }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    try {
      setRefreshing(true);
      const res = await api.products.refresh(product.id);
      if (res.success && onProductUpdated) {
        onProductUpdated(res.product);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const isPriceDropped = product.currentLowestPrice < product.previousLowestPrice;
  const savingsAmount = product.previousLowestPrice - product.currentLowestPrice;
  const discountPercent = Math.round((savingsAmount / product.previousLowestPrice) * 100);

  // Only take in-stock listings with prices
  const availableListings = product.storeListings?.filter(l => l.inStock && l.currentPrice > 0) || [];

  return (
    <div 
      className="glass-panel product-card" 
      onClick={() => onSelectProduct(product)}
      style={{ cursor: 'pointer' }}
    >
      {/* Product Image */}
      <div className="product-img-wrapper">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="product-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />
        
        {/* Floating Best Deal Store Badge */}
        <div className="product-floating-badge">
          <span className="badge badge-success" style={{ boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            <Sparkles size={11} />
            Best Price: {product.lowestStore}
          </span>
        </div>

        {/* PIN Code Badge */}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
          <span style={{ 
            fontSize: '0.72rem', 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(4px)', 
            padding: '2px 8px', 
            borderRadius: '6px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            color: '#cbd5e1'
          }}>
            <MapPin size={11} color="#38bdf8" />
            {product.pincode || '560001'}
          </span>
        </div>
      </div>

      {/* Product Body */}
      <div className="product-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {product.brand || product.category || 'Deal'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {availableListings.length} Stores Available
          </span>
        </div>

        <h3 className="product-title" title={product.title}>
          {product.title}
        </h3>

        {/* Price Section */}
        <div className="product-price-section">
          <span className="current-price">
            ₹{product.currentLowestPrice.toLocaleString('en-IN')}
          </span>

          {product.previousLowestPrice > product.currentLowestPrice && (
            <span className="original-price">
              ₹{product.previousLowestPrice.toLocaleString('en-IN')}
            </span>
          )}

          {isPriceDropped && (
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
              <TrendingDown size={12} />
              Save ₹{savingsAmount.toLocaleString('en-IN')} ({discountPercent}%)
            </span>
          )}
        </div>

        {/* Store Comparison Pills */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
            Live Available Stores:
          </div>
          <div className="store-matrix">
            {availableListings.slice(0, 4).map((listing, i) => {
              const isLowest = listing.currentPrice === product.currentLowestPrice;
              const storeKey = listing.store.toLowerCase().replace(/\s+/g, '');
              return (
                <div 
                  key={i}
                  className={`badge-store ${storeKey}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isLowest ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: isLowest ? '#10b981' : undefined
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{listing.store}:</span>
                  <span style={{ color: isLowest ? '#34d399' : 'var(--text-primary)', fontWeight: 600 }}>
                    ₹{listing.currentPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
            {availableListings.length > 4 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center', padding: '0 4px' }}>
                +{availableListings.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Check real-time price now"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Checking...' : 'Refresh Price'}</span>
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            View Details <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
