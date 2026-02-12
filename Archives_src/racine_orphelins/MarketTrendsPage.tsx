tsx
import React from 'react';
import { MarketAnalysis } from './MarketAnalysis';
import { DashboardLayout } from './DashboardLayout';

const MarketTrendsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Market Trends Analysis
        </h1>
        <MarketAnalysis />
      </div>
    </DashboardLayout>
  );
};

export default MarketTrendsPage;