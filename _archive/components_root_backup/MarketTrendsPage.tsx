import React from 'react'
import { MarketAnalysis } from './MarketAnalysis';

export function MarketTrendsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Market Trends Analysis
      </h1>
      <MarketAnalysis />
    </div>
  );
}

export default MarketTrendsPage;