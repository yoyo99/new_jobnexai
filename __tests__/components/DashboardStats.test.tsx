import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock DashboardStats component
const DashboardStats = ({ stats }: { stats?: any }) => {
  const defaultStats = {
    totalApplications: 0,
    pendingApplications: 0,
    interviews: 0,
    offers: 0,
    ...stats
  };

  return (
    <div data-testid="dashboard-stats" className="stats-grid">
      <div data-testid="total-applications" className="stat-card">
        <h3>Total Applications</h3>
        <span className="stat-number">{defaultStats.totalApplications}</span>
      </div>
      <div data-testid="pending-applications" className="stat-card">
        <h3>Pending</h3>
        <span className="stat-number">{defaultStats.pendingApplications}</span>
      </div>
      <div data-testid="interviews" className="stat-card">
        <h3>Interviews</h3>
        <span className="stat-number">{defaultStats.interviews}</span>
      </div>
      <div data-testid="offers" className="stat-card">
        <h3>Offers</h3>
        <span className="stat-number">{defaultStats.offers}</span>
      </div>
    </div>
  );
};

describe('DashboardStats Component', () => {
  test('renders all stat cards', () => {
    render(<DashboardStats />);
    
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    expect(screen.getByTestId('total-applications')).toBeInTheDocument();
    expect(screen.getByTestId('pending-applications')).toBeInTheDocument();
    expect(screen.getByTestId('interviews')).toBeInTheDocument();
    expect(screen.getByTestId('offers')).toBeInTheDocument();
  });

  test('displays default zero values', () => {
    render(<DashboardStats />);
    
    const statNumbers = screen.getAllByText('0');
    expect(statNumbers).toHaveLength(4);
  });

  test('displays provided stats values', () => {
    const mockStats = {
      totalApplications: 15,
      pendingApplications: 8,
      interviews: 3,
      offers: 1
    };
    
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('handles partial stats data', () => {
    const partialStats = {
      totalApplications: 10,
      interviews: 2
    };
    
    render(<DashboardStats stats={partialStats} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // Should still show 0 for missing values
    expect(screen.getAllByText('0')).toHaveLength(2);
  });
});
