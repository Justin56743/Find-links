import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { ProductCard } from './components/ProductCard';
import { AddProductModal } from './components/AddProductModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { TelegramSettingsModal } from './components/TelegramSettingsModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PincodeModal } from './components/PincodeModal';
import { AuthModal } from './components/AuthModal';
import { 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  TrendingDown, 
  RefreshCw, 
  ShoppingBag,
  SlidersHorizontal,
  Send,
  Layers
} from 'lucide-react';

export function App() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'price_asc', 'price_desc', 'discount'
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.products.list();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleProductAdded = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    refreshNotifications();
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
  };

  const handleProductDeleted = (deletedId) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId));
  };

  // Filter & Sort Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStore = storeFilter === 'ALL' || 
                         p.lowestStore?.toLowerCase() === storeFilter.toLowerCase() ||
                         p.storeListings?.some(l => l.store.toLowerCase() === storeFilter.toLowerCase());

    return matchesSearch && matchesStore;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.currentLowestPrice - b.currentLowestPrice;
    if (sortBy === 'price_desc') return b.currentLowestPrice - a.currentLowestPrice;
    if (sortBy === 'discount') {
      const discA = (a.allTimeHigh || a.previousLowestPrice) - a.currentLowestPrice;
      const discB = (b.allTimeHigh || b.previousLowestPrice) - b.currentLowestPrice;
      return discB - discA;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar 
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="container" style={{ paddingBottom: '80px' }}>
        {/* Hero Section */}
        <section style={{ marginTop: '36px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '12px' }}>
                <Sparkles size={13} color="var(--accent-primary)" />
                Real-Time Multi-Store Price Engine for India
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15 }}>
                Track Prices Across Top Indian Retailers
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1rem', maxWidth: '640px' }}>
                Compare live prices from Amazon.in, Flipkart, Croma, Reliance Digital, Tata CLiQ, JioMart & Myntra with automated Telegram alerts every 10 minutes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-telegram"
                onClick={() => setIsTelegramModalOpen(true)}
              >
                <Send size={16} />
                <span>Configure Telegram Bot</span>
              </button>

              <button 
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} />
                <span>Track New Product</span>
              </button>
            </div>
          </div>
        </section>

        {/* Real-time Statistics Cards */}
        <StatCards products={products} />

        {/* Watchlist Controls & Filters */}
        <section style={{ marginTop: '36px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '440px' }}>
              <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="input-field"
                placeholder="Search products by name, brand, or model..."
                style={{ paddingLeft: '42px', marginBottom: 0 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Retail Store */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {['ALL', 'Amazon', 'Flipkart', 'Croma', 'Reliance Digital'].map((store) => (
                  <button
                    key={store}
                    type="button"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: storeFilter === store ? 'var(--accent-primary)' : 'transparent',
                      color: storeFilter === store ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setStoreFilter(store)}
                  >
                    {store === 'ALL' ? 'All Stores' : store}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select 
                className="input-field" 
                style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem', marginBottom: 0, cursor: 'pointer' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Sort by: Recently Checked</option>
                <option value="discount">Sort by: Biggest Savings (₹)</option>
                <option value="price_asc">Sort by: Price (Low to High)</option>
                <option value="price_desc">Sort by: Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px' }} />
              <p>Scanning retail store prices for your location...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                {searchQuery || storeFilter !== 'ALL' ? 'No matching products found' : 'Your Price Watchlist is Empty'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
                Paste any product link from Amazon India, Flipkart, Croma or Reliance Digital to begin tracking price drops and get Telegram alerts.
              </p>
              <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16} />
                <span>Track Your First Product</span>
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onProductUpdated={handleProductUpdated}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals & Drawers */}
      {isAddModalOpen && (
        <AddProductModal 
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={handleProductAdded}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
        />
      )}

      {isTelegramModalOpen && (
        <TelegramSettingsModal 
          onClose={() => setIsTelegramModalOpen(false)}
        />
      )}

      {isPincodeModalOpen && (
        <PincodeModal 
          onClose={() => setIsPincodeModalOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      <NotificationDrawer />
    </div>
  );
}
