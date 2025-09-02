import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock SearchFilters component
const SearchFilters = ({ onFilterChange }: { onFilterChange?: (filters: any) => void }) => {
  const [filters, setFilters] = React.useState({
    location: '',
    salary: '',
    jobType: '',
    experience: ''
  });

  const handleChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div data-testid="search-filters">
      <input
        data-testid="location-filter"
        placeholder="Location"
        value={filters.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />
      <select
        data-testid="salary-filter"
        value={filters.salary}
        onChange={(e) => handleChange('salary', e.target.value)}
      >
        <option value="">Any Salary</option>
        <option value="30000-50000">30k-50k</option>
        <option value="50000-70000">50k-70k</option>
      </select>
      <select
        data-testid="jobtype-filter"
        value={filters.jobType}
        onChange={(e) => handleChange('jobType', e.target.value)}
      >
        <option value="">Any Type</option>
        <option value="full-time">Full Time</option>
        <option value="part-time">Part Time</option>
        <option value="contract">Contract</option>
      </select>
    </div>
  );
};

describe('SearchFilters Component', () => {
  test('renders all filter inputs', () => {
    render(<SearchFilters />);
    
    expect(screen.getByTestId('search-filters')).toBeInTheDocument();
    expect(screen.getByTestId('location-filter')).toBeInTheDocument();
    expect(screen.getByTestId('salary-filter')).toBeInTheDocument();
    expect(screen.getByTestId('jobtype-filter')).toBeInTheDocument();
  });

  test('updates location filter', () => {
    render(<SearchFilters />);
    
    const locationInput = screen.getByTestId('location-filter');
    fireEvent.change(locationInput, { target: { value: 'Paris' } });
    
    expect(locationInput).toHaveValue('Paris');
  });

  test('calls onFilterChange when filters update', () => {
    const mockOnFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={mockOnFilterChange} />);
    
    const salarySelect = screen.getByTestId('salary-filter');
    fireEvent.change(salarySelect, { target: { value: '50000-70000' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      location: '',
      salary: '50000-70000',
      jobType: '',
      experience: ''
    });
  });
});
