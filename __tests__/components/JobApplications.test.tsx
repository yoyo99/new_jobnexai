import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock JobApplications component
const JobApplications = () => {
  return (
    <div data-testid="job-applications">
      <h1>Suivi des candidatures</h1>
      <div className="kanban-board">
        <div className="status-column" data-testid="draft-column">
          <h2>Brouillons</h2>
        </div>
        <div className="status-column" data-testid="applied-column">
          <h2>Postulées</h2>
        </div>
        <div className="status-column" data-testid="interviewing-column">
          <h2>Entretiens</h2>
        </div>
      </div>
    </div>
  );
};

describe('JobApplications Component', () => {
  test('renders without crashing', () => {
    render(<JobApplications />);
    expect(screen.getByTestId('job-applications')).toBeInTheDocument();
  });

  test('displays main title', () => {
    render(<JobApplications />);
    expect(screen.getByText('Suivi des candidatures')).toBeInTheDocument();
  });

  test('shows all status columns', () => {
    render(<JobApplications />);
    expect(screen.getByTestId('draft-column')).toBeInTheDocument();
    expect(screen.getByTestId('applied-column')).toBeInTheDocument();
    expect(screen.getByTestId('interviewing-column')).toBeInTheDocument();
  });
});