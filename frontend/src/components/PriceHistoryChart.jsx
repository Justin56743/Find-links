import React, { useState } from 'react';
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

export const PriceHistoryChart = ({ priceHistory = [], allTimeLow }) => {
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', 'all'

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No historical price data points recorded yet.
      </div>
    );
  }

  // Filter based on time range
  const now = new Date();
  const filteredHistory = priceHistory.filter(item => {
    if (timeRange === 'all') return true;
    const itemDate = new Date(item.recordedAt);
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
    if (timeRange === '7d') return diffDays <= 7;
    if (timeRange === '30d') return diffDays <= 30;
    return true;
  });

  // Group price points by recorded date
  const dateMap = new Map();
  const storesSet = new Set();

  filteredHistory.forEach(item => {
    const d = new Date(item.recordedAt);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    storesSet.add(item.store);

    if (!dateMap.has(label)) {
      dateMap.set(label, {});
    }
    dateMap.get(label)[item.store] = item.price;
  });

  const labels = Array.from(dateMap.keys());
  const stores = Array.from(storesSet);

  const datasets = stores.map(store => {
    const color = STORE_COLORS[store] || '#6366f1';
    const data = labels.map(label => dateMap.get(label)[store] || null);

    return {
      label: store,
      data,
      borderColor: color,
      backgroundColor: `${color}15`,
      borderWidth: 2.5,
      tension: 0.3,
      spanGaps: true,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      pointRadius: 4,
      pointHoverRadius: 7
    };
  });

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
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 11 } }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Timeframe:</span>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
            {['7d', '30d', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeRange === range ? 'var(--accent-primary)' : 'transparent',
                  color: timeRange === range ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {allTimeLow && (
          <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>All-Time Low:</span>
            <strong>₹{allTimeLow.toLocaleString('en-IN')}</strong>
          </div>
        )}
      </div>

      <div style={{ height: '260px', width: '100%', position: 'relative' }}>
        <Line data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
};
