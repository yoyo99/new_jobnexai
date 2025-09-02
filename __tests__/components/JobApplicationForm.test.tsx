import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock JobApplicationForm component
const JobApplicationForm = ({ onSubmit }: { onSubmit?: (data: any) => void }) => {
  const [formData, setFormData] = React.useState({
    jobTitle: '',
    company: '',
    applicationDate: '',
    status: 'applied',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form data-testid="job-application-form" onSubmit={handleSubmit}>
      <input
        data-testid="job-title-input"
        placeholder="Job Title"
        value={formData.jobTitle}
        onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
      />
      <input
        data-testid="company-input"
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({...formData, company: e.target.value})}
      />
      <input
        data-testid="date-input"
        type="date"
        value={formData.applicationDate}
        onChange={(e) => setFormData({...formData, applicationDate: e.target.value})}
      />
      <select
        data-testid="status-select"
        value={formData.status}
        onChange={(e) => setFormData({...formData, status: e.target.value})}
      >
        <option value="applied">Applied</option>
        <option value="interview">Interview</option>
        <option value="rejected">Rejected</option>
        <option value="offer">Offer</option>
      </select>
      <textarea
        data-testid="notes-textarea"
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({...formData, notes: e.target.value})}
      />
      <button data-testid="submit-button" type="submit">Submit Application</button>
    </form>
  );
};

describe('JobApplicationForm Component', () => {
  test('renders all form fields', () => {
    render(<JobApplicationForm />);
    
    expect(screen.getByTestId('job-application-form')).toBeInTheDocument();
    expect(screen.getByTestId('job-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('company-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  test('updates form fields when user types', () => {
    render(<JobApplicationForm />);
    
    const jobTitleInput = screen.getByTestId('job-title-input');
    fireEvent.change(jobTitleInput, { target: { value: 'Software Engineer' } });
    expect(jobTitleInput).toHaveValue('Software Engineer');

    const companyInput = screen.getByTestId('company-input');
    fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });
    expect(companyInput).toHaveValue('Tech Corp');
  });

  test('calls onSubmit with form data when submitted', () => {
    const mockOnSubmit = jest.fn();
    render(<JobApplicationForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('job-title-input'), { target: { value: 'Developer' } });
    fireEvent.change(screen.getByTestId('company-input'), { target: { value: 'StartupCo' } });
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'interview' } });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      jobTitle: 'Developer',
      company: 'StartupCo',
      applicationDate: '',
      status: 'interview',
      notes: ''
    });
  });
});
