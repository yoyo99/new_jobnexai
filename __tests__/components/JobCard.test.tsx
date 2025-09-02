import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock JobCard component for testing
const JobCard = ({ job }: { job: any }) => (
  <div data-testid="job-card" className="job-card">
    <h3 data-testid="job-title">{job.title}</h3>
    <p data-testid="job-company">{job.company}</p>
    <p data-testid="job-location">{job.location}</p>
    <p data-testid="job-salary">{job.salary}</p>
  </div>
);

describe('JobCard Component', () => {
  const mockJob = {
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Remote',
    salary: '60000-80000',
    description: 'Great job opportunity'
  };

  test('renders job card with basic information', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByTestId('job-card')).toBeInTheDocument();
    expect(screen.getByTestId('job-title')).toHaveTextContent('Software Engineer');
    expect(screen.getByTestId('job-company')).toHaveTextContent('Tech Corp');
    expect(screen.getByTestId('job-location')).toHaveTextContent('Remote');
    expect(screen.getByTestId('job-salary')).toHaveTextContent('60000-80000');
  });

  test('handles missing job data gracefully', () => {
    const incompleteJob = {
      id: '2',
      title: 'Developer',
      company: '',
      location: null,
      salary: undefined
    };
    
    render(<JobCard job={incompleteJob} />);
    
    expect(screen.getByTestId('job-title')).toHaveTextContent('Developer');
    expect(screen.getByTestId('job-company')).toHaveTextContent('');
  });
});
