import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingDown, TrendingUp, BarChart2, Calendar } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const STORE_COLORS = {
  'Amazon': '#ff9900',
  'Flipkart': '#2874f0',
  'Croma': '#00e9bf',
  'Reliance Digital': '#e42529',
  'Tata CLiQ': '#da2766',
  'JioMart': '#008ecc',
  'Myntra': '#ff3f6c'
};

export const PriceHistoryChart = ({ priceHistory = [], allTimeLow, allTimeHigh }) => {
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', '3m', '6m', '1y', 'all'

  const { chartData, stats } = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return { chartData: null, stats: null };
    }

    // Sort all points chronologically
    const sorted = [...priceHistory].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
    const now = new Date();

    // Filter by timeframe
    const filtered = sorted.filter(item => {
      if (timeRange === 'all') return true;
      const itemDate = new Date(item.recordedAt);
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
      if (timeRange === '7d') return diffDays <= 7;
      if (timeRange === '30d') return diffDays <= 30;
      if (timeRange === '3m') return diffDays <= 90;
      if (timeRange === '6m') return diffDays <= 180;
      if (timeRange === '1y') return diffDays <= 365;
      return true;
    });

    if (filtered.length === 0) {
      return { chartData: null, stats: null };
    }

    // Calculate stats on filtered slice
    const prices = filtered.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const latestPoint = filtered[filtered.length - 1];

    // Downsample if more than 60 points for ultra-crisp line rendering
    let displayPoints = filtered;
    if (filtered.length > 80) {
      const step = Math.ceil(filtered.length / 60);
      displayPoints = filtered.filter((_, idx) => idx % step === 0 || idx === filtered.length - 1);
    }

    // Check if dates span multiple years
    const firstYear = new Date(displayPoints[0].recordedAt).getFullYear();
    const lastYear = new Date(displayPoints[displayPoints.length - 1].recordedAt).getFullYear();
    const isMultiYear = firstYear !== lastYear;

    const labels = displayPoints.map(p => {
      const d = new Date(p.recordedAt);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: isMultiYear ? '2-digit' : undefined
      });
    });

    // Group by store
    const storesSet = new Set(displayPoints.map(p => p.store || 'Primary Store'));
    const stores = Array.from(storesSet);

    const datasets = stores.map(store => {
      const color = STORE_COLORS[store] || '#6366f1';
      const data = displayPoints.map(p => (p.store === store || stores.length === 1) ? p.price : null);

      return {
        label: store,
        data,
        borderColor: color,
        backgroundColor: `${color}18`,
        borderWidth: 2.5,
        fill: true,
        tension: 0.25,
        spanGaps: true,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: displayPoints.length > 30 ? 2 : 4,
        pointHoverRadius: 6
      };
    });

    return {
      chartData: { labels, datasets },
      stats: {
        minPrice,
        maxPrice,
        avgPrice,
        latestPrice: latestPoint.price,
        totalPoints: filtered.length
      }
    };
  }, [priceHistory, timeRange]);

  if (!chartData || !stats) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <BarChart2 size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
        <p>No historical price data recorded for this timeframe.</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ₹${context.parsed.y.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
        }
      }
    }
  };

  return (
    <div>
      {/* Milestone Stat Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingDown size={12} /> Lowest Price
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
            ₹{stats.minPrice.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#fcd34d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BarChart2 size={12} /> Average Price
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
            ₹{stats.avgPrice.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Highest Price
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-heading)' }}>
            ₹{stats.maxPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Timeframe Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Range:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '8px' }}>
            {[
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '3m', label: '3M' },
              { key: '6m', label: '6M' },
              { key: '1y', label: '1Y' },
              { key: 'all', label: 'All Time' }
            ].map(range => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeRange === range.key ? 'var(--accent-primary)' : 'transparent',
                  color: timeRange === range.key ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {stats.totalPoints} price points tracked
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '260px', width: '100%', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

