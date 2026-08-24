import React from 'react';
import { Package, TrendingDown, IndianRupee, Store } from 'lucide-react';

export const StatCards = ({ products }) => {
  const totalTracked = products.length;
  
  // Count items where current price is lower than previous or allTimeHigh
  const activeDrops = products.filter(p => p.currentLowestPrice < p.previousLowestPrice || p.currentLowestPrice < p.allTimeHigh).length;

  // Calculate total savings
  const totalSavings = products.reduce((acc, p) => {
    const diff = (p.allTimeHigh || p.previousLowestPrice) - p.currentLowestPrice;
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  const stats = [
    {
      label: 'Tracked Products',
      value: totalTracked,
      icon: <Package color="#6366f1" size={24} />,
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)'
    },
    {
      label: 'Active Price Drops',
      value: activeDrops,
      icon: <TrendingDown color="#10b981" size={24} />,
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)'
    },
    {
      label: 'Total Savings Tracked',
      value: `₹${totalSavings.toLocaleString('en-IN')}`,
      icon: <IndianRupee color="#f59e0b" size={24} />,
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)'
    },
    {
      label: 'Indian Retail Stores',
      value: '7 Stores',
      icon: <Store color="#ec4899" size={24} />,
      bg: 'rgba(236, 72, 153, 0.12)',
      border: 'rgba(236, 72, 153, 0.25)'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="glass-panel stat-card"
          style={{ border: `1px solid ${stat.border}` }}
        >
          <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bg }}>
            {stat.icon}
          </div>
          <div>
            <div className="stat-val">{stat.value}</div>
            <div className="stat-lbl">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
