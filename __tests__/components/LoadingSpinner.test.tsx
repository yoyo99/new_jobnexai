import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders loading spinner', () => {
    render(<LoadingSpinner />);
    
    // Look for spinner element or loading text
    const spinner = screen.queryByRole('status') || screen.queryByText(/loading|chargement/i);
    expect(spinner).toBeTruthy();
  });

  test('renders with custom message', () => {
    render(<LoadingSpinner message="Custom loading message" />);
    
    const customMessage = screen.queryByText(/custom loading message/i);
    expect(customMessage).toBeTruthy();
  });

  test('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    // Check for aria-label or role attributes
    const element = screen.queryByRole('status') || screen.queryByLabelText(/loading/i);
    expect(element).toBeTruthy();
  });
});
