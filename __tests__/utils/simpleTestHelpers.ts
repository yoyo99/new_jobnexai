import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test wrapper without complex dependencies
export const renderSimple = (component: React.ReactElement) => {
  return render(component);
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

// Mock job data
export const mockJob = {
  id: 'test-job-id',
  title: 'Software Engineer',
  company: 'Test Company',
  location: 'Remote',
  description: 'Test job description',
  salary: '50000-70000',
  posted_date: '2025-01-01',
};
